import React, { useState } from 'react';
import { useCargo } from '../context/CargoContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';

const TrucksPage: React.FC = () => {
  const { truckItems, refreshData } = useCargo();
  const { user } = useAuth();
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllTrucks = async () => {
    setIsClearing(true);
    try {
      // 清空localStorage
      localStorage.removeItem('truckItems');
      
      // 尝试清空服务器数据库中的装车记录
      try {
        const response = await fetch('http://localhost:3001/api/trucks/clear-all', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.warn('服务器清空失败，但本地数据已清空');
        }
      } catch (error) {
        console.warn('无法连接到服务器，仅清空本地数据');
      }
      
      // 刷新数据
      await refreshData();
      
      alert('装车记录已清空');
    } catch (error) {
      console.error('清空装车记录失败:', error);
      alert('清空失败，请重试');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto slide-in">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">装车详情</h1>
          <p className="text-gray-600">查看所有货车的装载情况</p>
        </div>
        
        {user?.role === 'admin' && truckItems.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="btn-danger flex items-center gap-2"
            disabled={isClearing}
          >
            <Trash2 size={16} />
            {isClearing ? '清空中...' : '清空所有装车记录'}
          </button>
        )}
      </header>

      {truckItems.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">暂无装车记录</p>
          <p className="text-sm text-gray-400 mt-2">当货物被装车时，记录将显示在此处</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {truckItems.map((truck) => (
              <div
                key={truck.truckId}
                className={`card cursor-pointer transition-all duration-200 ${
                  selectedTruck === truck.truckId ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
                }`}
                onClick={() => setSelectedTruck(truck.truckId === selectedTruck ? null : truck.truckId)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      货车 {truck.truckId.split('-')[1]}
                    </h3>
                    <p className="text-sm text-gray-600">{truck.truckType.name}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(new Date(truck.loadingDate), 'yyyy年MM月dd日', { locale: zhCN })}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>装载货物：{truck.cargos.length} 件</p>
                  <p>
                    总重量：{truck.cargos.reduce((sum, cargo) => sum + cargo.weight, 0).toFixed(2)} / {truck.truckType.maxWeight} 吨
                  </p>
                  <p>
                    总体积：{truck.cargos.reduce((sum, cargo) => sum + cargo.volume, 0).toFixed(2)} / {Math.floor(truck.truckType.maxVolume)} m³
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedTruck && (
            <div className="card">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                货车 {selectedTruck.split('-')[1]} 装载明细
              </h2>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>厂家</th>
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
                    {truckItems
                      .find(truck => truck.truckId === selectedTruck)
                      ?.cargos.map((cargo) => (
                        <tr key={cargo.id}>
                          <td>{cargo.name}</td>
                          <td>{cargo.manufacturer}</td>
                          <td>{cargo.cargoType}</td>
                          <td>{cargo.category}</td>
                          <td>{cargo.urgent ? '是' : '否'}</td>
                          <td>{cargo.quantity}</td>
                          <td>{cargo.volume.toFixed(2)}</td>
                          <td>{cargo.weight}</td>
                          <td>{cargo.notes}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
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
              确认清空所有装车记录
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                此操作将永久删除所有装车记录，包括：
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• 共 {truckItems.length} 条装车记录</li>
                <li>• 所有货车的装载信息</li>
                <li>• 相关的货物装载历史</li>
                <li>• 服务器数据库中的对应数据</li>
              </ul>
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 text-sm font-medium">
                  ⚠️ 此操作不可撤销，请谨慎操作！
                </p>
              </div>
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
                  handleClearAllTrucks();
                  setShowClearConfirm(false);
                }}
                className="btn-danger"
                disabled={isClearing}
              >
                {isClearing ? '清空中...' : '确认清空'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrucksPage;