import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Target, 
  TrendingUp, 
  Calendar,
  DollarSign,
  PiggyBank,
  Star,
  Trophy,
  Gift
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SavingsGoals = () => {
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addMoneyDialog, setAddMoneyDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [addAmount, setAddAmount] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    target_amount: '',
    target_date: ''
  });

  useEffect(() => {
    fetchSavingsGoals();
  }, []);

  const fetchSavingsGoals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/savings-goals`);
      setSavingsGoals(response.data);
    } catch (error) {
      console.error('Error fetching savings goals:', error);
      toast.error('Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.target_amount || !formData.target_date) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const goalData = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        target_date: new Date(formData.target_date).toISOString()
      };

      await axios.post(`${API}/savings-goals`, goalData);
      toast.success('Savings goal created successfully');
      setDialogOpen(false);
      setFormData({
        title: '',
        target_amount: '',
        target_date: ''
      });
      fetchSavingsGoals();
    } catch (error) {
      console.error('Error creating savings goal:', error);
      toast.error('Failed to create savings goal');
    }
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    
    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await axios.put(`${API}/savings-goals/${selectedGoal.id}/add-amount?amount=${parseFloat(addAmount)}`);
      toast.success('Amount added successfully');
      setAddMoneyDialog(false);
      setSelectedGoal(null);
      setAddAmount('');
      fetchSavingsGoals();
    } catch (error) {
      console.error('Error adding money:', error);
      toast.error('Failed to add money');
    }
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

  const getDaysRemaining = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getGoalStatus = (current, target, targetDate) => {
    const percentage = (current / target) * 100;
    const daysRemaining = getDaysRemaining(targetDate);
    
    if (percentage >= 100) {
      return { 
        status: 'completed', 
        color: 'text-emerald-600', 
        bgColor: 'bg-emerald-100', 
        icon: Trophy,
        message: 'Goal achieved! 🎉'
      };
    }
    
    if (daysRemaining < 0) {
      return { 
        status: 'overdue', 
        color: 'text-red-600', 
        bgColor: 'bg-red-100', 
        icon: Calendar,
        message: 'Target date passed'
      };
    }
    
    if (daysRemaining <= 30 && percentage < 80) {
      return { 
        status: 'urgent', 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-100', 
        icon: Calendar,
        message: 'Time running out!'
      };
    }
    
    if (percentage >= 75) {
      return { 
        status: 'close', 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100', 
        icon: Star,
        message: 'Almost there!'
      };
    }
    
    return { 
      status: 'active', 
      color: 'text-gray-600', 
      bgColor: 'bg-gray-100', 
      icon: Target,
      message: 'Keep going!'
    };
  };

  const getProgressColor = (percentage, status) => {
    if (status === 'completed') return 'bg-emerald-500';
    if (status === 'overdue') return 'bg-red-500';
    if (status === 'urgent') return 'bg-orange-500';
    if (status === 'close') return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getTotalSavings = () => {
    return savingsGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
  };

  const getTotalTargets = () => {
    return savingsGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
  };

  const getCompletedGoals = () => {
    return savingsGoals.filter(goal => goal.current_amount >= goal.target_amount).length;
  };

  return (
    <div className="p-8 space-y-8 animate-slide-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Savings Goals</h1>
          <p className="text-gray-600 mt-1">Track your progress towards financial goals</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
              <DialogDescription>
                Set a target amount and date for your savings goal
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., New Laptop, Vacation Fund"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target_amount">Target Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                    placeholder="0.00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target_date">Target Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                    className="pl-10"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1 btn-primary">
                  Create Goal
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

      {/* Add Money Dialog */}
      <Dialog open={addMoneyDialog} onOpenChange={setAddMoneyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Money to Goal</DialogTitle>
            <DialogDescription>
              Add money to your "{selectedGoal?.title}" savings goal
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddMoney} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add_amount">Amount to Add</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="add_amount"
                  type="number"
                  step="0.01"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1 btn-primary">
                Add Money
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setAddMoneyDialog(false);
                  setSelectedGoal(null);
                  setAddAmount('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Savings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Saved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(getTotalSavings())}
                </p>
                <p className="text-sm text-emerald-600 mt-1">Across all goals</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <PiggyBank className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Target Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(getTotalTargets())}
                </p>
                <p className="text-sm text-blue-600 mt-1">Total targets</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Goals</p>
                <p className="text-2xl font-bold text-gray-900">{savingsGoals.length}</p>
                <p className="text-sm text-orange-600 mt-1">In progress</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{getCompletedGoals()}</p>
                <p className="text-sm text-purple-600 mt-1">Goals achieved</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Savings Goals List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Your Savings Goals</CardTitle>
          <CardDescription>Track progress towards your financial targets</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : savingsGoals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <PiggyBank className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No savings goals yet</h3>
              <p className="text-sm mb-6">
                Start by creating your first savings goal to track progress
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savingsGoals.map((goal) => {
                const percentage = (goal.current_amount / goal.target_amount) * 100;
                const daysRemaining = getDaysRemaining(goal.target_date);
                const status = getGoalStatus(goal.current_amount, goal.target_amount, goal.target_date);
                const StatusIcon = status.icon;

                return (
                  <Card 
                    key={goal.id} 
                    className="p-6 rounded-xl bg-gradient-to-br from-white/80 to-gray-50/80 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200 card-hover"
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Target: {formatDate(goal.target_date)}
                          </p>
                        </div>
                        <div className={`p-2 rounded-lg ${status.bgColor}`}>
                          <StatusIcon className={`h-5 w-5 ${status.color}`} />
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(percentage, status.status)}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className={`font-medium ${status.color}`}>
                            {percentage.toFixed(1)}% complete
                          </span>
                          <span className="text-gray-600">
                            {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                          </span>
                        </div>
                      </div>

                      {/* Status Message */}
                      <div className={`p-3 rounded-lg ${status.bgColor} border border-current/20`}>
                        <p className={`text-sm font-medium ${status.color}`}>
                          {status.message}
                        </p>
                      </div>

                      {/* Action Button */}
                      <Button 
                        onClick={() => {
                          setSelectedGoal(goal);
                          setAddMoneyDialog(true);
                        }}
                        className="w-full btn-primary"
                        disabled={status.status === 'completed'}
                      >
                        {status.status === 'completed' ? (
                          <>
                            <Trophy className="h-4 w-4 mr-2" />
                            Goal Achieved!
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Money
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsGoals;