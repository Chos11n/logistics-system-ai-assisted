import React, { useState, useEffect } from 'react';
import { useCargo } from '../context/CargoContext';
import { Cargo, Customer } from '../types/CargoTypes';

const InputCargoPage: React.FC = () => {
  const { addCargo } = useCargo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [calculatedCargoType, setCalculatedCargoType] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  
  const [cargoData, setCargoData] = useState<Omit<Cargo, 'id' | 'volume' | 'cargoType'>>({
    name: '',
    manufacturer: '',
    quantity: 0,
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    notes: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    urgent: false,
    hasTimeLimit: false,
    timeLimitDate: '',
    isCarryOver: false
  });

  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    type: 'medium' as Customer['type'],
    contactInfo: '',
    address: '',
    notes: ''
  });

  // 加载客户数据
  useEffect(() => {
    const storedCustomers = localStorage.getItem('customers');
    if (storedCustomers) {
      setCustomers(JSON.parse(storedCustomers));
    }
  }, []);

  const calculateVolume = (length: number, width: number, height: number): number => {
    return length * width * height; // Already in cubic meters since input is in meters
  };

  const calculateCargoType = (weight: number, volume: number): string => {
    if (volume === 0) return '';
    
    const density = (weight * 1000) / volume; // Convert tons to kg, then kg/m³
    
    if (density <= 100) {
      return '特轻货';
    } else if (density <= 200) {
      return '轻货';
    } else if (density <= 250) {
      return '重泡货';
    } else if (density <= 350) {
      return '重货';
    } else {
      return '特重货';
    }
  };

  // 实时计算货型
  useEffect(() => {
    const volume = calculateVolume(cargoData.length, cargoData.width, cargoData.height);
    if (volume > 0 && cargoData.weight > 0) {
      const cargoType = calculateCargoType(cargoData.weight, volume);
      setCalculatedCargoType(cargoType);
    } else {
      setCalculatedCargoType('');
    }
  }, [cargoData.length, cargoData.width, cargoData.height, cargoData.weight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (type === 'checkbox') {
      setCargoData({
        ...cargoData,
        [name]: checked
      });
    } else {
      setCargoData({
        ...cargoData,
        [name]: name === 'quantity' || name === 'length' || name === 'width' || name === 'height' || name === 'weight'
          ? parseFloat(value) || 0 
          : value
      });
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomer(customerId);
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setCargoData({
        ...cargoData,
        manufacturer: customer.name
      });
    }
  };

  const handleAddCustomer = () => {
    if (!newCustomerData.name.trim()) {
      alert('请输入客户名称');
      return;
    }

    const newCustomer: Customer = {
      id: `customer-${Date.now()}`,
      ...newCustomerData,
      createdAt: new Date().toISOString()
    };

    const updatedCustomers = [newCustomer, ...customers];
    setCustomers(updatedCustomers);
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));

    // 自动选择新添加的客户
    setSelectedCustomer(newCustomer.id);
    setCargoData({
      ...cargoData,
      manufacturer: newCustomer.name
    });

    // 重置表单
    setNewCustomerData({
      name: '',
      type: 'medium',
      contactInfo: '',
      address: '',
      notes: ''
    });
    setShowAddCustomerDialog(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dimensions
    if (cargoData.length <= 0 || cargoData.width <= 0 || cargoData.height <= 0) {
      alert('请输入有效的长度、宽度和高度');
      return;
    }

    if (cargoData.weight <= 0) {
      alert('请输入有效的重量');
      return;
    }

    // Validate time limit
    if (cargoData.hasTimeLimit && !cargoData.timeLimitDate) {
      alert('请选择时效考核截止日期');
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    
    const volume = calculateVolume(cargoData.length, cargoData.width, cargoData.height);
    const cargoType = calculateCargoType(cargoData.weight, volume);
    
    const newCargo: Cargo = {
      ...cargoData,
      id: `cargo-${Date.now()}`,
      volume,
      cargoType,
      customerId: selectedCustomer || undefined
    };
    
    try {
      await addCargo(newCargo);
      
      setSubmitSuccess(true);
      setCargoData({
        name: '',
        manufacturer: '',
        quantity: 0,
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        notes: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        urgent: false,
        hasTimeLimit: false,
        timeLimitDate: '',
        isCarryOver: false
      });
      setCalculatedCargoType('');
      setSelectedCustomer('');
      setShowConfirmDialog(false);
      
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDensityInfo = () => {
    const volume = calculateVolume(cargoData.length, cargoData.width, cargoData.height);
    if (volume === 0 || cargoData.weight === 0) return null;
    
    const density = (cargoData.weight * 1000) / volume;
    return {
      density: density.toFixed(1),
      unit: 'kg/m³'
    };
  };

  const densityInfo = getDensityInfo();
  const selectedCustomerInfo = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="p-6 max-w-3xl mx-auto slide-in">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">货物录入</h1>
        <p className="text-gray-600">请填写以下表单以添加新货物信息到仓库</p>
      </header>

      {submitSuccess && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded fade-in" role="alert">
          <p>货物信息已成功添加到仓库！</p>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="form-label">姓名</label>
              <input
                type="text"
                id="name"
                name="name"
                value={cargoData.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="manufacturer" className="form-label">厂家/客户</label>
              <div className="flex gap-2">
                <select
                  value={selectedCustomer}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="form-input flex-1"
                >
                  <option value="">选择客户或手动输入</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.type === 'large' ? '大客户' : customer.type === 'medium' ? '中客户' : '小客户'})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerDialog(true)}
                  className="btn-secondary whitespace-nowrap"
                >
                  新增客户
                </button>
              </div>
              <input
                type="text"
                name="manufacturer"
                value={cargoData.manufacturer}
                onChange={handleChange}
                className="form-input mt-2"
                placeholder="或手动输入厂家名称"
                required
              />
              {selectedCustomerInfo && (
                <p className="text-xs text-blue-600 mt-1">
                  已选择：{selectedCustomerInfo.name} ({selectedCustomerInfo.type === 'large' ? '大客户' : selectedCustomerInfo.type === 'medium' ? '中客户' : '小客户'})
                </p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="form-label">种类</label>
              <input
                type="text"
                id="category"
                name="category"
                value={cargoData.category}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="quantity" className="form-label">件数</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="0"
                step="1"
                value={cargoData.quantity}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="length" className="form-label">长度 (m)</label>
                <input
                  type="number"
                  id="length"
                  name="length"
                  min="0"
                  step="0.01"
                  value={cargoData.length}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label htmlFor="width" className="form-label">宽度 (m)</label>
                <input
                  type="number"
                  id="width"
                  name="width"
                  min="0"
                  step="0.01"
                  value={cargoData.width}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label htmlFor="height" className="form-label">高度 (m)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  min="0"
                  step="0.01"
                  value={cargoData.height}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="weight" className="form-label">吨位 (t)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                min="0"
                step="0.01"
                value={cargoData.weight}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="date" className="form-label">日期</label>
              <input
                type="date"
                id="date"
                name="date"
                value={cargoData.date}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {/* 实时显示计算结果 */}
            {calculatedCargoType && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">自动计算结果</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">体积：</span>
                    <span className="font-medium">{calculateVolume(cargoData.length, cargoData.width, cargoData.height).toFixed(3)} m³</span>
                  </div>
                  <div>
                    <span className="text-blue-700">密度：</span>
                    <span className="font-medium">{densityInfo?.density} {densityInfo?.unit}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">货型：</span>
                    <span className="font-bold text-blue-800">{calculatedCargoType}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 特殊属性设置 */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center">
                <label className="form-label flex items-center">
                  <input
                    type="checkbox"
                    name="urgent"
                    checked={cargoData.urgent}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  是否紧急
                </label>
              </div>

              <div className="flex items-center">
                <label className="form-label flex items-center">
                  <input
                    type="checkbox"
                    name="hasTimeLimit"
                    checked={cargoData.hasTimeLimit}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  是否有时效考核
                </label>
              </div>

              {cargoData.hasTimeLimit && (
                <div>
                  <label htmlFor="timeLimitDate" className="form-label">时效考核截止日期</label>
                  <input
                    type="date"
                    id="timeLimitDate"
                    name="timeLimitDate"
                    value={cargoData.timeLimitDate}
                    onChange={handleChange}
                    className="form-input"
                    required={cargoData.hasTimeLimit}
                  />
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="notes" className="form-label">备注</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={cargoData.notes}
                onChange={handleChange}
                className="form-input"
              ></textarea>
            </div>
          </div>
          
          <div className="mt-6 text-right">
            <button
              type="submit"
              className="btn-primary"
              disabled={!calculatedCargoType || isSubmitting}
            >
              提交信息
            </button>
          </div>
        </form>
      </div>

      {/* 新增客户对话框 */}
      {showAddCustomerDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">新增客户</h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">客户名称</label>
                <input
                  type="text"
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})}
                  className="form-input"
                  required
                  placeholder="输入客户名称"
                />
              </div>
              
              <div>
                <label className="form-label">客户类型</label>
                <select
                  value={newCustomerData.type}
                  onChange={(e) => setNewCustomerData({...newCustomerData, type: e.target.value as Customer['type']})}
                  className="form-input"
                >
                  <option value="large">大客户</option>
                  <option value="medium">中客户</option>
                  <option value="small">小客户</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">联系方式</label>
                <input
                  type="text"
                  value={newCustomerData.contactInfo}
                  onChange={(e) => setNewCustomerData({...newCustomerData, contactInfo: e.target.value})}
                  className="form-input"
                  placeholder="电话、邮箱等"
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowAddCustomerDialog(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleAddCustomer}
                className="btn-primary"
              >
                添加客户
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确认提交对话框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认货物信息</h3>
            
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">姓名：</span>
                  <span className="font-medium">{cargoData.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">厂家：</span>
                  <span className="font-medium">{cargoData.manufacturer}</span>
                  {selectedCustomerInfo && (
                    <span className="text-xs text-blue-600 block">
                      ({selectedCustomerInfo.type === 'large' ? '大客户' : selectedCustomerInfo.type === 'medium' ? '中客户' : '小客户'})
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-gray-600">种类：</span>
                  <span className="font-medium">{cargoData.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">件数：</span>
                  <span className="font-medium">{cargoData.quantity} 件</span>
                </div>
                <div>
                  <span className="text-gray-600">尺寸：</span>
                  <span className="font-medium">{cargoData.length} × {cargoData.width} × {cargoData.height} m</span>
                </div>
                <div>
                  <span className="text-gray-600">重量：</span>
                  <span className="font-medium">{cargoData.weight} t</span>
                </div>
                <div>
                  <span className="text-gray-600">体积：</span>
                  <span className="font-medium">{calculateVolume(cargoData.length, cargoData.width, cargoData.height).toFixed(3)} m³</span>
                </div>
                <div>
                  <span className="text-gray-600">密度：</span>
                  <span className="font-medium">{densityInfo?.density} {densityInfo?.unit}</span>
                </div>
                <div>
                  <span className="text-gray-600">日期：</span>
                  <span className="font-medium">{cargoData.date}</span>
                </div>
                <div>
                  <span className="text-gray-600">紧急程度：</span>
                  <span className={`font-medium ${cargoData.urgent ? 'text-red-600' : 'text-green-600'}`}>
                    {cargoData.urgent ? '紧急' : '普通'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">时效考核：</span>
                  <span className={`font-medium ${cargoData.hasTimeLimit ? 'text-red-600' : 'text-gray-600'}`}>
                    {cargoData.hasTimeLimit ? `是 (${cargoData.timeLimitDate})` : '否'}
                  </span>
                </div>
              </div>
              
              {/* 货型显示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 font-medium">自动计算货型：</span>
                  <span className="font-bold text-blue-800 text-lg">{calculatedCargoType}</span>
                </div>
              </div>

              {cargoData.notes && (
                <div>
                  <span className="text-gray-600">备注：</span>
                  <p className="font-medium mt-1 text-sm bg-gray-50 p-2 rounded">{cargoData.notes}</p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>货型分类标准：</strong><br/>
                • 特轻货：≤100kg/m³<br/>
                • 轻货：≤200kg/m³<br/>
                • 重泡货：≤250kg/m³<br/>
                • 重货：≤350kg/m³<br/>
                • 特重货：>350kg/m³
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                修改信息
              </button>
              <button
                onClick={confirmSubmit}
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputCargoPage;