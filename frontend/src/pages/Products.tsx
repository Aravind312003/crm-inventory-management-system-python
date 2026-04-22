import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils.ts';
import DeleteConfirmModal from '../components/DeleteConfirmModal.tsx';

interface Supplier {
  id: number;
  supplier_name: string;
}

interface Product {
  id?: number;
  serial_no: string;
  product_group: string;
  product_name: string;
  supplier_id?: number;
  suppliers?: {
    supplier_name: string;
  };
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Product>({
    serial_no: '',
    product_group: '',
    product_name: '',
    supplier_id: undefined
  });

  const fetchProducts = () => {
    axios.get('/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  };

  const fetchSuppliers = () => {
    axios.get('/api/suppliers')
      .then(res => setSuppliers(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.product_group]) {
      acc[product.product_group] = [];
    }
    acc[product.product_group].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const groupExists = (group: string) => {
    return products.some(p => p.product_group.toLowerCase() === group.toLowerCase());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      axios.put(`/api/products/${editingProduct.id}`, formData)
        .then(() => {
          fetchProducts();
          closeModal();
        });
    } else {
      axios.post('/api/products', formData)
        .then(() => {
          fetchProducts();
          closeModal();
        })
        .catch(err => {
          alert(err.response?.data?.error || 'Failed to add product');
        });
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      axios.delete(`/api/products/${deleteConfirmId}`)
        .then(() => fetchProducts());
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        serial_no: product.serial_no || '',
        product_group: product.product_group || '',
        product_name: product.product_name || '',
        supplier_id: product.supplier_id
      });
    } else {
      setEditingProduct(null);
      setFormData({
        serial_no: '',
        product_group: '',
        product_name: '',
        supplier_id: undefined
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your product catalog.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Product Group</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Serial No.</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {Object.entries(groupedProducts).map(([group, groupProducts]) => (
              <React.Fragment key={group}>
                <tr className="bg-gray-50/80 dark:bg-gray-900/40 backdrop-blur-sm sticky top-0 z-10">
                  <td colSpan={4} className="px-6 py-3 border-y border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                      <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{group}</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                        {(groupProducts as Product[]).length} {(groupProducts as Product[]).length === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                  </td>
                </tr>
                {(groupProducts as Product[]).map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                    <td className="px-6 py-4 pl-12 text-sm text-gray-400 italic">
                      {/* Indented for visual grouping */}
                      Sub-item
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400 font-medium">{product.serial_no}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white font-medium">{product.product_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {product.suppliers?.supplier_name || 'No Supplier'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(product)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id!)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                  No products found. Add your first product to get started.
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
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Product Group</label>
                  <input
                    required
                    type="text"
                    list="product-groups"
                    value={formData.product_group}
                    onChange={e => {
                      const newGroup = e.target.value;
                      const exists = products.some(p => p.product_group.toLowerCase() === newGroup.toLowerCase());
                      setFormData({ 
                        ...formData, 
                        product_group: newGroup,
                        serial_no: exists ? '' : formData.serial_no 
                      });
                    }}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter or select product group"
                  />
                  <datalist id="product-groups">
                    {Object.keys(groupedProducts).map(group => (
                      <option key={group} value={group} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Serial Number
                  </label>
                  <input
                    required={!editingProduct}
                    type="text"
                    value={formData.serial_no}
                    onChange={e => setFormData({ ...formData, serial_no: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. OIL001"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Product Name</label>
                  <input
                    required
                    type="text"
                    value={formData.product_name}
                    onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter product name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Supplier</label>
                  <select
                    required
                    value={formData.supplier_id || ''}
                    onChange={e => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.supplier_name}
                      </option>
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
                    {editingProduct ? 'Save Changes' : 'Add Product'}
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
        title="Delete Product"
        message="Are you sure you want to delete this product? This will remove it from the catalog."
      />
    </div>
  );
}
