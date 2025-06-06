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
}

export type CargoType = '轻货' | '重货' | '轻泡货' | '重泡货' | '其它';

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