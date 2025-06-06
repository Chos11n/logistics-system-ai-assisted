import React, { useState } from 'react';
import { useCargo } from '../context/CargoContext';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const TrucksPage: React.FC = () => {
  const { truckItems } = useCargo();
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-6xl mx-auto slide-in">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">装车详情</h1>
        <p className="text-gray-600">查看所有货车的装载情况</p>
      </header>

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
    </div>
  );
};

export default TrucksPage;