import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';
import './App.css';

// Components
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ExpenseTracker from './components/ExpenseTracker';
import BudgetManager from './components/BudgetManager';
import SavingsGoals from './components/SavingsGoals';
import Analytics from './components/Analytics';
import AIChat from './components/AIChat';
import Navigation from './components/Navigation';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // We could verify token here, but for simplicity we'll just set the user from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      await axios.post(`${API}/auth/register`, { name, email, password });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const authValue = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={authValue}>
      <div className="App">
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Navigation />
                    <main className="flex-1 ml-64">
                      <Dashboard />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/expenses" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Navigation />
                    <main className="flex-1 ml-64">
                      <ExpenseTracker />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/budgets" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Navigation />
                    <main className="flex-1 ml-64">
                      <BudgetManager />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/savings" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Navigation />
                    <main className="flex-1 ml-64">
                      <SavingsGoals />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Navigation />
                    <main className="flex-1 ml-64">
                      <Analytics />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
            
            {/* AI Chat - floating on all protected routes */}
            {user && <AIChat />}
          </div>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </div>
    </AuthContext.Provider>
  );
}

export default App;