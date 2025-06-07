import React from 'react';
import { Truck, Package, Archive as ArchiveBox, Home, Boxes, Users, Settings, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../types/UserTypes';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { hasPermission } = useAuth();

  const menuItems = [
    {
      id: 'home',
      label: '公司首页',
      icon: Home,
      permission: PERMISSIONS.HOME_ACCESS.id
    },
    {
      id: 'input',
      label: '输入货物信息',
      icon: Package,
      permission: PERMISSIONS.INPUT_CARGO.id
    },
    {
      id: 'warehouse',
      label: '仓库',
      icon: ArchiveBox,
      permission: PERMISSIONS.WAREHOUSE_ACCESS.id
    },
    {
      id: 'trucks',
      label: '装车详情',
      icon: Truck,
      permission: PERMISSIONS.VIEW_TRUCKS.id
    },
    {
      id: 'truck-management',
      label: '货车管理',
      icon: Settings,
      permission: PERMISSIONS.TRUCK_MANAGEMENT.id
    },
    {
      id: 'customer-management',
      label: '客户管理',
      icon: Users,
      permission: PERMISSIONS.CUSTOMER_MANAGEMENT.id
    },
    {
      id: 'account-management',
      label: '账户管理',
      icon: UserCog,
      permission: PERMISSIONS.ACCOUNT_MANAGEMENT.id
    },
    {
      id: 'history',
      label: '历史货物',
      icon: Boxes,
      permission: PERMISSIONS.VIEW_HISTORY.id
    }
  ];

  const visibleMenuItems = menuItems.filter(item => hasPermission(item.permission));

  return (
    <div className="w-64 bg-blue-900 text-white h-screen flex flex-col shadow-lg">
      <div className="p-4 border-b border-blue-800">
        <h1 className="text-lg font-bold flex items-center">
          <Truck className="mr-2" size={24} />
          环亚物流管理系统
        </h1>
      </div>
      
      <nav className="flex-1 pt-4">
        <ul>
          {visibleMenuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center p-4 hover:bg-blue-800 transition-colors duration-200 ${
                    activePage === item.id ? 'bg-blue-800' : ''
                  }`}
                >
                  <IconComponent className="mr-3" size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-blue-800 text-xs text-blue-300">
        <p>© 2025 环亚物流有限公司</p>
      </div>
    </div>
  );
};

export default Sidebar;