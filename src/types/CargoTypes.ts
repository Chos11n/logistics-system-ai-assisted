export interface Cargo {
  id: string;
  name: string;
  manufacturer: string;
  quantity: number;
  length: number;
  width: number;
  height: number;
  volume: number;
  weight: number;
  notes: string;
  date: string;
  cargoType: string;
  category: string;
  urgent: boolean;
  selected?: boolean;
  truckId?: string;
  customerId?: string;
}

export type CargoType = '特轻货' | '轻货' | '重泡货' | '重货' | '特重货';

export interface TruckCargo {
  truckId: string;
  truckType: TruckType;
  cargos: Cargo[];
  loadingDate: string;
}

export interface TruckType {
  name: string;
  length: number;
  width: number;
  height: number;
  maxVolume: number;
  maxWeight: number;
}

export interface Truck {
  id: string;
  name: string;
  maxWeight: number; // 最大载重 (t)
  maxVolume: number; // 最大容积 (m³)
  selfWeight: number; // 车辆自重 (t)
  availableWeight: number; // 可用载重 (t)
  status: 'available' | 'loading' | 'dispatched' | 'maintenance';
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  type: 'large' | 'medium' | 'small'; // 大客户、中客户、小客户
  contactInfo?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export const TRUCK_TYPES: TruckType[] = [
  { 
    name: '轻型货车', 
    length: 2.7,
    width: 1.5,
    height: 1.4,
    maxVolume: 2.7 * 1.5 * 1.4,
    maxWeight: 1.5
  },
  { 
    name: '中型货车', 
    length: 4.2,
    width: 2.0,
    height: 1.8,
    maxVolume: 4.2 * 2.0 * 1.8,
    maxWeight: 5
  },
  { 
    name: '重型货车', 
    length: 7.6,
    width: 2.3,
    height: 2.4,
    maxVolume: 7.6 * 2.3 * 2.4,
    maxWeight: 15
  }
];

// 货型计算函数
export const calculateCargoType = (weight: number, volume: number): CargoType => {
  if (volume === 0) return '轻货';
  
  const density = (weight * 1000) / volume; // Convert tons to kg, then kg/m³
  
  if (density <= 100) {
    return '特轻货';
  } else if (density <= 200) {
    return '轻货';
  } else if (density <= 250) {
    return '重泡货';
  } else if (density <= 350) {
    return '重货';
  } else {
    return '特重货';
  }
};

// 客户优先级权重
export const getCustomerPriority = (customerType: Customer['type']): number => {
  switch (customerType) {
    case 'large': return 3;
    case 'medium': return 2;
    case 'small': return 1;
    default: return 0;
  }
};