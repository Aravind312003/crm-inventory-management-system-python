import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils.ts';
import DeleteConfirmModal from '../components/DeleteConfirmModal.tsx';

interface Product {
  id: number;
  product_group: string;
  product_name: string;
  serial_no: string;
}

interface Stock {
  id?: number;
  serial_no: string;
  product_id: number;
  product_name: string;
  stock_quantity: number;
  order_date: string;
  volume: number;
  base_price: number;
  has_gst: number;
  total_price: number;
  price_per_litre: number;
  bill_type: 'Paid' | 'Not Paid';
}

export default function Stock() {
  const [stock, setStock] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [formData, setFormData] = useState<Omit<Stock, 'serial_no' | 'price_per_litre' | 'total_price'>>({
    product_id: 0,
    product_name: '',
    stock_quantity: 0,
    order_date: new Date().toISOString().split('T')[0],
    volume: 0,
    base_price: 0,
    has_gst: 0,
    bill_type: 'Not Paid'
  });

  const fetchData = () => {
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
    if (editingStock) {
      axios.put(`/api/stock/${editingStock.id}`, formData)
        .then(() => {
          fetchData();
          closeModal();
        });
    } else {
      axios.post('/api/stock', formData)
        .then(() => {
          fetchData();
          closeModal();
        });
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      axios.delete(`/api/stock/${deleteConfirmId}`)
        .then(() => fetchData());
    }
  };

  const openModal = (item?: Stock) => {
    if (item) {
      setEditingStock(item);
      const product = products.find(p => p.id === item.product_id);
      setSelectedGroup(product?.product_group || '');
      setFormData({
        product_id: item.product_id || 0,
        product_name: item.product_name || '',
        stock_quantity: item.stock_quantity || 0,
        order_date: item.order_date || '',
        volume: item.volume || 0,
        base_price: item.base_price || 0,
        has_gst: item.has_gst || 0,
        bill_type: item.bill_type || 'Not Paid'
      });
    } else {
      setEditingStock(null);
      setSelectedGroup('');
      setFormData({
        product_id: 0,
        product_name: '',
        stock_quantity: 0,
        order_date: new Date().toISOString().split('T')[0],
        volume: 0,
        base_price: 0,
        has_gst: 0,
        bill_type: 'Not Paid'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStock(null);
    setSelectedGroup('');
  };

  const getProductGroupName = (id: number) => {
    return products.find(p => p.id === id)?.product_group || 'Unknown Group';
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stock Management</h1>
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-widest">v2.0</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track your inventory and orders.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Stock Entry
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Order Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Bill Type</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Volume (L)</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Stock Quantity</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Price per Litre</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">GST (5%)</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Final Price</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {stock.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{item.order_date}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white">{item.product_name}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{getProductGroupName(item.product_id)} | {item.serial_no}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    item.bill_type === 'Paid' ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  )}>
                    {item.bill_type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">{item.stock_quantity?.toFixed(2) || '0.00'}</span>
                  <span className="text-[10px] text-gray-400 ml-1">L</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{item.volume}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">
                    ₹{(() => {
                      const up = item.price_per_litre;
                      if (up && up > 0) return up.toFixed(2);
                      const divisor = item.stock_quantity > 0 ? item.stock_quantity : (item.volume > 0 ? item.volume : 1);
                      return (item.total_price / divisor).toFixed(2);
                    })()}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-1">/{item.stock_quantity > 0 ? 'L' : 'Unit'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    item.has_gst === 1 ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                  )}>
                    {item.has_gst === 1 ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">₹{item.total_price.toLocaleString('en-IN')}</span>
                    {item.has_gst === 1 && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">(Incl. GST)</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(item)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id!)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {stock.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                  No stock entries found.
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
                  {editingStock ? 'Edit Stock Entry' : 'Add Stock Entry'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Order Date</label>
                  <input
                    required
                    type="date"
                    value={formData.order_date}
                    onChange={e => setFormData({ ...formData, order_date: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
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
                        // Reset product selection when group changes
                        setFormData({ ...formData, product_id: 0, product_name: '' });
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select Product Group</option>
                      {Array.from(new Set(products.map(p => p.product_group))).map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Product Name</label>
                    <select
                      required
                      value={formData.product_id}
                      onChange={e => {
                        const pid = parseInt(e.target.value);
                        const product = products.find(p => p.id === pid);
                        setFormData({ ...formData, product_id: pid, product_name: product?.product_name || '' });
                      }}
                      disabled={!selectedGroup}
                      className={cn(
                        "w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all",
                        !selectedGroup && "bg-gray-50 dark:bg-gray-900/50 text-gray-400 cursor-not-allowed opacity-60"
                      )}
                    >
                      <option value="">Select Product Name</option>
                      {products
                        .filter(p => p.product_group === selectedGroup)
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.product_name} ({p.serial_no})</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Volume (L)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.stock_quantity}
                      onChange={e => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stock Quantity</label>
                    <input
                      required
                      type="number"
                      value={formData.volume}
                      onChange={e => setFormData({ ...formData, volume: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Base Price (₹)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.base_price}
                      onChange={e => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
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
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Add GST (5%)?</label>
                  <div className="flex gap-4 mt-1">
                    {[
                      { label: 'Yes', value: 1 },
                      { label: 'No', value: 0 }
                    ].map(opt => (
                      <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="has_gst"
                          value={opt.value}
                          checked={formData.has_gst === opt.value}
                          onChange={() => setFormData({ ...formData, has_gst: opt.value })}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.base_price > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">The Final Price is:</span>
                        <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                          ₹{(formData.has_gst === 1 ? formData.base_price * 1.05 : formData.base_price).toFixed(2)}
                        </span>
                        {formData.has_gst === 1 && (
                          <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-500 opacity-70">
                            (Incl. GST)
                          </span>
                        )}
                      </div>
                      {formData.stock_quantity > 0 && (
                        <div className="text-right">
                          <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400">
                            ₹{((formData.has_gst === 1 ? formData.base_price * 1.05 : formData.base_price) / formData.stock_quantity).toFixed(2)}/L
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                    {editingStock ? 'Save Changes' : 'Add Stock Entry'}
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
        title="Delete Stock Entry"
        message="Are you sure you want to delete this stock entry? This will update your inventory levels."
      />
    </div>
  );
}
