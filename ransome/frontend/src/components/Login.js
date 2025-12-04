import React, { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = isLogin 
        ? await authAPI.login(formData)
        : await authAPI.register(formData);
      
      localStorage.setItem('token', response.data.access_token);
      toast.success(isLogin ? 'Login successful!' : 'Registration successful!');
      onLogin();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            RansomDetect
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Advanced Ransomware Detection System
          </p>
        </div>

        {/* Auth Form */}
        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
              {isLogin 
                ? 'Access your ransomware detection dashboard' 
                : 'Join the fight against ransomware threats'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Demo Credentials
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>Username: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">demo</code></p>
              <p>Password: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">demo123</code></p>
            </div>
          </div>
        </div>

        {/* SDG 16 Footer */}
        <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          <p>Contributing to UN SDG 16: Peace, Justice and Strong Institutions</p>
          <p className="mt-1">Strengthening cybersecurity infrastructure through AI</p>
        </div>
      </div>
    </div>
  );
};

export default Login;