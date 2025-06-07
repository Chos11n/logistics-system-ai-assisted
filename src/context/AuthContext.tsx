import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, PERMISSIONS, ROLE_PERMISSIONS } from '../types/UserTypes';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permissionId: string) => boolean;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化默认管理员账户
  useEffect(() => {
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) {
      const defaultAdmin: User = {
        id: 'admin-001',
        username: 'admin',
        password: '123',
        role: 'admin',
        permissions: Object.values(PERMISSIONS),
        createdAt: new Date().toISOString(),
        isActive: true
      };
      localStorage.setItem('users', JSON.stringify([defaultAdmin]));
    }

    // 检查是否有保存的登录状态
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return false;

    const users: User[] = JSON.parse(storedUsers);
    const foundUser = users.find(u => u.username === username && u.password === password && u.isActive);

    if (foundUser) {
      // 更新最后登录时间
      const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
      const updatedUsers = users.map(u => u.id === foundUser.id ? updatedUser : u);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permissionId: string): boolean => {
    if (!user) return false;
    return user.permissions.some(p => p.id === permissionId);
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!user || user.password !== oldPassword) return false;

    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return false;

    const users: User[] = JSON.parse(storedUsers);
    const updatedUser = { ...user, password: newPassword };
    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      hasPermission,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};