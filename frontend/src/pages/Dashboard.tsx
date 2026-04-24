import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Package, BarChart3, IndianRupee, ShoppingCart, Box } from 'lucide-react';
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
        const data = res.data || {};

        setStats({
          totalSuppliers: data.totalSuppliers ?? 0,
          totalProducts: data.totalProducts ?? 0,
          totalStockEntries: data.totalStockEntries ?? 0,
          totalRevenue: data.totalRevenue ?? 0,
          salesHistory: Array.isArray(data.salesHistory) ? data.salesHistory : [],
          recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : []
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
      <h1 className="text-4xl font-black">Dashboard</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div key={index}>
            <div className="p-6 bg-white rounded-xl shadow">
              <card.icon />
              <h3>{card.value}</h3>
              <p>{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CHART */}
      <div className="h-72">
        {isMounted && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={Array.isArray(stats.salesHistory) ? stats.salesHistory : []}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area dataKey="amount" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ACTIVITY */}
      <div>
        <h3>Recent Activity</h3>

        {Array.isArray(stats.recentActivity) && stats.recentActivity.length > 0 ? (
          stats.recentActivity.map((activity, i) => (
            <div key={i}>
              {activity.type === 'sale' ? <ShoppingCart /> : <Box />}
              <p>{activity.type}</p>
            </div>
          ))
        ) : (
          <p>No recent activity</p>
        )}
      </div>
    </div>
  );
}