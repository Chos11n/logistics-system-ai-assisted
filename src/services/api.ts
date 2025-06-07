import axios from 'axios';
import { Cargo, TruckCargo } from '../types/CargoTypes';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
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
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('❌ Backend server is not running or unreachable');
      console.error('Please ensure the backend server is started with: npm run dev:backend');
    } else if (error.code === 'ECONNABORTED') {
      console.error('❌ Request timeout - server may be overloaded');
    } else {
      console.error('API Response Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export const cargoAPI = {
  // Get all cargo items
  getAll: async (status?: string): Promise<Cargo[]> => {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/cargo', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cargo:', error);
      throw error;
    }
  },

  // Get cargo by ID
  getById: async (id: string): Promise<Cargo> => {
    try {
      const response = await api.get(`/cargo/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch cargo ${id}:`, error);
      throw error;
    }
  },

  // Create new cargo
  create: async (cargo: Omit<Cargo, 'id'> & { id: string }): Promise<Cargo> => {
    try {
      const response = await api.post('/cargo', cargo);
      return response.data;
    } catch (error) {
      console.error('Failed to create cargo:', error);
      throw error;
    }
  },

  // Update cargo status
  updateStatus: async (id: string, status: string): Promise<Cargo> => {
    try {
      const response = await api.patch(`/cargo/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Failed to update cargo ${id} status:`, error);
      throw error;
    }
  },

  // Delete cargo
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/cargo/${id}`);
    } catch (error) {
      console.error(`Failed to delete cargo ${id}:`, error);
      throw error;
    }
  },
};

export const truckAPI = {
  // Get all trucks with cargo
  getAll: async (): Promise<TruckCargo[]> => {
    try {
      const response = await api.get('/trucks');
      return response.data.map((truck: any) => ({
        truckId: truck.id,
        truckType: JSON.parse(truck.truck_type),
        cargos: truck.cargos || [],
        loadingDate: truck.loading_date,
      }));
    } catch (error) {
      console.error('Failed to fetch trucks:', error);
      throw error;
    }
  },

  // Load cargo to trucks
  loadCargo: async (cargoIds: string[]): Promise<TruckCargo[]> => {
    try {
      const response = await api.post('/trucks/load', { cargoIds });
      return response.data.map((truck: any) => ({
        truckId: truck.id,
        truckType: JSON.parse(truck.truck_type),
        cargos: truck.cargos || [],
        loadingDate: truck.loading_date,
      }));
    } catch (error) {
      console.error('Failed to load cargo to trucks:', error);
      throw error;
    }
  },
};

export const healthAPI = {
  check: async (): Promise<{ status: string; timestamp: string; database?: string }> => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },
};

export default api;