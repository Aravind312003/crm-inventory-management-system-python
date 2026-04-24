import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Suppliers from './pages/Suppliers.tsx';
import Products from './pages/Products.tsx';
import Stock from './pages/Stock.tsx';
import Sales from './pages/Sales.tsx';
import CustomerList from './pages/CustomerList.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Settings from './pages/Settings.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="products" element={<Products />} />
              <Route path="stock" element={<Stock />} />
              <Route path="sales" element={<Sales />} />
              <Route path="customer-list" element={<CustomerList />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
