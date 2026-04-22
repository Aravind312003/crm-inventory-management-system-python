import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  BarChart3, 
  UserCircle, 
  Settings,
  Box,
  ShoppingBag,
  Contact,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils.ts';
import { useAuth } from '../context/AuthContext.tsx';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Suppliers', path: '/suppliers' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: BarChart3, label: 'Stock', path: '/stock' },
  { icon: ShoppingBag, label: 'Sales', path: '/sales' },
  { icon: Contact, label: 'Customers', path: '/customer-list' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Box className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">CRM Dashboard</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive 
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
        {user && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-2">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Logged in as</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.username}</p>
          </div>
        )}
        <NavLink 
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium transition-colors",
              isActive 
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            )
          }
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
