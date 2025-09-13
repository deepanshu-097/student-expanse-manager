import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  Calendar,
  DollarSign,
  Target,
  CheckCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORIES = ['Food', 'Travel', 'Study Material', 'Personal', 'Other'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BudgetManager = () => {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'monthly',
    category: '',
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsRes, expensesRes] = await Promise.all([
        axios.get(`${API}/budgets`),
        axios.get(`${API}/expenses`)
      ]);
      setBudgets(budgetsRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || (formData.type === 'category' && !formData.category)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount),
        category: formData.type === 'monthly' ? null : formData.category
      };

      await axios.post(`${API}/budgets`, budgetData);
      toast.success('Budget created successfully');
      setDialogOpen(false);
      setFormData({
        type: 'monthly',
        category: '',
        amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      fetchData();
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error('Failed to create budget');
    }
  };

  const calculateSpentAmount = (budget) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    let relevantExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() + 1 === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });

    if (budget.type === 'category') {
      relevantExpenses = relevantExpenses.filter(expense => expense.category === budget.category);
    }

    return relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getBudgetStatus = (spent, budget) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return { status: 'exceeded', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle };
    if (percentage >= 80) return { status: 'warning', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertCircle };
    if (percentage >= 50) return { status: 'normal', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: TrendingUp };
    return { status: 'good', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: CheckCircle };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="p-8 space-y-8 animate-slide-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Manager</h1>
          <p className="text-gray-600 mt-1">Set and track your spending limits</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>
                Set spending limits for this month or specific categories
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Budget Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({...formData, type: value, category: ''})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly Budget</SelectItem>
                    <SelectItem value="category">Category Budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'category' && (
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="amount">Budget Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Select 
                    value={formData.month.toString()} 
                    onValueChange={(value) => setFormData({...formData, month: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    min="2024"
                    max="2030"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1 btn-primary">
                  Create Budget
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budgets</p>
                <p className="text-2xl font-bold text-gray-900">{budgets.length}</p>
                <p className="text-sm text-gray-500 mt-1">Active this month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budgeted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(budgets.reduce((sum, budget) => sum + budget.amount, 0))}
                </p>
                <p className="text-sm text-emerald-600 mt-1">This month</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(budgets.reduce((sum, budget) => sum + calculateSpentAmount(budget), 0))}
                </p>
                <p className="text-sm text-orange-600 mt-1">This month</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Your Budgets</CardTitle>
          <CardDescription>Track your spending against set limits</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No budgets created yet</h3>
              <p className="text-sm mb-6">
                Start by creating your first budget to track spending
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Budget
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {budgets.map((budget) => {
                const spentAmount = calculateSpentAmount(budget);
                const percentage = (spentAmount / budget.amount) * 100;
                const status = getBudgetStatus(spentAmount, budget.amount);
                const StatusIcon = status.icon;

                return (
                  <div 
                    key={budget.id} 
                    className="p-6 rounded-xl bg-gradient-to-r from-white/50 to-gray-50/50 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${status.bgColor}`}>
                          <StatusIcon className={`h-6 w-6 ${status.color}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {budget.type === 'monthly' ? 'Monthly Budget' : `${budget.category} Budget`}
                          </h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {MONTHS[budget.month - 1]} {budget.year}
                            </Badge>
                            {budget.type === 'category' && (
                              <Badge variant="secondary" className="text-xs">
                                {budget.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {formatCurrency(spentAmount)} of {formatCurrency(budget.amount)}
                        </p>
                        <p className={`text-sm font-medium ${status.color}`}>
                          {percentage.toFixed(1)}% used
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progress</span>
                        <span>{formatCurrency(budget.amount - spentAmount)} remaining</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>

                      {percentage >= 80 && (
                        <div className={`p-3 rounded-lg ${status.bgColor} border border-current/20`}>
                          <div className="flex items-center space-x-2">
                            <AlertCircle className={`h-4 w-4 ${status.color}`} />
                            <p className={`text-sm font-medium ${status.color}`}>
                              {percentage >= 100 
                                ? 'Budget exceeded! Consider reviewing your spending.'
                                : 'You\'re approaching your budget limit. Spend carefully.'
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetManager;