import React from 'react';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import InputCargoPage from './pages/InputCargoPage';
import WarehousePage from './pages/WarehousePage';
import HistoryPage from './pages/HistoryPage';
import TrucksPage from './pages/TrucksPage';
import { CargoProvider } from './context/CargoContext';
import './App.css';

function App() {
  const [activePage, setActivePage] = useState('home');

  useEffect(() => {
    document.title = '环亚物流内部货物管理系统';
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
    <CargoProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </CargoProvider>
  );
}

export default App;