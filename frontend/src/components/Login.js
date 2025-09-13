import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Eye, EyeOff, CreditCard, TrendingUp, PiggyBank } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Hero content */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              Smart Expense
              <span className="text-emerald-600 block">Management</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Take control of your finances with intelligent tracking, budgeting, and AI-powered insights designed for students.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/20">
              <div className="p-3 rounded-xl bg-emerald-100">
                <CreditCard className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Expense Tracking</h3>
                <p className="text-gray-600 text-sm">Categorize and monitor your spending with ease</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/20">
              <div className="p-3 rounded-xl bg-teal-100">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Budget Management</h3>
                <p className="text-gray-600 text-sm">Set limits and track progress with visual insights</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/20">
              <div className="p-3 rounded-xl bg-cyan-100">
                <PiggyBank className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Savings Goals</h3>
                <p className="text-gray-600 text-sm">Achieve your financial targets with smart planning</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="glass border-0 shadow-2xl">
            <CardHeader className="space-y-4 text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to continue managing your expenses
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@university.edu"
                    className="form-input h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="form-input h-12 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary h-12 text-lg font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Create one now
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;