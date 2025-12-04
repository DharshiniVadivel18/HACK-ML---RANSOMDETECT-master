import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Brain, Target, TrendingUp, RefreshCw } from 'lucide-react';
import { modelAPI } from '../services/api';
import toast from 'react-hot-toast';

const ModelInsights = () => {
  const [activeTab, setActiveTab] = useState('metrics');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await modelAPI.getMetrics();
      setMetrics(response.data);
    } catch (error) {
      toast.error('Failed to fetch model metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await modelAPI.retrain();
      toast.success('Model retrained successfully!');
      await fetchMetrics();
    } catch (error) {
      toast.error('Retraining failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setRetraining(false);
    }
  };

  const featureImportanceData = metrics ? Object.entries(metrics.feature_importance).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: (value * 100).toFixed(2),
    fullName: name
  })).sort((a, b) => b.value - a.value) : [];

  const confusionMatrixData = metrics ? [
    { name: 'True Negative', value: metrics.confusion_matrix[0][0], color: '#10b981' },
    { name: 'False Positive', value: metrics.confusion_matrix[0][1], color: '#f59e0b' },
    { name: 'False Negative', value: metrics.confusion_matrix[1][0], color: '#ef4444' },
    { name: 'True Positive', value: metrics.confusion_matrix[1][1], color: '#3b82f6' }
  ] : [];

  const tabs = [
    { id: 'metrics', label: 'Performance Metrics', icon: Target },
    { id: 'features', label: 'Feature Importance', icon: TrendingUp },
    { id: 'confusion', label: 'Confusion Matrix', icon: Brain }
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading model insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Model Insights
        </h1>
        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {retraining ? (
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Retraining...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Retrain Model</span>
            </div>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Target className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Model Accuracy
                </h3>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {(metrics.accuracy * 100).toFixed(1)}%
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Test Set Accuracy
                </p>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cross-Validation Score
                </h3>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {(metrics.cross_val_score * 100).toFixed(1)}%
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  5-Fold CV Average
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Model Performance Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-200">Strengths</h4>
                <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
                  <li>• High accuracy on test data</li>
                  <li>• Consistent cross-validation performance</li>
                  <li>• Real-time prediction capability</li>
                </ul>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Algorithm</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                  <li>• Random Forest Classifier</li>
                  <li>• 100 decision trees</li>
                  <li>• Feature scaling applied</li>
                </ul>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-purple-800 dark:text-purple-200">Dataset</h4>
                <ul className="text-sm text-purple-700 dark:text-purple-300 mt-2 space-y-1">
                  <li>• 10,000 synthetic samples</li>
                  <li>• 10 behavioral features</li>
                  <li>• Balanced class distribution</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Feature Importance Analysis
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This chart shows how much each behavioral feature contributes to the ransomware detection model's decisions.
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={featureImportanceData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="name" type="category" width={150} className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgb(31 41 55)', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }} 
              />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Insights</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Higher values indicate more important features for detection</li>
              <li>• File modifications and encryption indicators are typically most predictive</li>
              <li>• CPU and memory usage patterns help distinguish malicious behavior</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'confusion' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Confusion Matrix Analysis
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This matrix shows how well the model distinguishes between safe and ransomware behavior.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={confusionMatrixData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgb(31 41 55)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }} 
                />
                <Bar dataKey="value">
                  {confusionMatrixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.confusion_matrix[0][0]}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    True Negatives
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Correctly identified safe
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {metrics.confusion_matrix[0][1]}
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    False Positives
                  </div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">
                    Safe flagged as ransomware
                  </div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {metrics.confusion_matrix[1][0]}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    False Negatives
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400">
                    Ransomware missed
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.confusion_matrix[1][1]}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    True Positives
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Correctly detected ransomware
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SDG 16 Connection */}
      <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center space-x-4">
          <Brain className="h-12 w-12 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              SDG 16 Impact: Strengthening Digital Security
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Our ML model contributes to building strong institutions by providing transparent, 
              explainable AI for cybersecurity. The feature importance analysis ensures accountability 
              in automated threat detection, supporting institutional trust in AI-driven security systems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelInsights;