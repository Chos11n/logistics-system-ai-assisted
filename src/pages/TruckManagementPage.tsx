import React, { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { Truck as TruckType } from '../types/CargoTypes';

const TruckManagementPage: React.FC = () => {
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState<TruckType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TruckType['status']>('all');

  const [formData, setFormData] = useState({
    name: '',
    maxWeight: 0,
    maxVolume: 0,
    selfWeight: 0,
    notes: ''
  });

  // 从localStorage加载数据
  useEffect(() => {
    const storedTrucks = localStorage.getItem('trucks');
    if (storedTrucks) {
      setTrucks(JSON.parse(storedTrucks));
    }
  }, []);

  // 保存到localStorage
  useEffect(() => {
    localStorage.setItem('trucks', JSON.stringify(trucks));
  }, [trucks]);

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = truck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         truck.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || truck.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.maxWeight <= 0 || formData.maxVolume <= 0 || formData.selfWeight < 0) {
      alert('请输入有效的数值');
      return;
    }

    if (formData.selfWeight >= formData.maxWeight) {
      alert('车辆自重不能大于或等于最大载重');
      return;
    }

    const availableWeight = formData.maxWeight - formData.selfWeight;
    
    if (editingTruck) {
      // 更新货车
      setTrucks(trucks.map(truck => 
        truck.id === editingTruck.id 
          ? {
              ...truck,
              ...formData,
              availableWeight
            }
          : truck
      ));
      setEditingTruck(null);
    } else {
      // 添加新货车
      const newTruck: TruckType = {
        id: `truck-${Date.now()}`,
        ...formData,
        availableWeight,
        status: 'available',
        createdAt: new Date().toISOString()
      };
      setTrucks([newTruck, ...trucks]);
    }

    // 重置表单
    setFormData({
      name: '',
      maxWeight: 0,
      maxVolume: 0,
      selfWeight: 0,
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleEdit = (truck: TruckType) => {
    setEditingTruck(truck);
    setFormData({
      name: truck.name,
      maxWeight: truck.maxWeight,
      maxVolume: truck.maxVolume,
      selfWeight: truck.selfWeight,
      notes: truck.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这辆货车吗？')) {
      setTrucks(trucks.filter(truck => truck.id !== id));
    }
  };

  const updateTruckStatus = (id: string, status: TruckType['status']) => {
    setTrucks(trucks.map(truck => 
      truck.id === id ? { ...truck, status } : truck
    ));
  };

  const getStatusColor = (status: TruckType['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'loading': return 'bg-yellow-100 text-yellow-800';
      case 'dispatched': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TruckType['status']) => {
    switch (status) {
      case 'available': return '可用';
      case 'loading': return '装载中';
      case 'dispatched': return '已派车';
      case 'maintenance': return '维护中';
      default: return '未知';
    }
  };

  const stats = {
    total: trucks.length,
    available: trucks.filter(t => t.status === 'available').length,
    loading: trucks.filter(t => t.status === 'loading').length,
    dispatched: trucks.filter(t => t.status === 'dispatched').length,
    maintenance: trucks.filter(t => t.status === 'maintenance').length
  };

  return (
    <div className="p-6 max-w-6xl mx-auto slide-in">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900 flex items-center">
          <Truck className="mr-3" size={28} />
          货车管理
        </h1>
        <p className="text-gray-600">管理所有货车信息和状态</p>
      </header>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">总数</h3>
          <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
        </div>
        <div className="card bg-green-50 p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2">可用</h3>
          <p className="text-2xl font-bold text-green-800">{stats.available}</p>
        </div>
        <div className="card bg-yellow-50 p-4">
          <h3 className="text-sm font-medium text-yellow-900 mb-2">装载中</h3>
          <p className="text-2xl font-bold text-yellow-800">{stats.loading}</p>
        </div>
        <div className="card bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">已派车</h3>
          <p className="text-2xl font-bold text-blue-800">{stats.dispatched}</p>
        </div>
        <div className="card bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-900 mb-2">维护中</h3>
          <p className="text-2xl font-bold text-red-800">{stats.maintenance}</p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="搜索货车..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="form-input w-32"
          >
            <option value="all">全部状态</option>
            <option value="available">可用</option>
            <option value="loading">装载中</option>
            <option value="dispatched">已派车</option>
            <option value="maintenance">维护中</option>
          </select>
        </div>
        
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingTruck(null);
            setFormData({
              name: '',
              maxWeight: 0,
              maxVolume: 0,
              selfWeight: 0,
              notes: ''
            });
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          添加货车
        </button>
      </div>

      {/* 货车列表 */}
      {filteredTrucks.length === 0 ? (
        <div className="card text-center py-12">
          <Truck className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">暂无货车记录</p>
          <p className="text-sm text-gray-400 mt-2">点击"添加货车"按钮开始添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrucks.map((truck) => (
            <div key={truck.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">{truck.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(truck.status)}`}>
                    {getStatusText(truck.status)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(truck)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(truck.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">最大载重：</span>
                  <span className="font-medium">{truck.maxWeight} t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">车辆自重：</span>
                  <span className="font-medium">{truck.selfWeight} t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">可用载重：</span>
                  <span className="font-bold text-green-600">{truck.availableWeight} t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">最大容积：</span>
                  <span className="font-medium">{truck.maxVolume} m³</span>
                </div>
                {truck.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                    <span className="text-gray-600">备注：</span>
                    <p className="mt-1">{truck.notes}</p>
                  </div>
                )}
              </div>

              {/* 状态操作按钮 */}
              <div className="mt-4 flex gap-1 flex-wrap">
                {truck.status !== 'available' && (
                  <button
                    onClick={() => updateTruckStatus(truck.id, 'available')}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    设为可用
                  </button>
                )}
                {truck.status !== 'maintenance' && (
                  <button
                    onClick={() => updateTruckStatus(truck.id, 'maintenance')}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    维护中
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加/编辑货车表单 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTruck ? '编辑货车' : '添加货车'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="form-label">货车名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="form-input"
                    required
                    placeholder="例如：粤A12345"
                  />
                </div>
                
                <div>
                  <label className="form-label">最大载重 (t)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.maxWeight}
                    onChange={(e) => setFormData({...formData, maxWeight: parseFloat(e.target.value) || 0})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">车辆自重 (t)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.selfWeight}
                    onChange={(e) => setFormData({...formData, selfWeight: parseFloat(e.target.value) || 0})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">最大容积 (m³)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.maxVolume}
                    onChange={(e) => setFormData({...formData, maxVolume: parseFloat(e.target.value) || 0})}
                    className="form-input"
                    required
                  />
                </div>

                {/* 实时计算可用载重 */}
                {formData.maxWeight > 0 && formData.selfWeight >= 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <span className="text-blue-700 text-sm">可用载重：</span>
                    <span className="font-bold text-blue-800 ml-2">
                      {(formData.maxWeight - formData.selfWeight).toFixed(1)} t
                    </span>
                  </div>
                )}
                
                <div>
                  <label className="form-label">备注</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="form-input"
                    rows={3}
                    placeholder="车辆相关备注信息..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingTruck(null);
                  }}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingTruck ? '更新' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TruckManagementPage;