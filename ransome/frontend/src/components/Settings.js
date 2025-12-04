import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, RefreshCw, Download, History } from 'lucide-react';
import { modelAPI } from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    fetchPredictionHistory();
  }, []);

  const fetchPredictionHistory = async () => {
    try {
      const response = await modelAPI.getPredictionHistory();
      setPredictionHistory(response.data);
    } catch (error) {
      toast.error('Failed to fetch prediction history');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await modelAPI.retrain();
      toast.success('Model retrained successfully!');
    } catch (error) {
      toast.error('Retraining failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setRetraining(false);
    }
  };

  const exportHistory = () => {
    const csvContent = [
      ['ID', 'Filename', 'Prediction', 'Confidence', 'Timestamp'],
      ...predictionHistory.map(p => [
        p.id,
        p.filename,
        p.prediction === 1 ? 'Ransomware' : 'Safe',
        (p.confidence * 100).toFixed(2) + '%',
        new Date(p.timestamp).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ransom_detect_history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('History exported successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Settings
      </h1>

      {/* Model Management */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Model Management
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Current Model
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Algorithm: Random Forest</li>
              <li>• Features: 10 behavioral indicators</li>
              <li>• Training Data: 10,000 samples</li>
              <li>• Last Updated: {new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Model Actions
            </h3>
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
        </div>
      </div>

      {/* Prediction History */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <History className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Prediction History
            </h2>
          </div>
          <button
            onClick={exportHistory}
            className="btn-secondary"
            disabled={predictionHistory.length === 0}
          >
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </div>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading history...</p>
          </div>
        ) : predictionHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No predictions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Filename
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Result
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Confidence
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {predictionHistory.slice(0, 20).map((prediction) => (
                  <tr key={prediction.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {prediction.filename}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.prediction === 1
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                          : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      }`}>
                        {prediction.prediction === 1 ? 'Ransomware' : 'Safe'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {(prediction.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {new Date(prediction.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Information */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <SettingsIcon className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            System Information
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Application
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Version: 1.0.0</li>
              <li>Build: Production</li>
              <li>Environment: Web</li>
            </ul>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Backend API
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Status: Online</li>
              <li>Framework: FastAPI</li>
              <li>Database: SQLite</li>
            </ul>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              ML Engine
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Library: scikit-learn</li>
              <li>Model: Random Forest</li>
              <li>Features: 10</li>
            </ul>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          About RansomDetect
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          RansomDetect is a production-ready web application that uses machine learning to detect 
          ransomware activities in real-time based on system behavior patterns. The application 
          contributes to UN Sustainable Development Goal 16 by strengthening cybersecurity 
          infrastructure and protecting digital assets.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Key Features</h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Real-time behavior monitoring</li>
              <li>• ML-based threat detection</li>
              <li>• Professional dashboard interface</li>
              <li>• Comprehensive model insights</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Technology Stack</h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Frontend: React.js + Tailwind CSS</li>
              <li>• Backend: Python FastAPI</li>
              <li>• ML: scikit-learn Random Forest</li>
              <li>• Database: SQLite</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;