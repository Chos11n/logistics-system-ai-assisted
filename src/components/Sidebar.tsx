import React from 'react';
import { Truck, Package, Archive as ArchiveBox, Home, Boxes, Users, Settings } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
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
          <li>
            <button
              onClick={() => setActivePage('home')}
              className={`w-full flex items-center p-4 hover:bg-blue-800 transition-colors duration-200 ${
                activePage === 'home' ? 'bg-blue-800' : ''
              }`}
            >
              <Home className="mr-3" size={20} />
              <span>公司首页</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActivePage('input')}
              className={`w-full flex items-center p-4 hover:bg-blue-800 transition-colors duration-200 ${
                activePage === 'input' ? 'bg-blue-800' : ''
              }`}
            >
              <Package className="mr-3" size={20} />
              <span>输入货物信息</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActivePage('warehouse')}
              className={`w-full flex items-center p-4 hover:bg-blue-800 transition-colors duration-200 ${
                activePage === 'warehouse' ? 'bg-blue-800' : ''
              }`}
            >
              <ArchiveBox className="mr-3" size={20} />
              <span>仓库</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActivePage('trucks')}
              className={`w-full flex items-center p-4 hover:bg-blue-800 transition-colors duration-200 ${
                activePage === 'trucks' ? 'bg-blue-800' : ''
              }`}
            >
              <Truck className="mr-3" size={20} />
              <span>装车详情</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActivePage('truck-management')}
              className={`w-full flex items-center p-4 hover:bg-blue-800 transition-colors duration-200 ${
                activePage === 'truck-management' ? 'bg-blue-800' : ''
              }`}
            >
              <Settings className="mr-3" size={20} />
              <span>货车管理</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActivePage('customer-management')}
              className={`w-full flex items-center p-4 hover:bg-blue-800 transition-colors duration-200 ${
                activePage === 'customer-management' ? 'bg-blue-800' : ''
              }`}
            >
              <Users className="mr-3" size={20} />
              <span>客户管理</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActivePage('history')}
              className={`w-full flex items-center p-4 hover:bg-blue-800 transition-colors duration-200 ${
                activePage === 'history' ? 'bg-blue-800' : ''
              }`}
            >
              <Boxes className="mr-3" size={20} />
              <span>历史货物</span>
            </button>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-blue-800 text-xs text-blue-300">
        <p>© 2025 环亚物流有限公司</p>
      </div>
    </div>
  );
};

export default Sidebar;