import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORY_COLORS = {
  'Food': '#f59e0b',
  'Travel': '#3b82f6',
  'Study Material': '#8b5cf6',
  'Personal': '#ec4899',
  'Other': '#6b7280'
};

const Analytics = () => {
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (expenses.length > 0) {
      processAnalytics();
    }
  }, [expenses, timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/expenses`),
        axios.get(`${API}/analytics/expense-summary`)
      ]);
      setExpenses(expensesRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const filterExpensesByTimeRange = (expenses) => {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return expenses;
    }

    return expenses.filter(expense => new Date(expense.date) >= startDate);
  };

  const processAnalytics = () => {
    const filteredExpenses = filterExpensesByTimeRange(expenses);
    
    // Category breakdown for pie chart
    const categoryData = {};
    filteredExpenses.forEach(expense => {
      categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount;
    });

    const pieData = Object.entries(categoryData).map(([category, amount]) => ({
      name: category,
      value: amount,
      color: CATEGORY_COLORS[category]
    }));

    // Monthly trend for bar chart
    const monthlyData = {};
    filteredExpenses.forEach(expense => {
      const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, total: 0, ...Object.fromEntries(Object.keys(CATEGORY_COLORS).map(cat => [cat, 0])) };
      }
      monthlyData[month].total += expense.amount;
      monthlyData[month][expense.category] += expense.amount;
    });

    const barData = Object.values(monthlyData).sort((a, b) => new Date(a.month) - new Date(b.month));

    // Daily spending trend for line chart
    const dailyData = {};
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyData[date] = (dailyData[date] || 0) + expense.amount;
    });

    const lineData = Object.entries(dailyData)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    setAnalytics(prev => ({
      ...prev,
      pieData,
      barData,
      lineData,
      filteredTotal: filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      filteredCount: filteredExpenses.length,
      avgPerDay: filteredExpenses.length > 0 ? filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0) / filteredExpenses.length : 0
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getTopCategory = () => {
    if (!analytics.pieData || analytics.pieData.length === 0) return null;
    return analytics.pieData.reduce((max, cat) => cat.value > max.value ? cat : max);
  };

  const getSpendingTrend = () => {
    if (!analytics.barData || analytics.barData.length < 2) return { trend: 'neutral', percentage: 0 };
    
    const latest = analytics.barData[analytics.barData.length - 1];
    const previous = analytics.barData[analytics.barData.length - 2];
    
    if (!latest || !previous) return { trend: 'neutral', percentage: 0 };
    
    const change = ((latest.total - previous.total) / previous.total) * 100;
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change)
    };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topCategory = getTopCategory();
  const spendingTrend = getSpendingTrend();

  return (
    <div className="p-8 space-y-8 animate-slide-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Visualize your spending patterns and trends</p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.filteredTotal || 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics.filteredCount || 0} transactions
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Per Transaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.avgPerDay || 0)}
                </p>
                <p className="text-sm text-blue-600 mt-1">Per expense</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Category</p>
                <p className="text-lg font-bold text-gray-900">
                  {topCategory?.name || 'N/A'}
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  {topCategory ? formatCurrency(topCategory.value) : 'No data'}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <PieChartIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Spending Trend</p>
                <div className="flex items-center space-x-2 mt-1">
                  {spendingTrend.trend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-red-600" />
                  ) : spendingTrend.trend === 'down' ? (
                    <TrendingDown className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Activity className="h-5 w-5 text-gray-600" />
                  )}
                  <span className={`text-lg font-bold ${
                    spendingTrend.trend === 'up' ? 'text-red-600' : 
                    spendingTrend.trend === 'down' ? 'text-emerald-600' : 'text-gray-600'
                  }`}>
                    {spendingTrend.percentage.toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">vs previous period</p>
              </div>
              <div className={`p-3 rounded-xl ${
                spendingTrend.trend === 'up' ? 'bg-red-100' : 
                spendingTrend.trend === 'down' ? 'bg-emerald-100' : 'bg-gray-100'
              }`}>
                <BarChart3 className={`h-6 w-6 ${
                  spendingTrend.trend === 'up' ? 'text-red-600' : 
                  spendingTrend.trend === 'down' ? 'text-emerald-600' : 'text-gray-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Category Breakdown - Pie Chart */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5" />
              <span>Spending by Category</span>
            </CardTitle>
            <CardDescription>Distribution of expenses across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.pieData && analytics.pieData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="grid grid-cols-2 gap-2">
                  {analytics.pieData.map((category) => (
                    <div key={category.name} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{category.name}</span>
                      <span className="text-sm font-medium ml-auto">{formatCurrency(category.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <PieChartIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No expense data available for the selected period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend - Bar Chart */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Monthly Spending Trend</span>
            </CardTitle>
            <CardDescription>Track your spending patterns over time</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.barData && analytics.barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No trend data available for the selected period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Spending Pattern */}
      {analytics.lineData && analytics.lineData.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Daily Spending Pattern</span>
            </CardTitle>
            <CardDescription>Your daily expense fluctuations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Amount']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#059669' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category Insights */}
      {analytics.pieData && analytics.pieData.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Category Insights</CardTitle>
            <CardDescription>Detailed breakdown of your spending categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.pieData
                .sort((a, b) => b.value - a.value)
                .map((category) => {
                  const percentage = ((category.value / analytics.filteredTotal) * 100);
                  return (
                    <div key={category.name} className="p-4 rounded-xl bg-gray-50/50 border border-gray-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <Badge 
                          variant="secondary" 
                          style={{ backgroundColor: category.color + '20', color: category.color }}
                        >
                          {percentage.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Amount</span>
                          <span className="font-medium">{formatCurrency(category.value)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: category.color
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;