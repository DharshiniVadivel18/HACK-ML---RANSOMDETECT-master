import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import websocketService from '../services/websocket';

const Dashboard = () => {
  const [systemData, setSystemData] = useState([]);
  const [currentMetrics, setCurrentMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [riskLevel, setRiskLevel] = useState('LOW');

  useEffect(() => {
    // Start WebSocket simulation
    websocketService.simulateConnection();

    const unsubscribeUpdates = websocketService.subscribe('system_update', (data) => {
      setCurrentMetrics(data.features);
      setRiskLevel(data.risk_level);
      
      // Add to chart data (keep last 20 points)
      setSystemData(prev => {
        const newData = [...prev, {
          time: new Date(data.timestamp).toLocaleTimeString(),
          cpu: data.features.cpu_usage,
          memory: data.features.memory_usage,
          fileAccess: data.features.file_access_rate,
          apiCalls: data.features.api_calls_per_sec,
          prediction: data.prediction,
          confidence: data.confidence * 100
        }].slice(-20);
        return newData;
      });
    });

    const unsubscribeAlerts = websocketService.subscribe('alert', (data) => {
      setAlerts(prev => [{
        id: Date.now(),
        message: data.message,
        timestamp: data.timestamp,
        severity: data.severity
      }, ...prev].slice(0, 5));
    });

    return () => {
      unsubscribeUpdates();
      unsubscribeAlerts();
    };
  }, []);

  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return 'text-red-600 dark:text-red-400';
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-green-600 dark:text-green-400';
    }
  };

  const getRiskBg = (level) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 dark:bg-red-900/20';
      case 'MEDIUM': return 'bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'bg-green-100 dark:bg-green-900/20';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          RansomDetect Dashboard
        </h1>
        <div className={`px-4 py-2 rounded-lg ${getRiskBg(riskLevel)}`}>
          <span className={`font-semibold ${getRiskColor(riskLevel)}`}>
            Risk Level: {riskLevel}
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CPU Usage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentMetrics.cpu_usage?.toFixed(1) || '0'}%
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentMetrics.memory_usage?.toFixed(1) || '0'}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">File Access Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentMetrics.file_access_rate?.toFixed(0) || '0'}/s
              </p>
            </div>
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Calls</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentMetrics.api_calls_per_sec?.toFixed(0) || '0'}/s
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Metrics Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Metrics Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={systemData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgb(31 41 55)', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }} 
              />
              <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} name="CPU %" />
              <Line type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} name="Memory %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Threat Detection Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Threat Detection Confidence
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={systemData.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgb(31 41 55)', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }} 
              />
              <Bar dataKey="confidence" fill="#8b5cf6" name="Confidence %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Alerts
        </h3>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No recent alerts</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-red-800 dark:text-red-200">{alert.message}</span>
                </div>
                <span className="text-sm text-red-600 dark:text-red-400">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SDG 16 Impact */}
      <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center space-x-4">
          <Shield className="h-12 w-12 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contributing to SDG 16: Peace, Justice and Strong Institutions
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              This system strengthens cybersecurity infrastructure by providing real-time ransomware detection, 
              protecting digital assets and supporting institutional security frameworks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;