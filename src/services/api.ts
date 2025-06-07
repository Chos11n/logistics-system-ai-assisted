import axios from 'axios';
import { Cargo, TruckCargo } from '../types/CargoTypes';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const cargoAPI = {
  // Get all cargo items
  getAll: async (status?: string): Promise<Cargo[]> => {
    const params = status ? { status } : {};
    const response = await api.get('/cargo', { params });
    return response.data;
  },

  // Get cargo by ID
  getById: async (id: string): Promise<Cargo> => {
    const response = await api.get(`/cargo/${id}`);
    return response.data;
  },

  // Create new cargo
  create: async (cargo: Omit<Cargo, 'id'> & { id: string }): Promise<Cargo> => {
    const response = await api.post('/cargo', cargo);
    return response.data;
  },

  // Update cargo status
  updateStatus: async (id: string, status: string): Promise<Cargo> => {
    const response = await api.patch(`/cargo/${id}/status`, { status });
    return response.data;
  },

  // Delete cargo
  delete: async (id: string): Promise<void> => {
    await api.delete(`/cargo/${id}`);
  },
};

export const truckAPI = {
  // Get all trucks with cargo
  getAll: async (): Promise<TruckCargo[]> => {
    const response = await api.get('/trucks');
    return response.data.map((truck: any) => ({
      truckId: truck.id,
      truckType: JSON.parse(truck.truck_type),
      cargos: truck.cargos || [],
      loadingDate: truck.loading_date,
    }));
  },

  // Load cargo to trucks
  loadCargo: async (cargoIds: string[]): Promise<TruckCargo[]> => {
    const response = await api.post('/trucks/load', { cargoIds });
    return response.data.map((truck: any) => ({
      truckId: truck.id,
      truckType: JSON.parse(truck.truck_type),
      cargos: truck.cargos || [],
      loadingDate: truck.loading_date,
    }));
  },
};

export const healthAPI = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;