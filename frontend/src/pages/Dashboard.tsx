import { useEffect, useState } from 'react';
import API from '../api'; // ✅ use global API
import { Users, Package, BarChart3, IndianRupee, ShoppingCart, Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
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
        // ✅ FIX: call REAL backend endpoints
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
    { label: 'Total Suppliers', value: stats.totalSuppliers, icon: Users },
    { label: 'Total Products', value: stats.totalProducts, icon: Package },
    { label: 'Stock Entries', value: stats.totalStockEntries, icon: BarChart3 },
    { label: 'Total Revenue', value: stats.totalRevenue.toLocaleString('en-IN'), icon: IndianRupee },
  ];

  if (loading) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>

      {error && (
        <div className="bg-red-100 text-red-600 p-4 rounded">
          {error}
        </div>
      )}

      {/* CARDS */}
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="p-4 bg-white rounded shadow">
            <card.icon />
            <h2>{card.value}</h2>
            <p>{card.label}</p>
          </div>
        ))}
      </div>

      {/* CHART */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stats.salesHistory}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area dataKey="amount" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ACTIVITY */}
      <div>
        <h3 className="text-xl">Recent Activity</h3>

        {stats.recentActivity.length > 0 ? (
          stats.recentActivity.map((activity, i) => (
            <div key={i} className="flex gap-2">
              <ShoppingCart />
              <p>Sale ₹{activity.total}</p>
            </div>
          ))
        ) : (
          <p>No recent activity</p>
        )}
      </div>
    </div>
  );
}