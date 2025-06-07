import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Settings, Key } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

const UserAvatar: React.FC = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  if (!user) return null;

  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-blue-500';
      case 'operator': return 'bg-green-500';
      case 'customer': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return '超级管理员';
      case 'manager': return '管理员';
      case 'operator': return '操作员';
      case 'customer': return '客户';
      default: return '未知';
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`w-10 h-10 rounded-full ${getAvatarColor(user.role)} text-white flex items-center justify-center font-semibold hover:opacity-80 transition-opacity`}
        >
          {user.username.charAt(0).toUpperCase()}
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 min-w-48 z-50">
            <div className="p-3 border-b border-gray-200">
              <p className="font-medium text-gray-900">{user.username}</p>
              <p className="text-sm text-gray-600">{getRoleDisplayName(user.role)}</p>
            </div>
            
            <div className="py-1">
              <button
                onClick={() => {
                  setShowChangePassword(true);
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Key size={16} />
                修改密码
              </button>
              
              <button
                onClick={() => {
                  logout();
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={16} />
                退出登录
              </button>
            </div>
          </div>
        )}
      </div>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </>
  );
};

export default UserAvatar;