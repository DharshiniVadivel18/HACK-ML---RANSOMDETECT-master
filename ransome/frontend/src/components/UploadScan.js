import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { modelAPI } from '../services/api';
import toast from 'react-hot-toast';

const UploadScan = () => {
  const [dragActive, setDragActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [manualFeatures, setManualFeatures] = useState({
    file_access_rate: '',
    api_calls_per_sec: '',
    cpu_usage: '',
    memory_usage: '',
    disk_io_rate: '',
    network_activity: '',
    process_count: '',
    registry_changes: '',
    file_modifications: '',
    encryption_indicators: ''
  });

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = async (file) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast.error('Please upload a CSV or JSON file');
      return;
    }

    setScanning(true);
    
    try {
      // Simulate file processing and generate features
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock features based on file (in real app, parse the file)
      const mockFeatures = {
        file_access_rate: Math.random() * 200 + 50,
        api_calls_per_sec: Math.random() * 400 + 100,
        cpu_usage: Math.random() * 80 + 20,
        memory_usage: Math.random() * 70 + 30,
        disk_io_rate: Math.random() * 100 + 20,
        network_activity: Math.random() * 80 + 20,
        process_count: Math.random() * 100 + 50,
        registry_changes: Math.random() * 30 + 5,
        file_modifications: Math.random() * 200 + 10,
        encryption_indicators: Math.random() * 8
      };

      const response = await modelAPI.predict(mockFeatures);
      setResults({
        ...response.data,
        filename: file.name
      });
      
      toast.success('File scanned successfully!');
    } catch (error) {
      toast.error('Scan failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setScanning(false);
    }
  };

  const handleManualScan = async () => {
    // Validate inputs
    const features = {};
    let hasError = false;

    Object.keys(manualFeatures).forEach(key => {
      const value = parseFloat(manualFeatures[key]);
      if (isNaN(value) || value < 0) {
        hasError = true;
        return;
      }
      features[key] = value;
    });

    if (hasError) {
      toast.error('Please enter valid positive numbers for all features');
      return;
    }

    setScanning(true);
    
    try {
      const response = await modelAPI.predict(features);
      setResults({
        ...response.data,
        filename: 'Manual Input'
      });
      
      toast.success('Manual scan completed!');
    } catch (error) {
      toast.error('Scan failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setScanning(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return 'text-red-600 dark:text-red-400';
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-green-600 dark:text-green-400';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'HIGH': return <AlertCircle className="h-8 w-8 text-red-600" />;
      case 'MEDIUM': return <AlertCircle className="h-8 w-8 text-yellow-600" />;
      default: return <CheckCircle className="h-8 w-8 text-green-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Upload & Scan
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Upload Behavior Log
          </h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {scanning ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader className="h-12 w-12 text-blue-600 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Scanning file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Drop your files here
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    or click to browse (CSV, JSON)
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="btn-primary cursor-pointer"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Manual Input */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Manual Feature Input
          </h2>
          
          <div className="space-y-4">
            {Object.keys(manualFeatures).map((feature) => (
              <div key={feature}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={manualFeatures[feature]}
                  onChange={(e) => setManualFeatures(prev => ({
                    ...prev,
                    [feature]: e.target.value
                  }))}
                  className="input"
                  placeholder="Enter value"
                />
              </div>
            ))}
            
            <button
              onClick={handleManualScan}
              disabled={scanning}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanning ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Scanning...</span>
                </div>
              ) : (
                'Scan Features'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Scan Results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4">
              {getRiskIcon(results.risk_level)}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">File</p>
                <p className="font-medium text-gray-900 dark:text-white">{results.filename}</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Prediction</p>
              <p className={`text-2xl font-bold ${getRiskColor(results.risk_level)}`}>
                {results.prediction === 1 ? 'RANSOMWARE' : 'SAFE'}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
              <p className={`text-2xl font-bold ${getRiskColor(results.risk_level)}`}>
                {(results.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Risk Assessment
            </h3>
            <p className={`${getRiskColor(results.risk_level)} font-medium`}>
              Risk Level: {results.risk_level}
            </p>
            {results.risk_level === 'HIGH' && (
              <p className="text-red-600 dark:text-red-400 mt-2">
                ⚠️ Immediate action recommended! This behavior pattern shows strong indicators of ransomware activity.
              </p>
            )}
            {results.risk_level === 'MEDIUM' && (
              <p className="text-yellow-600 dark:text-yellow-400 mt-2">
                ⚡ Monitor closely. Some suspicious patterns detected that warrant investigation.
              </p>
            )}
            {results.risk_level === 'LOW' && (
              <p className="text-green-600 dark:text-green-400 mt-2">
                ✅ Normal behavior detected. No immediate threats identified.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadScan;