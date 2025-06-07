import React from 'react';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import InputCargoPage from './pages/InputCargoPage';
import WarehousePage from './pages/WarehousePage';
import HistoryPage from './pages/HistoryPage';
import TrucksPage from './pages/TrucksPage';
import TruckManagementPage from './pages/TruckManagementPage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import AccountManagementPage from './pages/AccountManagementPage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import LoginModal from './components/LoginModal';
import UserAvatar from './components/UserAvatar';
import { CargoProvider, useCargo } from './context/CargoContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { healthAPI } from './services/api';
import './App.css';

function AppContent() {
  const [activePage, setActivePage] = useState('home');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { loading, error } = useCargo();
  const { isAuthenticated, user } = useAuth();

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

  // 如果未登录，显示登录界面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-900 mb-4">环亚物流内部货物管理系统</h1>
          <p className="text-gray-600 mb-8">请登录以继续使用系统</p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="btn-primary px-8 py-3 text-lg"
          >
            登录系统
          </button>
        </div>
        
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

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
      case 'truck-management':
        return <TruckManagementPage />;
      case 'customer-management':
        return <CustomerManagementPage />;
      case 'account-management':
        return <AccountManagementPage />;
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
        {/* 顶部状态栏 */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
          {/* Server Status Indicator */}
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

          {/* User Avatar */}
          <UserAvatar />
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
    <AuthProvider>
      <CargoProvider>
        <AppContent />
      </CargoProvider>
    </AuthProvider>
  );
}

export default App;