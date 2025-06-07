import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Building2, User, UserCheck } from 'lucide-react';
import { Customer } from '../types/CargoTypes';

const CustomerManagementPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | Customer['type']>('all');

  const [formData, setFormData] = useState({
    name: '',
    type: 'medium' as Customer['type'],
    contactInfo: '',
    address: '',
    notes: ''
  });

  // 从localStorage加载数据
  useEffect(() => {
    const storedCustomers = localStorage.getItem('customers');
    if (storedCustomers) {
      setCustomers(JSON.parse(storedCustomers));
    }
  }, []);

  // 保存到localStorage
  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.contactInfo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || customer.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('请输入客户名称');
      return;
    }

    if (editingCustomer) {
      // 更新客户
      setCustomers(customers.map(customer => 
        customer.id === editingCustomer.id 
          ? {
              ...customer,
              ...formData
            }
          : customer
      ));
      setEditingCustomer(null);
    } else {
      // 添加新客户
      const newCustomer: Customer = {
        id: `customer-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString()
      };
      setCustomers([newCustomer, ...customers]);
    }

    // 重置表单
    setFormData({
      name: '',
      type: 'medium',
      contactInfo: '',
      address: '',
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      type: customer.type,
      contactInfo: customer.contactInfo || '',
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个客户吗？')) {
      setCustomers(customers.filter(customer => customer.id !== id));
    }
  };

  const getTypeColor = (type: Customer['type']) => {
    switch (type) {
      case 'large': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'small': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: Customer['type']) => {
    switch (type) {
      case 'large': return '大客户';
      case 'medium': return '中客户';
      case 'small': return '小客户';
      default: return '未知';
    }
  };

  const getTypeIcon = (type: Customer['type']) => {
    switch (type) {
      case 'large': return <Building2 size={16} />;
      case 'medium': return <UserCheck size={16} />;
      case 'small': return <User size={16} />;
      default: return <User size={16} />;
    }
  };

  const stats = {
    total: customers.length,
    large: customers.filter(c => c.type === 'large').length,
    medium: customers.filter(c => c.type === 'medium').length,
    small: customers.filter(c => c.type === 'small').length
  };

  return (
    <div className="p-6 max-w-6xl mx-auto slide-in">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900 flex items-center">
          <Users className="mr-3" size={28} />
          客户管理
        </h1>
        <p className="text-gray-600">管理所有客户信息和分类</p>
      </header>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">总客户数</h3>
          <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
        </div>
        <div className="card bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-900 mb-2 flex items-center">
            <Building2 size={16} className="mr-1" />
            大客户
          </h3>
          <p className="text-2xl font-bold text-red-800">{stats.large}</p>
        </div>
        <div className="card bg-yellow-50 p-4">
          <h3 className="text-sm font-medium text-yellow-900 mb-2 flex items-center">
            <UserCheck size={16} className="mr-1" />
            中客户
          </h3>
          <p className="text-2xl font-bold text-yellow-800">{stats.medium}</p>
        </div>
        <div className="card bg-green-50 p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2 flex items-center">
            <User size={16} className="mr-1" />
            小客户
          </h3>
          <p className="text-2xl font-bold text-green-800">{stats.small}</p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="搜索客户..."
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="form-input w-32"
          >
            <option value="all">全部类型</option>
            <option value="large">大客户</option>
            <option value="medium">中客户</option>
            <option value="small">小客户</option>
          </select>
        </div>
        
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingCustomer(null);
            setFormData({
              name: '',
              type: 'medium',
              contactInfo: '',
              address: '',
              notes: ''
            });
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          添加客户
        </button>
      </div>

      {/* 客户列表 */}
      {filteredCustomers.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">暂无客户记录</p>
          <p className="text-sm text-gray-400 mt-2">点击"添加客户"按钮开始添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">{customer.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(customer.type)}`}>
                    {getTypeIcon(customer.type)}
                    {getTypeText(customer.type)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {customer.contactInfo && (
                  <div>
                    <span className="text-gray-600">联系方式：</span>
                    <p className="font-medium">{customer.contactInfo}</p>
                  </div>
                )}
                {customer.address && (
                  <div>
                    <span className="text-gray-600">地址：</span>
                    <p className="font-medium">{customer.address}</p>
                  </div>
                )}
                {customer.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                    <span className="text-gray-600">备注：</span>
                    <p className="mt-1">{customer.notes}</p>
                  </div>
                )}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  创建时间：{new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加/编辑客户表单 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCustomer ? '编辑客户' : '添加客户'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="form-label">客户名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="form-input"
                    required
                    placeholder="输入客户名称"
                  />
                </div>
                
                <div>
                  <label className="form-label">客户类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as Customer['type']})}
                    className="form-input"
                    required
                  >
                    <option value="large">大客户</option>
                    <option value="medium">中客户</option>
                    <option value="small">小客户</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    大客户在智能装车时享有优先权
                  </p>
                </div>
                
                <div>
                  <label className="form-label">联系方式</label>
                  <input
                    type="text"
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                    className="form-input"
                    placeholder="电话、邮箱等联系方式"
                  />
                </div>
                
                <div>
                  <label className="form-label">地址</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="form-input"
                    placeholder="客户地址"
                  />
                </div>
                
                <div>
                  <label className="form-label">备注</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="form-input"
                    rows={3}
                    placeholder="客户相关备注信息..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCustomer(null);
                  }}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingCustomer ? '更新' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagementPage;