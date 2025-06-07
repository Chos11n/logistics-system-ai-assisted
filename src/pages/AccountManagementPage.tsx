import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, PERMISSIONS, ROLE_PERMISSIONS, getRoleDisplayName } from '../types/UserTypes';
import { Users, Plus, Edit2, Trash2, Shield, ShieldCheck, ShieldX } from 'lucide-react';

const AccountManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | User['role']>('all');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'operator' as User['role'],
    isActive: true
  });

  // 加载用户数据
  useEffect(() => {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);

  // 保存用户数据
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      alert('请输入用户名');
      return;
    }

    if (!formData.password.trim()) {
      alert('请输入密码');
      return;
    }

    // 检查用户名是否已存在
    const existingUser = users.find(u => u.username === formData.username && u.id !== editingUser?.id);
    if (existingUser) {
      alert('用户名已存在');
      return;
    }

    if (editingUser) {
      // 更新用户
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? {
              ...user,
              username: formData.username,
              password: formData.password,
              role: formData.role,
              permissions: ROLE_PERMISSIONS[formData.role],
              isActive: formData.isActive
            }
          : user
      ));
      setEditingUser(null);
    } else {
      // 添加新用户
      const newUser: User = {
        id: `user-${Date.now()}`,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        permissions: ROLE_PERMISSIONS[formData.role],
        createdAt: new Date().toISOString(),
        isActive: formData.isActive
      };
      setUsers([newUser, ...users]);
    }

    // 重置表单
    setFormData({
      username: '',
      password: '',
      role: 'operator',
      isActive: true
    });
    setShowAddForm(false);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password,
      role: user.role,
      isActive: user.isActive
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) {
      alert('不能删除当前登录的账户');
      return;
    }

    if (confirm('确定要删除这个账户吗？')) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  const toggleUserStatus = (id: string) => {
    if (id === currentUser?.id) {
      alert('不能禁用当前登录的账户');
      return;
    }

    setUsers(users.map(user => 
      user.id === id ? { ...user, isActive: !user.isActive } : user
    ));
  };

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="text-red-600" size={16} />;
      case 'manager': return <Shield className="text-blue-600" size={16} />;
      case 'operator': return <Shield className="text-green-600" size={16} />;
      case 'customer': return <ShieldX className="text-gray-600" size={16} />;
      default: return <Shield className="text-gray-600" size={16} />;
    }
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'operator': return 'bg-green-100 text-green-800';
      case 'customer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    operator: users.filter(u => u.role === 'operator').length,
    customer: users.filter(u => u.role === 'customer').length
  };

  return (
    <div className="p-6 max-w-6xl mx-auto slide-in">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900 flex items-center">
          <Users className="mr-3" size={28} />
          账户管理
        </h1>
        <p className="text-gray-600">管理系统用户账户和权限</p>
      </header>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="card bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">总用户数</h3>
          <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
        </div>
        <div className="card bg-green-50 p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2">活跃用户</h3>
          <p className="text-2xl font-bold text-green-800">{stats.active}</p>
        </div>
        <div className="card bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-900 mb-2">超级管理员</h3>
          <p className="text-2xl font-bold text-red-800">{stats.admin}</p>
        </div>
        <div className="card bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">管理员</h3>
          <p className="text-2xl font-bold text-blue-800">{stats.manager}</p>
        </div>
        <div className="card bg-green-50 p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2">操作员</h3>
          <p className="text-2xl font-bold text-green-800">{stats.operator}</p>
        </div>
        <div className="card bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">客户</h3>
          <p className="text-2xl font-bold text-gray-800">{stats.customer}</p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="搜索用户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="form-input w-40"
          >
            <option value="all">全部角色</option>
            <option value="admin">超级管理员</option>
            <option value="manager">管理员</option>
            <option value="operator">操作员</option>
            <option value="customer">客户</option>
          </select>
        </div>
        
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingUser(null);
            setFormData({
              username: '',
              password: '',
              role: 'operator',
              isActive: true
            });
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          添加用户
        </button>
      </div>

      {/* 用户列表 */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>角色</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>最后登录</th>
                <th>权限</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className="font-medium">{user.username}</span>
                      {user.id === currentUser?.id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">当前用户</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? '活跃' : '禁用'}
                    </span>
                  </td>
                  <td className="text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="text-sm text-gray-600">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '从未登录'}
                  </td>
                  <td>
                    <div className="text-xs text-gray-600">
                      {user.permissions.length} 项权限
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(user)}
                        className="table-action-btn bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Edit2 size={12} />
                      </button>
                      {user.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className={`table-action-btn ${
                              user.isActive 
                                ? 'bg-yellow-500 hover:bg-yellow-600' 
                                : 'bg-green-500 hover:bg-green-600'
                            } text-white`}
                          >
                            {user.isActive ? '禁用' : '启用'}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="table-action-btn bg-red-500 hover:bg-red-600 text-white"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 添加/编辑用户表单 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingUser ? '编辑用户' : '添加用户'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="form-label">用户名</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="form-input"
                    required
                    placeholder="输入用户名"
                  />
                </div>
                
                <div>
                  <label className="form-label">密码</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="form-input"
                    required
                    placeholder="输入密码"
                  />
                </div>
                
                <div>
                  <label className="form-label">角色</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as User['role']})}
                    className="form-input"
                    required
                  >
                    <option value="customer">客户</option>
                    <option value="operator">操作员</option>
                    <option value="manager">管理员</option>
                    <option value="admin">超级管理员</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="form-label flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="mr-2"
                    />
                    账户激活
                  </label>
                </div>

                {/* 权限预览 */}
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {getRoleDisplayName(formData.role)} 权限：
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    {ROLE_PERMISSIONS[formData.role].map(permission => (
                      <div key={permission.id}>• {permission.name}</div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingUser(null);
                  }}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingUser ? '更新' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagementPage;