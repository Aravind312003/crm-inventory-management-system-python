import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Package, BarChart3, IndianRupee, ArrowUpRight, Clock, ShoppingCart, Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../lib/utils.ts';

interface Stats {
  totalSuppliers: number;
  totalProducts: number;
  totalStockEntries: number;
  totalRevenue: number;
  salesHistory: { date: string; amount: number }[];
  recentActivity: any[];
}

export default function Dashboard() {
  // Initialize with a default object so .map() never sees 'undefined'
  const [stats, setStats] = useState<Stats>({
    totalSuppliers: 0,
    totalProducts: 0,
    totalStockEntries: 0,
    totalRevenue: 0,
    salesHistory: [],
    recentActivity: []
  });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    axios.get('/api/dashboard/stats')
      .then(res => {
        // Ensure we fall back to empty arrays if backend sends null
        setStats({
          totalSuppliers: res.data?.totalSuppliers || 0,
          totalProducts: res.data?.totalProducts || 0,
          totalStockEntries: res.data?.totalStockEntries || 0,
          totalRevenue: res.data?.totalRevenue || 0,
          salesHistory: res.data?.salesHistory || [],
          recentActivity: res.data?.recentActivity || []
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to fetch dashboard stats');
        setLoading(false);
      });
  }, []);

  const cards = [
    { label: 'Total Suppliers', value: stats.totalSuppliers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Stock Entries', value: stats.totalStockEntries, icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Total Revenue', value: stats.totalRevenue.toLocaleString('en-IN'), icon: IndianRupee, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', isCurrency: true },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Real-time overview of your performance.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn(card.bg, "p-3 rounded-2xl")}>
                <card.icon className={cn("w-6 h-6", card.color)} />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {card.isCurrency && '₹'}
                {card.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-8">Revenue Trends</h3>
          <div className="h-72 w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.salesHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="amount" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {stats.recentActivity.map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  {activity.type === 'sale' ? <ShoppingCart className="w-5 h-5 text-indigo-600" /> : <Box className="w-5 h-5 text-emerald-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {activity.type === 'sale' ? `Sale: ${activity.vendor}` : `Stock: ${activity.product_name}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {stats.recentActivity.length === 0 && (
              <p className="text-center text-gray-400 py-8">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}