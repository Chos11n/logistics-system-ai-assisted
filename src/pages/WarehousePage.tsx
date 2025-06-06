import React, { useState, useMemo } from 'react';
import { useCargo } from '../context/CargoContext';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const WarehousePage: React.FC = () => {
  const { warehouseItems, shipCargo, loadToTruck } = useCargo();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchUrgent, setSearchUrgent] = useState<'all' | 'urgent' | 'normal'>('all');
  const [confirmShipId, setConfirmShipId] = useState<string | null>(null);
  const [confirmLoadId, setConfirmLoadId] = useState<string | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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

  const handleBatchShip = () => {
    selectedItems.forEach(id => {
      shipCargo(id);
    });
    setSelectedItems(new Set());
    setIsBatchMode(false);
  };

  const handleBatchLoad = () => {
    loadToTruck(Array.from(selectedItems));
    setSelectedItems(new Set());
    setIsBatchMode(false);
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

      {warehouseItems.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">仓库中暂无货物</p>
          <p className="text-sm text-gray-400 mt-2">请使用"输入货物信息"功能添加新货物</p>
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
                      <tr 
                        key={cargo.id} 
                        className={confirmShipId === cargo.id || confirmLoadId === cargo.id ? 'bg-red-50' : selectedItems.has(cargo.id) ? 'bg-blue-50' : ''}
                      >
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
                            confirmShipId === cargo.id ? (
                              <div className="confirm-actions">
                                <button
                                  onClick={() => {
                                    shipCargo(cargo.id);
                                    setConfirmShipId(null);
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                  确认
                                </button>
                                <button
                                  onClick={() => setConfirmShipId(null)}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                                >
                                  取消
                                </button>
                              </div>
                            ) : confirmLoadId === cargo.id ? (
                              <div className="confirm-actions">
                                <button
                                  onClick={() => {
                                    loadToTruck([cargo.id]);
                                    setConfirmLoadId(null);
                                  }}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  确认
                                </button>
                                <button
                                  onClick={() => setConfirmLoadId(null)}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setConfirmShipId(cargo.id)}
                                  className="table-action-btn bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                  货物送出
                                </button>
                                <button
                                  onClick={() => setConfirmLoadId(cargo.id)}
                                  className="table-action-btn bg-green-500 hover:bg-green-600 text-white"
                                >
                                  装车并出库
                                </button>
                              </div>
                            )
                          )}
                        </td>
                        <td>{cargo.name}</td>
                        <td>{cargo.manufacturer}</td>
                        <td>{cargo.cargoType}</td>
                        <td>{cargo.category}</td>
                        <td>{cargo.urgent ? '是' : '否'}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {isBatchMode && selectedItems.size > 0 && (
            <div className="batch-actions">
              <button
                onClick={handleBatchShip}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                批量送出 ({selectedItems.size})
              </button>
              <button
                onClick={handleBatchLoad}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                批量装车 ({selectedItems.size})
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                导出Excel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WarehousePage;