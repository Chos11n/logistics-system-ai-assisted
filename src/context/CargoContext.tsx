import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Cargo, TruckCargo } from '../types/CargoTypes';
import { cargoAPI, truckAPI } from '../services/api';

interface CargoContextType {
  warehouseItems: Cargo[];
  historyItems: Cargo[];
  truckItems: TruckCargo[];
  loading: boolean;
  error: string | null;
  addCargo: (cargo: Cargo) => Promise<void>;
  shipCargo: (id: string) => Promise<void>;
  loadToTruck: (cargoIds: string[]) => Promise<void>;
  undoShipment: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
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

  // Load data from API
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [warehouseCargo, shippedCargo, trucks] = await Promise.all([
        cargoAPI.getAll('warehouse'),
        cargoAPI.getAll('shipped'),
        truckAPI.getAll(),
      ]);

      setWarehouseItems(warehouseCargo);
      setHistoryItems(shippedCargo);
      setTruckItems(trucks);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data from server');
      
      // Fallback to localStorage if API fails
      const storedWarehouse = localStorage.getItem('warehouseItems');
      const storedHistory = localStorage.getItem('historyItems');
      const storedTrucks = localStorage.getItem('truckItems');

      if (storedWarehouse) setWarehouseItems(JSON.parse(storedWarehouse));
      if (storedHistory) setHistoryItems(JSON.parse(storedHistory));
      if (storedTrucks) setTruckItems(JSON.parse(storedTrucks));
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    refreshData();
  }, []);

  // Backup to localStorage
  useEffect(() => {
    localStorage.setItem('warehouseItems', JSON.stringify(warehouseItems));
    localStorage.setItem('historyItems', JSON.stringify(historyItems));
    localStorage.setItem('truckItems', JSON.stringify(truckItems));
  }, [warehouseItems, historyItems, truckItems]);

  const addCargo = async (cargo: Cargo) => {
    setLoading(true);
    setError(null);
    
    try {
      await cargoAPI.create(cargo);
      await refreshData(); // Refresh to get updated data
    } catch (err) {
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
      await cargoAPI.updateStatus(id, 'shipped');
      await refreshData(); // Refresh to get updated data
    } catch (err) {
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
      await truckAPI.loadCargo(cargoIds);
      await refreshData(); // Refresh to get updated data
    } catch (err) {
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
      await cargoAPI.updateStatus(id, 'warehouse');
      await refreshData(); // Refresh to get updated data
    } catch (err) {
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
      addCargo, 
      shipCargo,
      loadToTruck,
      undoShipment,
      refreshData
    }}>
      {children}
    </CargoContext.Provider>
  );
};