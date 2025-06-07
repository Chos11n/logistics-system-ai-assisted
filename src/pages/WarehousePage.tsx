import React, { useState, useMemo } from 'react';
import { useCargo } from '../context/CargoContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Truck as TruckType, Customer, calculateCargoPriority } from '../types/CargoTypes';
import { AlertTriangle, Truck, Clock, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const WarehousePage: React.FC = () => {
  const { warehouseItems, loadToTruck, refreshData, clearAllData } = useCargo();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchUrgent, setSearchUrgent] = useState<'all' | 'urgent' | 'normal'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showSmartLoadDialog, setShowSmartLoadDialog] = useState(false);
  const [showEmergencyPage, setShowEmergencyPage] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearingStatus, setClearingStatus] = useState<string>('');
  const [loadingPlan, setLoadingPlan] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // 加载货车和客户数据
  React.useEffect(() => {
    const storedTrucks = localStorage.getItem('trucks');
    const storedCustomers = localStorage.getItem('customers');
    
    if (storedTrucks) {
      setTrucks(JSON.parse(storedTrucks));
    }
    if (storedCustomers) {
      setCustomers(JSON.parse(storedCustomers));
    }
  }, []);

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups = warehouseItems
      .filter(cargo => 
        (cargo.name.includes(searchTerm) || 
        cargo.manufacturer.includes(searchTerm) ||
        cargo.notes.includes(searchTerm) ||
        cargo.cargoType.includes(searchTerm) ||
        cargo.category.includes(searchTerm)) &&
        (searchUrgent === 'all' || 
        (searchUrgent === 'urgent' && cargo.urgent) || 
        (searchUrgent === 'normal' && !cargo.urgent))
      )
      .reduce((acc, item) => {
        const date = item.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(item);
        return acc;
      }, {} as Record<string, typeof warehouseItems>);

    return Object.entries(groups).sort(([dateA], [dateB]) => 
      new Date(dateB).getTime() - new Date(dateA).getTime()
    );
  }, [warehouseItems, searchTerm, searchUrgent]);

  const stats = useMemo(() => {
    return warehouseItems.reduce((acc, item) => ({
      totalQuantity: acc.totalQuantity + item.quantity,
      totalVolume: acc.totalVolume + item.volume,
      totalWeight: acc.totalWeight + item.weight
    }), { totalQuantity: 0, totalVolume: 0, totalWeight: 0 });
  }, [warehouseItems]);

  const selectedStats = useMemo(() => {
    const selectedCargos = warehouseItems.filter(item => selectedItems.has(item.id));
    return selectedCargos.reduce((acc, item) => ({
      totalQuantity: acc.totalQuantity + item.quantity,
      totalVolume: acc.totalVolume + item.volume,
      totalWeight: acc.totalWeight + item.weight
    }), { totalQuantity: 0, totalVolume: 0, totalWeight: 0 });
  }, [warehouseItems, selectedItems]);

  // 智能装车算法 - 按五个优先级排序
  const smartLoadingAlgorithm = (selectedCargos: any[], availableTrucks: TruckType[]) => {
    // 按综合优先级排序货物
    const sortedCargos = [...selectedCargos].sort((a, b) => {
      const aPriority = calculateCargoPriority(a, customers);
      const bPriority = calculateCargoPriority(b, customers);
      return bPriority - aPriority; // 高优先级在前
    });

    // 按可用载重排序货车（大的优先）
    const sortedTrucks = availableTrucks
      .filter(truck => truck.status === 'available')
      .sort((a, b) => b.availableWeight - a.availableWeight);

    const loadingPlan = [];
    let remainingCargos = [...sortedCargos];

    for (const truck of sortedTrucks) {
      if (remainingCargos.length === 0) break;

      const truckCargos = [];
      let currentWeight = 0;
      let currentVolume = 0;

      // 为当前货车装载货物
      for (let i = remainingCargos.length - 1; i >= 0; i--) {
        const cargo = remainingCargos[i];
        
        if (currentWeight + cargo.weight <= truck.availableWeight &&
            currentVolume + cargo.volume <= truck.maxVolume) {
          truckCargos.push(cargo);
          currentWeight += cargo.weight;
          currentVolume += cargo.volume;
          remainingCargos.splice(i, 1);
        }
      }

      if (truckCargos.length > 0) {
        loadingPlan.push({
          truck,
          cargos: truckCargos,
          totalWeight: currentWeight,
          totalVolume: currentVolume,
          weightUtilization: (currentWeight / truck.availableWeight * 100).toFixed(1),
          volumeUtilization: (currentVolume / truck.maxVolume * 100).toFixed(1)
        });
      }
    }

    return { loadingPlan, unloadedCargos: remainingCargos };
  };

  const handleSelectAll = () => {
    if (selectedItems.size === warehouseItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(warehouseItems.map(item => item.id)));
    }
  };

  const handleSelectDate = (date: string) => {
    const dateItems = groupedItems.find(([groupDate]) => groupDate === date)?.[1] || [];
    const dateItemIds = new Set(dateItems.map(item => item.id));
    
    const allDateItemsSelected = dateItems.every(item => selectedItems.has(item.id));
    if (allDateItemsSelected) {
      const newSelected = new Set(selectedItems);
      dateItemIds.forEach(id => newSelected.delete(id));
      setSelectedItems(newSelected);
    } else {
      const newSelected = new Set(selectedItems);
      dateItemIds.forEach(id => newSelected.add(id));
      setSelectedItems(newSelected);
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSmartLoad = () => {
    if (selectedItems.size === 0) {
      alert('请先选择要装车的货物');
      return;
    }

    const selectedCargos = warehouseItems.filter(item => selectedItems.has(item.id));
    const availableTrucks = trucks.filter(truck => truck.status === 'available');
    
    if (availableTrucks.length === 0) {
      alert('没有可用的货车，请先在货车管理中添加货车并设置为可用状态');
      return;
    }

    const { loadingPlan: plan, unloadedCargos } = smartLoadingAlgorithm(selectedCargos, availableTrucks);
    
    if (plan.length === 0) {
      alert('没有合适的货车可以装载选中的货物');
      return;
    }

    setLoadingPlan(plan);
    setShowSmartLoadDialog(true);
  };

  const confirmSmartLoad = async () => {
    try {
      // 更新货车状态为装载中
      for (const plan of loadingPlan) {
        const updatedTrucks = trucks.map(truck => 
          truck.id === plan.truck.id 
            ? { ...truck, status: 'loading' as const }
            : truck
        );
        setTrucks(updatedTrucks);
        localStorage.setItem('trucks', JSON.stringify(updatedTrucks));

        // 将货物标记为已装车
        const cargoIds = plan.cargos.map((cargo: any) => cargo.id);
        await loadToTruck(cargoIds);
      }

      setSelectedItems(new Set());
      setShowSmartLoadDialog(false);
      setLoadingPlan([]);
      
      alert(`成功安排 ${loadingPlan.length} 辆货车装载货物！`);
    } catch (error) {
      console.error('智能装车失败:', error);
      alert('智能装车失败，请重试');
    }
  };

  const handleExportExcel = () => {
    const itemsToExport = warehouseItems.filter(item => selectedItems.has(item.id));
    const worksheet = XLSX.utils.json_to_sheet(itemsToExport.map(item => ({
      姓名: item.name,
      厂家: item.manufacturer,
      货型: item.cargoType,
      种类: item.category,
      紧急: item.urgent ? '是' : '否',
      件数: item.quantity,
      立方: item.volume,
      吨位: item.weight,
      备注: item.notes,
      日期: item.date
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '仓库货物');
    XLSX.writeFile(workbook, '仓库货物清单.xlsx');
  };

  const handleClearAllWarehouse = async () => {
    setIsClearing(true);
    setClearingStatus('开始清空操作...');
    
    try {
      console.log('🗑️ 开始清空仓库操作...');
      console.log('📦 当前仓库货物数量:', warehouseItems.length);
      
      setClearingStatus('正在清空服务器数据...');
      
      // 先尝试清空服务器数据库
      let serverCleared = false;
      let serverError = null;
      
      try {
        console.log('🌐 发送服务器清空请求...');
        const response = await fetch('http://localhost:3001/api/cargo/clear-warehouse', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 服务器响应状态:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ 服务器响应成功:', result);
          serverCleared = true;
          setClearingStatus('服务器数据已清空，正在清空本地数据...');
        } else {
          const errorData = await response.json();
          console.error('❌ 服务器清空失败:', errorData);
          serverError = errorData;
          setClearingStatus('服务器清空失败，继续清空本地数据...');
        }
      } catch (error) {
        console.error('❌ 服务器连接失败:', error);
        serverError = error;
        setClearingStatus('无法连接服务器，清空本地数据...');
      }
      
      // 清空本地数据
      console.log('💾 清空本地存储数据...');
      setClearingStatus('正在清空本地数据...');
      
      // 使用 context 的清空方法
      await clearAllData();
      
      // 清空当前选择状态
      setSelectedItems(new Set());
      
      // 强制刷新数据
      console.log('🔄 刷新应用数据...');
      setClearingStatus('正在刷新数据...');
      await refreshData();
      
      setClearingStatus('清空完成！');
      
      // 显示结果
      if (serverCleared) {
        alert('✅ 仓库已成功清空（包括服务器数据）');
      } else {
        const errorMsg = serverError?.details || serverError?.message || '未知错误';
        alert(`⚠️ 仓库本地数据已清空，但服务器清空失败：${errorMsg}`);
        console.error('服务器清空详细错误:', serverError);
      }
      
      console.log('✅ 仓库清空操作完成');
    } catch (error) {
      console.error('❌ 清空仓库失败:', error);
      setClearingStatus('清空失败！');
      alert(`❌ 清空失败：${error.message}`);
    } finally {
      setIsClearing(false);
      setClearingStatus('');
    }
  };

  const getCustomerInfo = (customerId?: string) => {
    if (!customerId) return null;
    return customers.find(c => c.id === customerId);
  };

  const getPriorityIndicator = (cargo: any) => {
    const indicators = [];
    
    if (cargo.urgent) {
      indicators.push(<span key="urgent" className="text-red-600 font-bold">🚨 急货</span>);
    }
    
    if (cargo.isCarryOver) {
      indicators.push(<span key="carryover" className="text-orange-600 font-bold">📦 遗留</span>);
    }
    
    if (cargo.hasTimeLimit) {
      const timeLimitDate = new Date(cargo.timeLimitDate);
      const now = new Date();
      const daysUntilDeadline = Math.ceil((timeLimitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline <= 0) {
        indicators.push(<span key="overdue" className="text-red-800 font-bold">⏰ 已过期</span>);
      } else if (daysUntilDeadline <= 1) {
        indicators.push(<span key="urgent-time" className="text-red-600 font-bold">⏰ 1天内</span>);
      } else if (daysUntilDeadline <= 3) {
        indicators.push(<span key="warning-time" className="text-orange-600 font-bold">⏰ 3天内</span>);
      } else {
        indicators.push(<span key="time-limit" className="text-blue-600">⏰ 有时效</span>);
      }
    }
    
    return indicators;
  };

  if (showEmergencyPage) {
    return (
      <EmergencyShipmentPage 
        warehouseItems={warehouseItems}
        onBack={() => setShowEmergencyPage(false)}
        customers={customers}
      />
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto slide-in">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">仓库</h1>
        <p className="text-gray-600">查看并管理当前仓库中的所有货物</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">总件数</h3>
          <p className="text-2xl font-bold text-blue-800">{stats.totalQuantity}</p>
        </div>
        <div className="card bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">总立方 (m³)</h3>
          <p className="text-2xl font-bold text-blue-800">{stats.totalVolume.toFixed(2)}</p>
        </div>
        <div className="card bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">总吨位 (t)</h3>
          <p className="text-2xl font-bold text-blue-800">{stats.totalWeight.toFixed(2)}</p>
        </div>
      </div>

      {/* 选中货物统计 */}
      {selectedItems.size > 0 && (
        <div className="card bg-green-50 border-green-200 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">已选择货物统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-green-700">选中件数</p>
              <p className="text-xl font-bold text-green-800">{selectedItems.size}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">总件数</p>
              <p className="text-xl font-bold text-green-800">{selectedStats.totalQuantity}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">总立方 (m³)</p>
              <p className="text-xl font-bold text-green-800">{selectedStats.totalVolume.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">总吨位 (t)</p>
              <p className="text-xl font-bold text-green-800">{selectedStats.totalWeight.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="搜索货物..."
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
            value={searchUrgent}
            onChange={(e) => setSearchUrgent(e.target.value as 'all' | 'urgent' | 'normal')}
            className="form-input w-32"
          >
            <option value="all">全部</option>
            <option value="urgent">紧急</option>
            <option value="normal">普通</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          {user?.role === 'admin' && warehouseItems.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn-danger flex items-center gap-2"
              disabled={isClearing}
            >
              <Trash2 size={16} />
              {isClearing ? clearingStatus || '清空中...' : '清空仓库'}
            </button>
          )}
          
          <button
            onClick={() => setShowEmergencyPage(true)}
            className="btn-warning flex items-center gap-2"
          >
            <AlertTriangle size={16} />
            紧急送出
          </button>
          
          <button
            onClick={handleSelectAll}
            className="btn-secondary"
          >
            {selectedItems.size === warehouseItems.length ? '取消全选' : '全选'}
          </button>
        </div>
      </div>

      {warehouseItems.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">仓库中暂无货物</p>
          <p className="text-sm text-gray-400 mt-2">请使用"输入货物信息"功能添加新货物</p>
        </div>
      ) : (
        <>
          {groupedItems.map(([date, items]) => (
            <div key={date} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">
                  {format(new Date(date), 'yyyy年MM月dd日', { locale: zhCN })}
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    本日期: {items.filter(item => selectedItems.has(item.id)).length} / {items.length} 已选
                  </span>
                  <button
                    onClick={() => handleSelectDate(date)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {items.every(item => selectedItems.has(item.id)) ? '取消选择本日期' : '选择本日期'}
                  </button>
                </div>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-12">选择</th>
                      <th>优先级</th>
                      <th>姓名</th>
                      <th>厂家/客户</th>
                      <th>货型</th>
                      <th>种类</th>
                      <th>件数</th>
                      <th>立方 (m³)</th>
                      <th>吨位 (t)</th>
                      <th>备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((cargo) => {
                      const customerInfo = getCustomerInfo(cargo.customerId);
                      const priorityIndicators = getPriorityIndicator(cargo);
                      
                      return (
                        <tr 
                          key={cargo.id} 
                          className={`
                            ${selectedItems.has(cargo.id) ? 'bg-blue-50 border-blue-200' : ''}
                            cursor-pointer hover:bg-gray-50
                          `}
                          onClick={() => handleSelectItem(cargo.id)}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedItems.has(cargo.id)}
                              onChange={() => handleSelectItem(cargo.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td>
                            <div className="flex flex-col gap-1 text-xs">
                              {priorityIndicators}
                            </div>
                          </td>
                          <td>{cargo.name}</td>
                          <td>
                            <div>
                              <span>{cargo.manufacturer}</span>
                              {customerInfo && (
                                <div className="text-xs text-gray-500">
                                  {customerInfo.type === 'large' ? '🔴 大客户' : 
                                   customerInfo.type === 'medium' ? '🟡 中客户' : '🟢 小客户'}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>{cargo.cargoType}</td>
                          <td>{cargo.category}</td>
                          <td>{cargo.quantity}</td>
                          <td 
                            className="relative cursor-help"
                            onMouseEnter={() => setHoveredItem(cargo.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            {cargo.volume.toFixed(2)}
                            {hoveredItem === cargo.id && (
                              <div className="fixed z-50 bg-white p-3 rounded-lg shadow-lg border border-gray-200 mt-1">
                                <p className="text-sm text-gray-600">尺寸详情：</p>
                                <p className="text-sm">长：{cargo.length.toFixed(2)} m</p>
                                <p className="text-sm">宽：{cargo.width.toFixed(2)} m</p>
                                <p className="text-sm">高：{cargo.height.toFixed(2)} m</p>
                              </div>
                            )}
                          </td>
                          <td>{cargo.weight}</td>
                          <td>{cargo.notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* 智能装车按钮 */}
          {selectedItems.size > 0 && (
            <div className="fixed bottom-6 right-6 flex gap-2 z-10">
              <button
                onClick={handleSmartLoad}
                className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg"
              >
                <Truck size={20} />
                智能装车 ({selectedItems.size})
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                导出Excel
              </button>
            </div>
          )}

          {/* 智能装车计划对话框 */}
          {showSmartLoadDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">智能装车方案</h3>
                
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-900 mb-2">装车优先级说明：</h4>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. 急货优先 - 标记为紧急的货物</li>
                      <li>2. 上次遗留优先 - 上次未能装车的货物</li>
                      <li>3. 有时效考核优先 - 有截止日期要求的货物</li>
                      <li>4. 大客户优先 - 大客户的货物优先装车</li>
                      <li>5. 先到优先 - 按到达仓库的时间排序</li>
                    </ol>
                  </div>
                  
                  {loadingPlan.map((plan, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-blue-900">
                          {plan.truck.name}
                        </h4>
                        <div className="text-sm text-gray-600">
                          载重利用率: {plan.weightUtilization}% | 
                          容积利用率: {plan.volumeUtilization}%
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-600">装载重量：</span>
                          <span className="font-medium">{plan.totalWeight.toFixed(2)} / {plan.truck.availableWeight} t</span>
                        </div>
                        <div>
                          <span className="text-gray-600">装载体积：</span>
                          <span className="font-medium">{plan.totalVolume.toFixed(2)} / {plan.truck.maxVolume} m³</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          装载货物 ({plan.cargos.length} 件)：
                        </p>
                        <div className="space-y-2 text-xs">
                          {plan.cargos.map((cargo: any) => {
                            const customerInfo = getCustomerInfo(cargo.customerId);
                            const priorityIndicators = getPriorityIndicator(cargo);
                            
                            return (
                              <div key={cargo.id} className="flex justify-between items-center p-2 bg-white rounded">
                                <div>
                                  <span className="font-medium">{cargo.name} - {cargo.manufacturer}</span>
                                  {customerInfo && (
                                    <span className="ml-2 text-gray-600">
                                      ({customerInfo.type === 'large' ? '大客户' : 
                                        customerInfo.type === 'medium' ? '中客户' : '小客户'})
                                    </span>
                                  )}
                                  <div className="flex gap-2 mt-1">
                                    {priorityIndicators}
                                  </div>
                                </div>
                                <span className="text-gray-600">{cargo.weight}t / {cargo.volume.toFixed(2)}m³</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowSmartLoadDialog(false)}
                    className="btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmSmartLoad}
                    className="btn-success"
                  >
                    确认执行装车方案
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 清空确认对话框 */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
              <Trash2 size={20} />
              确认清空仓库
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                此操作将永久删除仓库中的所有货物，包括：
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• 共 {warehouseItems.length} 件货物</li>
                <li>• 所有待装车的货物信息</li>
                <li>• 相关的客户关联信息</li>
                <li>• 服务器数据库中的对应数据</li>
              </ul>
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 text-sm font-medium">
                  ⚠️ 此操作不可撤销，请谨慎操作！
                </p>
              </div>
              
              {/* 显示清空状态 */}
              {clearingStatus && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 text-sm">
                    🔄 {clearingStatus}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn-secondary"
                disabled={isClearing}
              >
                取消
              </button>
              <button
                onClick={() => {
                  handleClearAllWarehouse();
                  setShowClearConfirm(false);
                }}
                className="btn-danger"
                disabled={isClearing}
              >
                {isClearing ? clearingStatus || '清空中...' : '确认清空'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 紧急送出页面组件
const EmergencyShipmentPage: React.FC<{
  warehouseItems: any[];
  onBack: () => void;
  customers: any[];
}> = ({ warehouseItems, onBack, customers }) => {
  const { shipCargo } = useCargo();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = warehouseItems.filter(item =>
    item.name.includes(searchTerm) ||
    item.manufacturer.includes(searchTerm) ||
    item.category.includes(searchTerm)
  );

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleEmergencyShip = async () => {
    if (selectedItems.size === 0) {
      alert('请选择要送出的货物');
      return;
    }

    if (confirm(`确定要紧急送出 ${selectedItems.size} 件货物吗？`)) {
      try {
        for (const id of selectedItems) {
          await shipCargo(id);
        }
        alert('货物已成功送出！');
        onBack();
      } catch (error) {
        alert('送出失败，请重试');
      }
    }
  };

  const getCustomerInfo = (customerId?: string) => {
    if (!customerId) return null;
    return customers.find(c => c.id === customerId);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto slide-in">
      <header className="mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-secondary">
            ← 返回仓库
          </button>
          <div>
            <h1 className="text-2xl font-bold text-red-900 flex items-center gap-2">
              <AlertTriangle size={28} />
              紧急送出
            </h1>
            <p className="text-gray-600">人工选择货物进行紧急送出</p>
          </div>
        </div>
      </header>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="搜索货物..."
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

        {selectedItems.size > 0 && (
          <button
            onClick={handleEmergencyShip}
            className="btn-danger flex items-center gap-2"
          >
            <AlertTriangle size={16} />
            紧急送出 ({selectedItems.size})
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-12">选择</th>
              <th>姓名</th>
              <th>厂家/客户</th>
              <th>货型</th>
              <th>种类</th>
              <th>紧急</th>
              <th>件数</th>
              <th>立方 (m³)</th>
              <th>吨位 (t)</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((cargo) => {
              const customerInfo = getCustomerInfo(cargo.customerId);
              
              return (
                <tr 
                  key={cargo.id} 
                  className={`
                    ${selectedItems.has(cargo.id) ? 'bg-red-50 border-red-200' : ''}
                    cursor-pointer hover:bg-gray-50
                  `}
                  onClick={() => handleSelectItem(cargo.id)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(cargo.id)}
                      onChange={() => handleSelectItem(cargo.id)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                  </td>
                  <td>{cargo.name}</td>
                  <td>
                    <div>
                      <span>{cargo.manufacturer}</span>
                      {customerInfo && (
                        <div className="text-xs text-gray-500">
                          {customerInfo.type === 'large' ? '🔴 大客户' : 
                           customerInfo.type === 'medium' ? '🟡 中客户' : '🟢 小客户'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{cargo.cargoType}</td>
                  <td>{cargo.category}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cargo.urgent 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {cargo.urgent ? '紧急' : '普通'}
                    </span>
                  </td>
                  <td>{cargo.quantity}</td>
                  <td>{cargo.volume.toFixed(2)}</td>
                  <td>{cargo.weight}</td>
                  <td>{cargo.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WarehousePage;