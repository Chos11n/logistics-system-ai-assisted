import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Cargo, TruckCargo, TRUCK_TYPES } from '../types/CargoTypes';

interface CargoContextType {
  warehouseItems: Cargo[];
  historyItems: Cargo[];
  truckItems: TruckCargo[];
  addCargo: (cargo: Cargo) => void;
  shipCargo: (id: string) => void;
  loadToTruck: (cargoIds: string[]) => void;
  undoShipment: (id: string) => void;
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

interface Space {
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
}

export const CargoProvider: React.FC<CargoProviderProps> = ({ children }) => {
  const [warehouseItems, setWarehouseItems] = useState<Cargo[]>([]);
  const [historyItems, setHistoryItems] = useState<Cargo[]>([]);
  const [truckItems, setTruckItems] = useState<TruckCargo[]>([]);

  useEffect(() => {
    const storedWarehouse = localStorage.getItem('warehouseItems');
    const storedHistory = localStorage.getItem('historyItems');
    const storedTrucks = localStorage.getItem('truckItems');

    if (storedWarehouse) setWarehouseItems(JSON.parse(storedWarehouse));
    if (storedHistory) setHistoryItems(JSON.parse(storedHistory));
    if (storedTrucks) setTruckItems(JSON.parse(storedTrucks));
  }, []);

  useEffect(() => {
    localStorage.setItem('warehouseItems', JSON.stringify(warehouseItems));
    localStorage.setItem('historyItems', JSON.stringify(historyItems));
    localStorage.setItem('truckItems', JSON.stringify(truckItems));
  }, [warehouseItems, historyItems, truckItems]);

  const addCargo = (cargo: Cargo) => {
    setWarehouseItems([cargo, ...warehouseItems]);
  };

  const shipCargo = (id: string) => {
    const cargoToShip = warehouseItems.find(item => item.id === id);
    if (cargoToShip) {
      setWarehouseItems(warehouseItems.filter(item => item.id !== id));
      setHistoryItems([cargoToShip, ...historyItems]);
    }
  };

  const canFitInSpace = (cargo: Cargo, space: Space): boolean => {
    // 检查六种不同的放置方向
    const orientations = [
      [cargo.length, cargo.width, cargo.height],
      [cargo.length, cargo.height, cargo.width],
      [cargo.width, cargo.length, cargo.height],
      [cargo.width, cargo.height, cargo.length],
      [cargo.height, cargo.length, cargo.width],
      [cargo.height, cargo.width, cargo.length]
    ];

    return orientations.some(([l, w, h]) => 
      l <= space.length && w <= space.width && h <= space.height
    );
  };

  const findBestFit = (cargo: Cargo, spaces: Space[]): Space | null => {
    let bestSpace: Space | null = null;
    let minWastedSpace = Infinity;

    for (const space of spaces) {
      if (canFitInSpace(cargo, space)) {
        const wastedSpace = (space.length * space.width * space.height) - 
                          (cargo.length * cargo.width * cargo.height);
        if (wastedSpace < minWastedSpace) {
          minWastedSpace = wastedSpace;
          bestSpace = space;
        }
      }
    }

    return bestSpace;
  };

  const splitSpace = (space: Space, cargo: Cargo): Space[] => {
    const newSpaces: Space[] = [];
    
    // 在剩余空间中创建新的可用空间
    if (space.length - cargo.length > 0) {
      newSpaces.push({
        x: space.x + cargo.length,
        y: space.y,
        z: space.z,
        length: space.length - cargo.length,
        width: space.width,
        height: space.height
      });
    }

    if (space.width - cargo.width > 0) {
      newSpaces.push({
        x: space.x,
        y: space.y + cargo.width,
        z: space.z,
        length: cargo.length,
        width: space.width - cargo.width,
        height: space.height
      });
    }

    if (space.height - cargo.height > 0) {
      newSpaces.push({
        x: space.x,
        y: space.y,
        z: space.z + cargo.height,
        length: cargo.length,
        width: cargo.width,
        height: space.height - cargo.height
      });
    }

    return newSpaces;
  };

  const tryLoadIntoTruck = (
    cargos: Cargo[], 
    truckType: typeof TRUCK_TYPES[number]
  ): { success: boolean; loadedCargos: Cargo[]; remainingCargos: Cargo[] } => {
    let availableSpaces: Space[] = [{
      x: 0,
      y: 0,
      z: 0,
      length: truckType.length,
      width: truckType.width,
      height: truckType.height
    }];

    const loadedCargos: Cargo[] = [];
    const remainingCargos: Cargo[] = [];
    let currentWeight = 0;

    for (const cargo of cargos) {
      if (currentWeight + cargo.weight > truckType.maxWeight) {
        remainingCargos.push(cargo);
        continue;
      }

      const bestSpace = findBestFit(cargo, availableSpaces);
      if (bestSpace) {
        availableSpaces = availableSpaces.filter(space => space !== bestSpace);
        availableSpaces.push(...splitSpace(bestSpace, cargo));
        loadedCargos.push(cargo);
        currentWeight += cargo.weight;
      } else {
        remainingCargos.push(cargo);
      }
    }

    return {
      success: loadedCargos.length > 0,
      loadedCargos,
      remainingCargos
    };
  };

  const loadToTruck = (cargoIds: string[]) => {
    const cargosToLoad = warehouseItems.filter(item => cargoIds.includes(item.id));
    const loadingDate = new Date().toISOString().split('T')[0];
    const newTruckCargos: TruckCargo[] = [];

    // 按体积从大到小排序货物
    let remainingCargos = [...cargosToLoad].sort((a, b) => b.volume - a.volume);

    while (remainingCargos.length > 0) {
      let bestTruckType = null;
      let bestLoadResult = null;

      // 尝试每种类型的货车
      for (const truckType of TRUCK_TYPES) {
        const loadResult = tryLoadIntoTruck(remainingCargos, truckType);
        
        if (loadResult.success && (!bestLoadResult || loadResult.loadedCargos.length > bestLoadResult.loadedCargos.length)) {
          bestTruckType = truckType;
          bestLoadResult = loadResult;
        }
      }

      if (bestTruckType && bestLoadResult) {
        newTruckCargos.push({
          truckId: `truck-${truckItems.length + newTruckCargos.length + 1}`,
          truckType: bestTruckType,
          cargos: bestLoadResult.loadedCargos,
          loadingDate
        });
        remainingCargos = bestLoadResult.remainingCargos;
      } else {
        // 如果没有找到合适的货车，使用最大的货车装载第一个货物
        const largestTruck = TRUCK_TYPES[TRUCK_TYPES.length - 1];
        newTruckCargos.push({
          truckId: `truck-${truckItems.length + newTruckCargos.length + 1}`,
          truckType: largestTruck,
          cargos: [remainingCargos[0]],
          loadingDate
        });
        remainingCargos = remainingCargos.slice(1);
      }
    }

    setTruckItems([...newTruckCargos, ...truckItems]);
    setWarehouseItems(warehouseItems.filter(item => !cargoIds.includes(item.id)));
    setHistoryItems([...cargosToLoad, ...historyItems]);
  };

  const undoShipment = (id: string) => {
    const cargoToRestore = historyItems.find(item => item.id === id);
    if (cargoToRestore) {
      // 从历史记录中移除
      setHistoryItems(historyItems.filter(item => item.id !== id));
      
      // 从所有货车中移除该货物
      const updatedTruckItems = truckItems.map(truck => ({
        ...truck,
        cargos: truck.cargos.filter(cargo => cargo.id !== id)
      })).filter(truck => truck.cargos.length > 0); // 移除空货车
      
      setTruckItems(updatedTruckItems);
      
      // 恢复到仓库
      setWarehouseItems([cargoToRestore, ...warehouseItems]);
    }
  };

  return (
    <CargoContext.Provider value={{ 
      warehouseItems, 
      historyItems, 
      truckItems,
      addCargo, 
      shipCargo,
      loadToTruck,
      undoShipment 
    }}>
      {children}
    </CargoContext.Provider>
  );
};