import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UploadScan from './components/UploadScan';
import ModelInsights from './components/ModelInsights';
import Settings from './components/Settings';
import { healthAPI } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      healthAPI.check()
        .then(() => {
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <UploadScan />;
      case 'insights':
        return <ModelInsights />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading RansomDetect...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
            },
          }}
        />
      </>
    );
  }

  return (
    <>
      <Layout 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
      >
        {renderPage()}
      </Layout>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

export default App;