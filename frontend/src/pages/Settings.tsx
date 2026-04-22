import React from 'react';
import { useTheme } from '../context/ThemeContext.tsx';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '../lib/utils.ts';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your application preferences.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Appearance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the dashboard looks for you.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Theme Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                    theme === option.id
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                      : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    theme === option.id ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  )}>
                    <option.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold">{option.label}</p>
                    <p className="text-xs opacity-80">Switch to {option.label.toLowerCase()} mode</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
