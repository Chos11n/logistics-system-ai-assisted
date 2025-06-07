import React from 'react';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import InputCargoPage from './pages/InputCargoPage';
import WarehousePage from './pages/WarehousePage';
import HistoryPage from './pages/HistoryPage';
import TrucksPage from './pages/TrucksPage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { CargoProvider, useCargo } from './context/CargoContext';
import { healthAPI } from './services/api';
import './App.css';

function AppContent() {
  const [activePage, setActivePage] = useState('home');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const { loading, error } = useCargo();

  useEffect(() => {
    document.title = '环亚物流内部货物管理系统';
    
    // Check server health
    const checkServerHealth = async () => {
      try {
        await healthAPI.check();
        setServerStatus('online');
      } catch (err) {
        console.warn('Server is offline, using local storage fallback');
        setServerStatus('offline');
      }
    };

    checkServerHealth();
    
    // Check server health every 30 seconds
    const interval = setInterval(checkServerHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'input':
        return <InputCargoPage />;
      case 'warehouse':
        return <WarehousePage />;
      case 'trucks':
        return <TrucksPage />;
      case 'history':
        return <HistoryPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 overflow-auto relative">
        {/* Server Status Indicator */}
        <div className="absolute top-4 right-4 z-50">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
            serverStatus === 'online' 
              ? 'bg-green-100 text-green-800' 
              : serverStatus === 'offline'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              serverStatus === 'online' 
                ? 'bg-green-500' 
                : serverStatus === 'offline'
                ? 'bg-yellow-500'
                : 'bg-gray-500'
            }`} />
            {serverStatus === 'checking' && '检查中...'}
            {serverStatus === 'online' && '服务器在线'}
            {serverStatus === 'offline' && '离线模式'}
          </div>
        </div>

        {/* Global Loading Indicator */}
        {loading && (
          <div className="absolute top-16 right-4 z-50 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
            <LoadingSpinner size="sm" className="text-blue-600" />
            <span className="text-sm text-gray-600">处理中...</span>
          </div>
        )}

        {/* Global Error Message */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
            <ErrorMessage 
              message={error} 
              onDismiss={() => {/* Error will be cleared by context */}} 
            />
          </div>
        )}

        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <CargoProvider>
      <AppContent />
    </CargoProvider>
  );
}

export default App;