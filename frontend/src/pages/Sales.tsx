import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils.ts';
import DeleteConfirmModal from '../components/DeleteConfirmModal.tsx';

interface Stock {
  id: number;
  serial_no: string;
  product_name: string;
  stock_quantity: number;
  price_per_litre: number;
  total_price: number;
  volume: number;
}

interface Sale {
  id?: number;
  product_id?: number;
  vendor: string;
  product_name: string;
  bill_type: 'Paid' | 'Not Paid';
  quantity: number;
  delivery_notes: string;
  amount_status: string;
  payment_received_date: string;
  amount: number; // Base Price from stock
  other_price: number;
  total_price: number;
  volume: number;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    vendor: '',
    stock_id: '',
    bill_type: 'Not Paid',
    quantity: 0,
    delivery_notes: '',
    amount_status: 'Pending',
    payment_received_date: '',
    amount: 0,
    other_price: 0,
    total_price: 0,
    volume: 0
  });

  const selectedStock = stock.find(s => s.id === parseInt(formData.stock_id));
  
  // Robust unit price calculation
  let unitPrice = 0;
  if (selectedStock) {
    unitPrice = selectedStock.price_per_litre;
    if (!unitPrice || unitPrice === 0) {
      const divisor = selectedStock.stock_quantity > 0 ? selectedStock.stock_quantity : (selectedStock.volume > 0 ? selectedStock.volume : 1);
      unitPrice = selectedStock.total_price / divisor;
    }
  }

  const calculatedPrice = unitPrice * formData.quantity;
  const calculatedTotal = calculatedPrice + (parseFloat(formData.other_price) || 0);
  const profitLoss = (parseFloat(formData.other_price) || 0);

  const fetchData = () => {
    axios.get('/api/sales')
      .then(res => setSales(res.data))
      .catch(err => console.error('Error fetching sales:', err));
    axios.get('/api/stock')
      .then(res => setStock(res.data))
      .catch(err => console.error('Error fetching stock:', err));
    axios.get('/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error('Error fetching products:', err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: calculatedPrice,
      total_price: calculatedTotal,
      volume: formData.volume
    };
    if (editingSale) {
      axios.put(`/api/sales/${editingSale.id}`, payload)
        .then(() => {
          fetchData();
          closeModal();
        });
    } else {
      axios.post('/api/sales', payload)
        .then(() => {
          fetchData();
          closeModal();
        })
        .catch(err => {
          alert(err.response?.data?.error || 'Failed to create order');
        });
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      axios.delete(`/api/sales/${deleteConfirmId}`)
        .then(() => fetchData());
    }
  };

  const openModal = (item?: Sale) => {
    if (item) {
      setEditingSale(item);
      const stockItem = stock.find(s => s.product_name === item.product_name);
      const product = products.find(p => p.id === item.product_id);
      setSelectedGroup(product?.product_group || '');
      setFormData({
        vendor: item.vendor || '',
        stock_id: stockItem?.id || '',
        product_id: item.product_id || '',
        bill_type: item.bill_type || 'Not Paid',
        quantity: item.quantity || 0,
        delivery_notes: (item as any).delivery_notes || (item as any).deliver_to || '',
        amount_status: item.amount_status || 'Pending',
        payment_received_date: item.payment_received_date || '',
        amount: item.amount || 0,
        other_price: item.other_price || 0,
        total_price: item.total_price || 0,
        volume: item.volume || 0
      });
    } else {
      setEditingSale(null);
      setSelectedGroup('');
      setFormData({
        vendor: '',
        stock_id: '',
        product_id: '',
        bill_type: 'Not Paid',
        quantity: 0,
        delivery_notes: '',
        amount_status: 'Pending',
        payment_received_date: '',
        amount: 0,
        other_price: 0,
        total_price: 0,
        volume: 0
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
    setSelectedGroup('');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage sales orders and payments.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Sales Order
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Volume</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Sales Quantity</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Price per Litre</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Other Price</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Total Price</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="font-bold text-gray-900 dark:text-white">{sale.vendor}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{sale.product_name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">{sale.volume?.toFixed(2) || '0.00'}</span>
                  <span className="text-[10px] text-gray-400 ml-1">L</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{sale.quantity}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                      ₹{(() => {
                        const divisor = (sale.quantity > 0 ? sale.quantity : (sale.volume > 0 ? sale.volume : 1));
                        return (sale.amount / divisor).toFixed(2);
                      })()}
                    </span>
                    <span className="text-[10px] text-gray-400">per {sale.quantity > 0 ? 'Litre' : 'Unit'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 dark:text-white font-medium">₹{(sale.other_price || 0).toLocaleString('en-IN')}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900 dark:text-white font-bold">₹{(sale.total_price || (sale.amount + (sale.other_price || 0))).toLocaleString('en-IN')}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      (sale.other_price || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {(sale.other_price || 0) >= 0 ? 'Profit' : 'Loss'}: ₹{Math.abs(sale.other_price || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    sale.bill_type === 'Paid' ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  )}>
                    {sale.bill_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(sale)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sale.id!)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sales.length > 0 && (
              <tr className="bg-gray-50 dark:bg-gray-900/30 font-bold">
                <td colSpan={5} className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">Total Profit/Loss:</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-sm",
                    sales.reduce((acc, c) => acc + (c.other_price || 0), 0) >= 0 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"
                  )}>
                    ₹{Math.abs(sales.reduce((acc, c) => acc + (c.other_price || 0), 0)).toLocaleString('en-IN')}
                  </span>
                </td>
                <td colSpan={2}></td>
              </tr>
            )}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                  No sales orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingSale ? 'Edit Order' : 'New Sales Order'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Customer Name</label>
                  <input
                    required
                    type="text"
                    value={formData.vendor}
                    onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter customer name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Product Group</label>
                    <select
                      required
                      value={selectedGroup}
                      onChange={e => {
                        const group = e.target.value;
                        setSelectedGroup(group);
                        setFormData({ ...formData, stock_id: '', product_name: '' });
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select Group</option>
                      {Array.from(new Set(products.map(p => p.product_group))).map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Product</label>
                    <select
                      required
                      disabled={!!editingSale || !selectedGroup}
                      value={formData.stock_id}
                      onChange={e => {
                        const sid = parseInt(e.target.value);
                        const s = stock.find(item => item.id === sid);
                        setFormData({ ...formData, stock_id: sid, product_name: s?.product_name || '' });
                      }}
                      className={cn(
                        "w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all",
                        (!selectedGroup || !!editingSale) && "bg-gray-50 dark:bg-gray-900/50 text-gray-400 cursor-not-allowed opacity-60"
                      )}
                    >
                      <option value="">Select Product</option>
                      {(() => {
                        const filteredStock = stock.filter(s => {
                          const product = products.find(p => p.product_name === s.product_name);
                          return product?.product_group === selectedGroup;
                        });

                        const grouped = filteredStock.reduce((acc, curr) => {
                          if (!acc[curr.product_name]) {
                            acc[curr.product_name] = { ...curr, stock_quantity: 0, volume: 0 };
                          }
                          acc[curr.product_name].stock_quantity += curr.stock_quantity;
                          acc[curr.product_name].volume += curr.volume;
                          return acc;
                        }, {} as Record<string, Stock>);

                        return Object.values(grouped).map((s: Stock) => (
                          <option key={s.id} value={s.id}>
                            {s.product_name} ({s.stock_quantity.toFixed(2)}L / {s.volume} units available)
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Delivery Notes</label>
                    <input
                      type="text"
                      value={formData.delivery_notes}
                      onChange={e => setFormData({ ...formData, delivery_notes: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter delivery notes"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Date</label>
                    <input
                      type="date"
                      value={formData.payment_received_date}
                      onChange={e => setFormData({ ...formData, payment_received_date: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Volume (L)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.volume}
                      onChange={e => setFormData({ ...formData, volume: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter volume"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Other Price</label>
                    <input
                      type="number"
                      value={formData.other_price}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, other_price: val, total_price: calculatedPrice + val });
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter other price"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sales Quantity</label>
                    <input
                      required
                      type="number"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter sales quantity"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Price (Auto)</label>
                    <div className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-black text-lg">
                      ₹{calculatedTotal.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                      Calculation: (Stock Price ₹{unitPrice.toFixed(2)} × {formData.quantity}) + Other Price ₹{formData.other_price || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Amount Status</label>
                    <input
                      type="text"
                      value={formData.amount_status}
                      onChange={e => setFormData({ ...formData, amount_status: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="e.g. Pending, Completed"
                    />
                  </div>
                </div>


                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bill Type</label>
                  <div className="flex gap-4 mt-2">
                    {['Paid', 'Not Paid'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="bill_type"
                          value={type}
                          checked={formData.bill_type === type}
                          onChange={e => setFormData({ ...formData, bill_type: e.target.value as any })}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    {editingSale ? 'Save Changes' : 'Create Order'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Sales Record"
        message="Are you sure you want to delete this sales record? This will also restore the stock quantity."
      />
    </div>
  );
}
