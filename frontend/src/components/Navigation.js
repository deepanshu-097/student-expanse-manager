import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { 
  Home, 
  CreditCard, 
  PiggyBank, 
  Target, 
  BarChart3, 
  LogOut, 
  User,
  Wallet
} from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/expenses', icon: CreditCard, label: 'Expenses' },
    { path: '/budgets', icon: Wallet, label: 'Budgets' },
    { path: '/savings', icon: Target, label: 'Savings Goals' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-lg border-r border-gray-200/50 shadow-xl z-50">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
              <PiggyBank className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ExpenseWise</h1>
              <p className="text-sm text-gray-500">Student Edition</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6">
          <div className="space-y-2 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  } group-hover:scale-110`} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-200/50">
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-50/80">
              <div className="p-2 bg-gray-200 rounded-lg">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 py-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;