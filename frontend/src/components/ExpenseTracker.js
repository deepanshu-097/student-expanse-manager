import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Calendar,
  DollarSign,
  Tag,
  FileText
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORIES = ['Food', 'Travel', 'Study Material', 'Personal', 'Other'];

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, categoryFilter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/expenses`);
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    setFilteredExpenses(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString()
      };

      if (editingExpense) {
        await axios.put(`${API}/expenses/${editingExpense.id}`, expenseData);
        toast.success('Expense updated successfully');
      } else {
        await axios.post(`${API}/expenses`, expenseData);
        toast.success('Expense added successfully');
      }

      setDialogOpen(false);
      setEditingExpense(null);
      setFormData({
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await axios.delete(`${API}/expenses/${expenseId}`);
      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Food': 'bg-orange-100 text-orange-800',
      'Travel': 'bg-blue-100 text-blue-800',
      'Study Material': 'bg-purple-100 text-purple-800',
      'Personal': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Other'];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  return (
    <div className="p-8 space-y-8 animate-slide-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Tracker</h1>
          <p className="text-gray-600 mt-1">Manage and track all your expenses</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </DialogTitle>
              <DialogDescription>
                {editingExpense ? 'Update your expense details' : 'Enter the details of your new expense'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
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
                
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                  required
                >
                  <SelectTrigger className="flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-gray-400" />
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
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Add a note (optional)"
                    className="pl-10 min-h-[80px]"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1 btn-primary">
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingExpense(null);
                    setFormData({
                      amount: '',
                      category: '',
                      date: new Date().toISOString().split('T')[0],
                      notes: ''
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-gray-50/50 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Showing {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                Total: {formatCurrency(getTotalExpenses())}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Your Expenses</CardTitle>
          <CardDescription>All your recorded expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No expenses found</h3>
              <p className="text-sm mb-6">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Start by adding your first expense'
                }
              </p>
              {(!searchTerm && categoryFilter === 'all') && (
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Expense
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-all duration-200 border border-gray-100/50 hover:border-gray-200/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <DollarSign className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {expense.notes || 'Expense'}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <Badge className={getCategoryColor(expense.category)}>
                          {expense.category}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(expense.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600">
                        -{formatCurrency(expense.amount)}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(expense)}
                        className="p-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseTracker;