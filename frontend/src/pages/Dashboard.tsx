import { useEffect, useState } from 'react';
import API from '../api'; 
import { Users, Package, BarChart3, IndianRupee, ShoppingCart, Box, ArrowUpRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [suppliers, products, stock, sales] = await Promise.all([
          API.get('/api/suppliers'),
          API.get('/api/products'),
          API.get('/api/stock'),
          API.get('/api/sales'),
        ]);

        const totalRevenue = sales.data.reduce(
          (sum: number, s: any) => sum + (s.total || 0),
          0
        );

        setStats({
          totalSuppliers: suppliers.data.length,
          totalProducts: products.data.length,
          totalStockEntries: stock.data.length,
          totalRevenue,
          salesHistory: sales.data.map((s: any) => ({
            date: new Date(s.created_at).toLocaleDateString(),
            amount: s.total || 0
          })),
          recentActivity: sales.data.slice(0, 5)
        });

      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { label: 'TOTAL SUPPLIERS', value: stats.totalSuppliers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'TOTAL PRODUCTS', value: stats.totalProducts, icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'STOCK ENTRIES', value: stats.totalStockEntries, icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'TOTAL REVENUE', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  if (loading) {
    return <div className="p-10 text-slate-400">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-8 text-slate-200 p-2">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time overview of your business performance.</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm text-slate-300">
          <Clock size={16} />
          <span>LAST UPDATED: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl backdrop-blur-sm relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon size={24} />
              </div>
              <div className="flex items-center text-emerald-500 text-xs font-bold">
                +12% <ArrowUpRight size={14} />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wider mb-1">{card.label}</p>
              <h2 className="text-3xl font-bold text-white">{card.value}</h2>
            </div>
          </motion.div>
        ))}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CHART SECTION */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Revenue Trends</h3>
              <p className="text-sm text-slate-400">Daily sales performance over the last 7 days.</p>
            </div>
            <select className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-1 text-slate-300 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.salesHistory}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmt)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT ACTIVITY SECTION */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>

          <div className="space-y-6 flex-grow">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex gap-4 items-center">
                    <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                      {activity.type === 'stock' ? <Box size={18} /> : <ShoppingCart size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {activity.type === 'stock' ? `Stock: ${activity.item_name}` : 'Sale to retail'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activity.type === 'stock' ? `Added ${activity.quantity} units` : `Sold ${activity.quantity || 0} units (₹${activity.total})`}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    {new Date(activity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 italic">No recent activity</div>
            )}
          </div>

          <button className="mt-6 w-full py-3 border border-slate-700 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-700/30 transition-colors">
            VIEW ALL ACTIVITY
          </button>
        </div>

      </div>
    </div>
  );
}