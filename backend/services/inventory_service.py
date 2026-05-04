from backend.database import get_supabase
from datetime import datetime

class InventoryService:
    @staticmethod
    def create_sale_order(sale_data: dict, stock_id: int):
        supabase = get_supabase()
        
        # 1. Get all stock entries for this product
        res = supabase.table("stock").select("*").execute()
        all_stocks = res.data
        if not all_stocks:
            raise Exception("Could not fetch stocks")
            
        product_name = sale_data.get('product_name')
        product_stocks = [s for s in all_stocks if s['product_name'] == product_name]
        # Sort by order_date (FIFO)
        product_stocks.sort(key=lambda s: s['order_date'] if s['order_date'] else '9999-12-31')

        if not product_stocks:
            raise Exception(f"No stock found for product: {product_name}")

        # Find reference stock for price calculation
        reference_stock = next((s for s in product_stocks if s['id'] == stock_id), product_stocks[0])

        # 3. Calculate unit price
        unit_price = reference_stock.get('price_per_litre', 0)
        if not unit_price or unit_price == 0:
            divisor = reference_stock['volume'] if reference_stock['volume'] > 0 else (reference_stock['stock_quantity'] if reference_stock['stock_quantity'] > 0 else 1)
            unit_price = reference_stock['total_price'] / divisor

        # 4. Calculate amount and volume
        quantity = sale_data.get('quantity', 0)
        amount = unit_price * quantity
        
        volume_sold = sale_data.get('volume')
        if not volume_sold or volume_sold == 0:
            if reference_stock['volume'] > 0:
                volume_sold = (reference_stock['stock_quantity'] / reference_stock['volume']) * quantity
            else:
                volume_sold = 0

        updated_sale = {
            **sale_data,
            "amount": amount,
            "volume": volume_sold,
            "product_id": reference_stock['product_id'],
            "other_price": sale_data.get("other_price", 0),
            "total_price": sale_data.get("total_price") or (amount + sale_data.get("other_price", 0))
        }

        # 5. Create sale order
        sale_res = supabase.table("sales").insert([updated_sale]).execute()
        sale_id = sale_res.data[0]['id']

        # 6. FIFO Reduction
        remaining_qty = quantity
        remaining_vol = volume_sold

        for stock_item in product_stocks:
            if remaining_qty <= 0 and remaining_vol <= 0:
                break
            
            deduct_qty = min(float(stock_item['volume']), float(remaining_qty))
            deduct_vol = min(float(stock_item['stock_quantity']), float(remaining_vol))

            new_qty = float(stock_item['volume']) - deduct_qty
            new_vol = float(stock_item['stock_quantity']) - deduct_vol

            supabase.table("stock").update({
                "stock_quantity": new_vol,
                "volume": new_qty
            }).eq("id", stock_item['id']).execute()

            remaining_qty -= deduct_qty
            remaining_vol -= deduct_vol

        # 7. Oversold handling
        if remaining_qty > 0 or remaining_vol > 0:
            latest_stock = product_stocks[-1]
            curr_res = supabase.table("stock").select("*").eq("id", latest_stock['id']).single().execute()
            current = curr_res.data
            if current:
                supabase.table("stock").update({
                    "stock_quantity": float(current['stock_quantity']) - float(remaining_vol),
                    "volume": float(current['volume']) - float(remaining_qty)
                }).eq("id", latest_stock['id']).execute()

        return sale_id

    @staticmethod
    def delete_sale_order(sale_id: int):
        supabase = get_supabase()
        sale_res = supabase.table("sales").select("*").eq("id", sale_id).single().execute()
        sale = sale_res.data
        if not sale:
            return

        # FIFO restoration (oldest first)
        res = supabase.table("stock").select("*").execute()
        all_stocks = res.data
        if not all_stocks:
            return

        product_stocks = [s for s in all_stocks if s['product_name'] == sale['product_name']]
        product_stocks.sort(key=lambda s: s['order_date'] if s['order_date'] else '9999-12-31')

        if product_stocks:
            oldest = product_stocks[0]
            supabase.table("stock").update({
                "stock_quantity": float(oldest['stock_quantity']) + float(sale.get('volume') or 0),
                "volume": float(oldest['volume']) + float(sale['quantity'])
            }).eq("id", oldest['id']).execute()

        supabase.table("sales").delete().eq("id", sale_id).execute()

    @staticmethod
    def update_sale_order(sale_id: int, new_data: dict, stock_id: int = None):
        InventoryService.delete_sale_order(sale_id)
        return InventoryService.create_sale_order(new_data, stock_id or 0)
