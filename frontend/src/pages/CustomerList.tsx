import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Search, Plus, X, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerEntry {
  vendor: string;
  product_name: string | null;
  product_id: number | null;
}

interface Product {
  id: number;
  serial_no: string;
  product_group: string;
  product_name: string;
}

export default function CustomerList() {
  const [sales, setSales] = useState<CustomerEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<CustomerEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [formData, setFormData] = useState({
    vendor: '',
    product_id: ''
  });

  const fetchData = () => {
    axios.get('/api/customers').then(res => setSales(res.data));
    axios.get('/api/products').then(res => setProducts(res.data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      vendor: formData.vendor,
      product_id: formData.product_id ? parseInt(formData.product_id) : null,
      product_name: products.find(p => p.id === parseInt(formData.product_id))?.product_name || 'N/A'
    };

    if (editingSale) {
      axios.put(`/api/customers/${editingSale.id}`, payload)
        .then(() => {
          fetchData();
          closeModal();
        })
        .catch(err => {
          console.error(err);
          alert('Failed to update customer entry');
        });
    } else {
      axios.post('/api/customers', payload).then(() => {
        fetchData();
        closeModal();
      }).catch(err => {
        console.error(err);
        alert('Failed to add customer entry');
      });
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      axios.delete(`/api/customers/${deleteConfirmId}`)
        .then(() => {
          fetchData();
          setDeleteConfirmId(null);
        })
        .catch(err => {
          console.error(err);
          alert('Failed to delete customer entry');
        });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
    setSelectedGroup('');
    setFormData({ vendor: '', product_id: '' });
  };

  const openModal = (sale?: CustomerEntry) => {
    if (sale) {
      setEditingSale(sale);
      const product = products.find(p => p.id === sale.product_id);
      setSelectedGroup(product?.product_group || '');
      setFormData({
        vendor: sale.vendor,
        product_id: sale.product_id?.toString() || ''
      });
    } else {
      setEditingSale(null);
      setSelectedGroup('');
      setFormData({ vendor: '', product_id: '' });
    }
    setIsModalOpen(true);
  };

  const getProductGroup = (productId: number | null) => {
    if (!productId) return 'N/A';
    return products.find(p => p.id === productId)?.product_group || 'N/A';
  };

  const filteredSales = sales.filter(c => {
    const group = getProductGroup(c.product_id);
    return c.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      group.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredProducts = products.filter(p => p.product_group === selectedGroup);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Directory</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Directory of customers and their purchased products.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Customer Entry
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search by customer or product..."
          className="flex-1 outline-none text-sm text-gray-700 dark:text-gray-300 bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Product Group</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredSales.map((customer, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg">
                      <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{customer.vendor}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {getProductGroup(customer.product_id)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {customer.product_name || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(customer)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                      title="Edit Entry"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                  No sales found.
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
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingSale ? 'Edit Customer Entry' : 'Add New Customer Entry'}
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
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Product Group</label>
                  <select
                    required
                    value={selectedGroup}
                    onChange={e => {
                      setSelectedGroup(e.target.value);
                      setFormData({ ...formData, product_id: '' });
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
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Associated Product (Optional)</label>
                  <select
                    value={formData.product_id}
                    onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                    disabled={!selectedGroup}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a product</option>
                    {filteredProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.product_name}</option>
                    ))}
                  </select>
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
                    {editingSale ? 'Update Entry' : 'Add Customer Entry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Delete</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete this customer entry? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
