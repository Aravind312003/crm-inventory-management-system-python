import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.tsx';
import { Box, Lock, User } from 'lucide-react';
import { motion } from 'motion/react';

const API_URL = "https://crm-inventory-management-system-python.onrender.com"; // ✅ FIXED

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log("LOGIN CLICKED"); // ✅ DEBUG

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        identifier,
        password
      });

      console.log("RESPONSE:", res.data); // ✅ DEBUG

      // ✅ Save auth
      login(res.data.token, res.data.user);

      // ✅ Redirect
      navigate('/');

    } catch (err: any) {
      console.error("LOGIN ERROR:", err); // ✅ DEBUG

      setError(
        err.response?.data?.detail ||
        'Login failed. Please check your connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex justify-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
            <Box className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Sign in to manage your CRM dashboard.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <input
            required
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Username or Email"
            className="w-full p-3 border rounded"
          />

          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 border rounded"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}