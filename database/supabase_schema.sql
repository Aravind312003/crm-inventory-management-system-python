-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  supplier_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  address TEXT,
  gst_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  serial_no TEXT UNIQUE NOT NULL,
  product_group TEXT NOT NULL,
  product_name TEXT NOT NULL,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock table
-- Note: In the existing application logic:
-- stock_quantity stores the Volume in Litres
-- volume stores the Quantity in Units
CREATE TABLE IF NOT EXISTS stock (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  serial_no TEXT NOT NULL,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  stock_quantity NUMERIC DEFAULT 0, -- Volume (L)
  volume NUMERIC DEFAULT 0,         -- Quantity (Units)
  base_price NUMERIC DEFAULT 0,
  has_gst INTEGER DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  price_per_litre NUMERIC DEFAULT 0,
  bill_type TEXT DEFAULT 'Not Paid',
  order_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  vendor TEXT NOT NULL,
  product_name TEXT NOT NULL,
  bill_type TEXT DEFAULT 'Not Paid',
  quantity NUMERIC DEFAULT 0,       -- Units sold
  volume NUMERIC DEFAULT 0,         -- Litres sold
  delivery_notes TEXT,
  amount_status TEXT DEFAULT 'Pending' CHECK (amount_status IN ('Pending', 'Paid')),
  payment_received_date DATE,
  amount NUMERIC DEFAULT 0,         -- Base amount
  other_price NUMERIC DEFAULT 0,    -- Profit/Loss or extra charge
  total_price NUMERIC DEFAULT 0,    -- Final total
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table (Vendors)
CREATE TABLE IF NOT EXISTS customers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  vendor TEXT NOT NULL,
  product_group TEXT,
  product_name TEXT,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
