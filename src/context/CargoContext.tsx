import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Cargo, TruckCargo } from '../types/CargoTypes';
import { cargoAPI, truckAPI, healthAPI } from '../services/api';

interface CargoContextType {
  warehouseItems: Cargo[];
  historyItems: Cargo[];
  truckItems: TruckCargo[];
  loading: boolean;
  error: string | null;
  serverStatus: 'connected' | 'disconnected' | 'checking';
  addCargo: (cargo: Cargo) => Promise<void>;
  shipCargo: (id: string) => Promise<void>;
  loadToTruck: (cargoIds: string[]) => Promise<void>;
  undoShipment: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  checkServerHealth: () => Promise<void>;
  markAsCarryOver: (cargoIds: string[]) => void;
}

const CargoContext = createContext<CargoContextType | undefined>(undefined);

export const useCargo = () => {
  const context = useContext(CargoContext);
  if (context === undefined) {
    throw new Error('useCargo must be used within a CargoProvider');
  }
  return context;
};

interface CargoProviderProps {
  children: ReactNode;
}

export const CargoProvider: React.FC<CargoProviderProps> = ({ children }) => {
  const [warehouseItems, setWarehouseItems] = useState<Cargo[]>([]);
  const [historyItems, setHistoryItems] = useState<Cargo[]>([]);
  const [truckItems, setTruckItems] = useState<TruckCargo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Check server health
  const checkServerHealth = async () => {
    try {
      setServerStatus('checking');
      await healthAPI.check();
      setServerStatus('connected');
      console.log('✅ Server is healthy');
    } catch (err) {
      setServerStatus('disconnected');
      console.error('❌ Server health check failed:', err);
    }
  };

  // 标记货物为上次遗留
  const markAsCarryOver = (cargoIds: string[]) => {
    setWarehouseItems(items => 
      items.map(item => 
        cargoIds.includes(item.id) 
          ? { ...item, isCarryOver: true }
          : item
      )
    );
  };

  // Load data from API with better error handling
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First check if server is available
      await checkServerHealth();
      
      if (serverStatus === 'disconnected') {
        throw new Error('Backend server is not available');
      }

      const [warehouseCargo, shippedCargo, trucks] = await Promise.all([
        cargoAPI.getAll('warehouse'),
        cargoAPI.getAll('shipped'),
        truckAPI.getAll(),
      ]);

      setWarehouseItems(warehouseCargo);
      setHistoryItems(shippedCargo);
      setTruckItems(trucks);
      setServerStatus('connected');
      
      console.log('✅ Data loaded successfully from server');
    } catch (err: any) {
      console.error('❌ Error loading data:', err);
      
      // Provide more specific error messages
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please ensure the backend is running on port 3001.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. The server may be overloaded.');
      } else {
        setError(err.message || 'Failed to load data from server');
      }
      
      setServerStatus('disconnected');
      
      // Fallback to localStorage if API fails
      try {
        const storedWarehouse = localStorage.getItem('warehouseItems');
        const storedHistory = localStorage.getItem('historyItems');
        const storedTrucks = localStorage.getItem('truckItems');

        if (storedWarehouse) {
          setWarehouseItems(JSON.parse(storedWarehouse));
          console.log('📦 Loaded warehouse data from localStorage');
        }
        if (storedHistory) {
          setHistoryItems(JSON.parse(storedHistory));
          console.log('📋 Loaded history data from localStorage');
        }
        if (storedTrucks) {
          setTruckItems(JSON.parse(storedTrucks));
          console.log('🚛 Loaded truck data from localStorage');
        }
      } catch (storageError) {
        console.error('Failed to load from localStorage:', storageError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data load and server health check
  useEffect(() => {
    const initializeApp = async () => {
      await checkServerHealth();
      await refreshData();
    };
    
    initializeApp();

    // Set up periodic health checks
    const healthCheckInterval = setInterval(checkServerHealth, 30000); // Check every 30 seconds
    
    return () => clearInterval(healthCheckInterval);
  }, []);

  // Backup to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem('warehouseItems', JSON.stringify(warehouseItems));
      localStorage.setItem('historyItems', JSON.stringify(historyItems));
      localStorage.setItem('truckItems', JSON.stringify(truckItems));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }, [warehouseItems, historyItems, truckItems]);

  const addCargo = async (cargo: Cargo) => {
    setLoading(true);
    setError(null);
    
    try {
      if (serverStatus === 'connected') {
        await cargoAPI.create(cargo);
        await refreshData(); // Refresh to get updated data
      } else {
        // Fallback to local state if server is unavailable
        setWarehouseItems([cargo, ...warehouseItems]);
        setError('Added cargo locally. Changes will sync when server is available.');
      }
    } catch (err: any) {
      console.error('Error adding cargo:', err);
      setError('Failed to add cargo');
      
      // Fallback to local state
      setWarehouseItems([cargo, ...warehouseItems]);
    } finally {
      setLoading(false);
    }
  };

  const shipCargo = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (serverStatus === 'connected') {
        await cargoAPI.updateStatus(id, 'shipped');
        await refreshData(); // Refresh to get updated data
      } else {
        // Fallback to local state
        const cargoToShip = warehouseItems.find(item => item.id === id);
        if (cargoToShip) {
          setWarehouseItems(warehouseItems.filter(item => item.id !== id));
          setHistoryItems([cargoToShip, ...historyItems]);
          setError('Shipped cargo locally. Changes will sync when server is available.');
        }
      }
    } catch (err: any) {
      console.error('Error shipping cargo:', err);
      setError('Failed to ship cargo');
      
      // Fallback to local state
      const cargoToShip = warehouseItems.find(item => item.id === id);
      if (cargoToShip) {
        setWarehouseItems(warehouseItems.filter(item => item.id !== id));
        setHistoryItems([cargoToShip, ...historyItems]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadToTruck = async (cargoIds: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      if (serverStatus === 'connected') {
        await truckAPI.loadCargo(cargoIds);
        await refreshData(); // Refresh to get updated data
      } else {
        setError('Cannot load cargo to truck while server is offline');
      }
    } catch (err: any) {
      console.error('Error loading cargo to truck:', err);
      setError('Failed to load cargo to truck');
    } finally {
      setLoading(false);
    }
  };

  const undoShipment = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (serverStatus === 'connected') {
        await cargoAPI.updateStatus(id, 'warehouse');
        await refreshData(); // Refresh to get updated data
      } else {
        // Fallback to local state
        const cargoToRestore = historyItems.find(item => item.id === id);
        if (cargoToRestore) {
          setHistoryItems(historyItems.filter(item => item.id !== id));
          
          // Remove from trucks
          const updatedTruckItems = truckItems.map(truck => ({
            ...truck,
            cargos: truck.cargos.filter(cargo => cargo.id !== id)
          })).filter(truck => truck.cargos.length > 0);
          
          setTruckItems(updatedTruckItems);
          setWarehouseItems([cargoToRestore, ...warehouseItems]);
          setError('Restored cargo locally. Changes will sync when server is available.');
        }
      }
    } catch (err: any) {
      console.error('Error undoing shipment:', err);
      setError('Failed to undo shipment');
      
      // Fallback to local state
      const cargoToRestore = historyItems.find(item => item.id === id);
      if (cargoToRestore) {
        setHistoryItems(historyItems.filter(item => item.id !== id));
        
        // Remove from trucks
        const updatedTruckItems = truckItems.map(truck => ({
          ...truck,
          cargos: truck.cargos.filter(cargo => cargo.id !== id)
        })).filter(truck => truck.cargos.length > 0);
        
        setTruckItems(updatedTruckItems);
        setWarehouseItems([cargoToRestore, ...warehouseItems]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CargoContext.Provider value={{ 
      warehouseItems, 
      historyItems, 
      truckItems,
      loading,
      error,
      serverStatus,
      addCargo, 
      shipCargo,
      loadToTruck,
      undoShipment,
      refreshData,
      checkServerHealth,
      markAsCarryOver
    }}>
      {children}
    </CargoContext.Provider>
  );
};