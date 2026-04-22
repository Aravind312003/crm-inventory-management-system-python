import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Package, BarChart3, IndianRupee, ArrowUpRight, ArrowDownRight, Clock, ShoppingCart, Box } from 'lucide-react';
import { motion } from 'motion/react';
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    axios.get('/api/dashboard/stats')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to fetch dashboard stats');
        setLoading(false);
      });
  }, []);

  const cards = [
    { label: 'Total Suppliers', value: stats?.totalSuppliers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Stock Entries', value: stats?.totalStockEntries || 0, icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Total Revenue', value: stats?.totalRevenue?.toLocaleString('en-IN') || 0, icon: IndianRupee, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', isCurrency: true },
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
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight font-display">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Real-time overview of your business performance.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/50">
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
            className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn(card.bg, "p-3 rounded-2xl group-hover:scale-110 transition-transform")}>
                <card.icon className={cn("w-6 h-6", card.color)} />
              </div>
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <span className="text-xs font-bold">+12%</span>
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {card.isCurrency && '₹'}
                {card.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Revenue Trends</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Daily sales performance over the last 7 days.</p>
            </div>
            <select className="bg-gray-50 dark:bg-gray-900 border-none text-xs font-bold text-gray-500 dark:text-gray-400 rounded-lg px-3 py-2 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-72 w-full relative">
            <div className="absolute inset-0">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.salesHistory || []}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#4f46e5" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorAmount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {stats?.recentActivity.map((activity, i) => (
              <div key={i} className="flex gap-4 group">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                  activity.type === 'sale' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                )}>
                  {activity.type === 'sale' ? <ShoppingCart className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {activity.type === 'sale' ? `Sale to ${activity.vendor}` : `Stock: ${activity.product_name}`}
                    </p>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap ml-2">
                      {new Date(activity.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                    {activity.type === 'sale' 
                      ? `Sold ${activity.quantity} units (${activity.volume?.toFixed(2)}L)`
                      : `Added ${activity.volume} units (${activity.stock_quantity?.toFixed(2)}L)`
                    }
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-sm text-gray-400 font-medium">No recent activity found.</p>
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-3 rounded-xl border border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}
