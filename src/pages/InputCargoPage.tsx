import React, { useState, useEffect } from 'react';
import { useCargo } from '../context/CargoContext';
import { Cargo, CargoType } from '../types/CargoTypes';

const InputCargoPage: React.FC = () => {
  const { addCargo } = useCargo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [otherCargoType, setOtherCargoType] = useState('');
  
  const [cargoData, setCargoData] = useState<Omit<Cargo, 'id' | 'volume'>>({
    name: '',
    manufacturer: '',
    quantity: 0,
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    notes: '',
    date: new Date().toISOString().split('T')[0],
    cargoType: '',
    category: '',
    urgent: false
  });

  const cargoTypes: CargoType[] = ['轻货', '重货', '轻泡货', '重泡货', '其它'];

  const calculateVolume = (length: number, width: number, height: number): number => {
    return length * width * height; // Already in cubic meters since input is in meters
  };

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

  const handleCargoTypeChange = (type: CargoType) => {
    setCargoData({
      ...cargoData,
      cargoType: type === '其它' ? otherCargoType : type
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dimensions
    if (cargoData.length <= 0 || cargoData.width <= 0 || cargoData.height <= 0) {
      alert('请输入有效的长度、宽度和高度');
      return;
    }
    
    setIsSubmitting(true);
    
    const volume = calculateVolume(cargoData.length, cargoData.width, cargoData.height);
    const newCargo: Cargo = {
      ...cargoData,
      id: `cargo-${Date.now()}`,
      volume
    };
    
    addCargo(newCargo);
    
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
      cargoType: '',
      category: '',
      urgent: false
    });
    setOtherCargoType('');
    
    setIsSubmitting(false);
    
    setTimeout(() => {
      setSubmitSuccess(false);
    }, 3000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto slide-in">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">输入货物信息</h1>
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
              <label htmlFor="manufacturer" className="form-label">厂家</label>
              <input
                type="text"
                id="manufacturer"
                name="manufacturer"
                value={cargoData.manufacturer}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">货型</label>
              <div className="space-y-2">
                {cargoTypes.map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      type="radio"
                      id={type}
                      name="cargoType"
                      checked={cargoData.cargoType === (type === '其它' ? otherCargoType : type)}
                      onChange={() => handleCargoTypeChange(type)}
                      className="mr-2"
                    />
                    <label htmlFor={type} className="text-sm text-gray-700">
                      {type}
                    </label>
                    {type === '其它' && (
                      <input
                        type="text"
                        value={otherCargoType}
                        onChange={(e) => {
                          setOtherCargoType(e.target.value);
                          if (cargoData.cargoType !== '') {
                            handleCargoTypeChange('其它');
                          }
                        }}
                        className="form-input ml-2 w-32"
                        placeholder="请输入"
                      />
                    )}
                  </div>
                ))}
              </div>
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

            <div className="flex items-center mt-4">
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
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '提交信息'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputCargoPage;