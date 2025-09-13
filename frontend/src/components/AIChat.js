import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Minimize2, 
  Maximize2, 
  X,
  Bot,
  User,
  Sparkles,
  HelpCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your AI financial advisor. I can help you with budgeting tips, expense analysis, and answer questions about your finances. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: inputMessage.trim()
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I'm having trouble responding right now. Please try again later or check your connection.",
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message to AI assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const quickQuestions = [
    "How can I reduce my food expenses?",
    "What's a good monthly budget for a student?",
    "How much should I save each month?",
    "Tips for tracking expenses better?"
  ];

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Floating chat button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group"
          style={{ zIndex: 40 }}
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
      isMinimized ? 'w-80' : 'w-96'
    }`} style={{ zIndex: 40 }}>
      <Card className={`glass border-0 shadow-2xl transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-[600px]'
      }`}>
        {/* Header */}
        <CardHeader className="p-4 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">AI Assistant</CardTitle>
                <p className="text-xs text-gray-500">Financial advisor</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-gray-100/50"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100/50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Chat Content */}
        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[500px]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'bot' && (
                      <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] p-3 rounded-xl ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                          : message.isError
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className={`text-xs mt-2 opacity-70 ${
                        message.type === 'user' ? 'text-white' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>

                    {message.type === 'user' && (
                      <div className="p-2 bg-gray-200 rounded-lg flex-shrink-0">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 py-2 border-t border-gray-200/50 bg-gray-50/50">
                <p className="text-xs text-gray-600 mb-2 flex items-center">
                  <HelpCircle className="h-3 w-3 mr-1" />
                  Quick questions:
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {quickQuestions.slice(0, 2).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-left text-xs p-2 rounded-lg bg-white/50 hover:bg-white transition-colors text-gray-700 hover:text-emerald-600"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200/50 bg-white/50">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me about your finances..."
                  className="flex-1 bg-white/80 border-gray-200/50 focus:border-emerald-500 focus:ring-emerald-500"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              
              <div className="mt-2 flex items-center justify-center">
                <p className="text-xs text-gray-500 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Powered by AI - Get smart financial advice
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default AIChat;