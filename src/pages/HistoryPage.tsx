import React, { useState, useMemo } from 'react';
import { useCargo } from '../context/CargoContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const HistoryPage: React.FC = () => {
  const { historyItems, undoShipment, refreshData } = useCargo();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchUrgent, setSearchUrgent] = useState<'all' | 'urgent' | 'normal'>('all');
  const [confirmUndoId, setConfirmUndoId] = useState<string | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups = historyItems
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
      }, {} as Record<string, typeof historyItems>);

    return Object.entries(groups).sort(([dateA], [dateB]) => 
      new Date(dateB).getTime() - new Date(dateA).getTime()
    );
  }, [historyItems, searchTerm, searchUrgent]);

  const handleSelectAll = () => {
    if (selectedItems.size === historyItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(historyItems.map(item => item.id)));
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

  const handleBatchUndo = () => {
    selectedItems.forEach(id => {
      undoShipment(id);
    });
    setSelectedItems(new Set());
    setIsBatchMode(false);
  };

  const handleExportExcel = () => {
    const itemsToExport = historyItems.filter(item => selectedItems.has(item.id));
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
    XLSX.utils.book_append_sheet(workbook, worksheet, '历史货物');
    XLSX.writeFile(workbook, '历史货物清单.xlsx');
  };

  const handleClearAllHistory = async () => {
    setIsClearing(true);
    try {
      // 清空localStorage
      localStorage.removeItem('historyItems');
      
      // 尝试清空服务器数据库中的已发货货物
      try {
        const response = await fetch('http://localhost:3001/api/cargo/clear-shipped', {
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
      
      alert('历史记录已清空');
    } catch (error) {
      console.error('清空历史记录失败:', error);
      alert('清空失败，请重试');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto slide-in">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">历史货物</h1>
        <p className="text-gray-600">查看已送出的历史货物记录</p>
      </header>

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
          {user?.role === 'admin' && historyItems.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn-danger flex items-center gap-2"
              disabled={isClearing}
            >
              <Trash2 size={16} />
              {isClearing ? '清空中...' : '清空所有历史记录'}
            </button>
          )}
          
          <button
            onClick={() => {
              setIsBatchMode(!isBatchMode);
              setSelectedItems(new Set());
            }}
            className={`btn-secondary ${isBatchMode ? 'bg-blue-100' : ''}`}
          >
            批量操作
          </button>
          
          {isBatchMode && (
            <button
              onClick={handleSelectAll}
              className="btn-secondary"
            >
              全选
            </button>
          )}
        </div>
      </div>

      {historyItems.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">暂无历史货物记录</p>
          <p className="text-sm text-gray-400 mt-2">当货物被送出时，记录将显示在此处</p>
        </div>
      ) : (
        <>
          {groupedItems.map(([date, items]) => (
            <div key={date} className="mb-8">
              <div className="flex items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-900">
                  {format(new Date(date), 'yyyy年MM月dd日', { locale: zhCN })}
                </h3>
                {isBatchMode && (
                  <button
                    onClick={() => handleSelectDate(date)}
                    className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {items.every(item => selectedItems.has(item.id)) ? '取消选择' : '选择本日期'}
                  </button>
                )}
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {isBatchMode && <th className="w-12"></th>}
                      <th>操作</th>
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
                    {items.map((cargo) => (
                      <tr key={cargo.id} className={confirmUndoId === cargo.id ? 'bg-green-50' : selectedItems.has(cargo.id) ? 'bg-blue-50' : ''}>
                        {isBatchMode && (
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedItems.has(cargo.id)}
                              onChange={() => handleSelectItem(cargo.id)}
                              className="w-4 h-4 text-blue-600"
                            />
                          </td>
                        )}
                        <td>
                          {!isBatchMode && (
                            confirmUndoId === cargo.id ? (
                              <div className="confirm-actions">
                                <button
                                  onClick={() => {
                                    undoShipment(cargo.id);
                                    setConfirmUndoId(null);
                                  }}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  确认
                                </button>
                                <button
                                  onClick={() => setConfirmUndoId(null)}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmUndoId(cargo.id)}
                                className="table-action-btn bg-amber-500 hover:bg-amber-600 text-white"
                              >
                                撤销送出
                              </button>
                            )
                          )}
                        </td>
                        <td>{cargo.name}</td>
                        <td>{cargo.manufacturer}</td>
                        <td>{cargo.cargoType}</td>
                        <td>{cargo.category}</td>
                        <td>{cargo.urgent ? '是' : '否'}</td>
                        <td>{cargo.quantity}</td>
                        <td>{cargo.volume}</td>
                        <td>{cargo.weight}</td>
                        <td>{cargo.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {isBatchMode && selectedItems.size > 0 && (
            <div className="batch-actions">
              <button
                onClick={handleBatchUndo}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                批量撤销 ({selectedItems.size})
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                导出Excel
              </button>
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
              确认清空所有历史记录
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                此操作将永久删除所有历史货物记录，包括：
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• 共 {historyItems.length} 条历史记录</li>
                <li>• 所有已送出的货物信息</li>
                <li>• 相关的装车记录</li>
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
                  handleClearAllHistory();
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

export default HistoryPage;