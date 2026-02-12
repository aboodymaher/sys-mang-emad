
import React, { useState, useEffect } from 'react';
import { WarehouseStock, FabricModel, MachineWork, Customer, WarehouseLog } from './types';
import WarehousePage from './pages/Warehouse';
import ModelsPage from './pages/Models';
import MachinesPage from './pages/Machines';
import CustomersPage from './pages/Customers';
import { LayoutGrid, Package, Cpu, Users, Factory } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'warehouse' | 'models' | 'machines' | 'customers'>('warehouse');
  
  // Persistence using LocalStorage
  const [stocks, setStocks] = useState<WarehouseStock[]>(() => {
    const saved = localStorage.getItem('factory_stocks');
    return saved ? JSON.parse(saved) : [
      { type: 'عجينة', size: 18, count: 0 },
      { type: 'عجينة', size: 24, count: 0 },
      { type: 'أندي', size: 18, count: 0 },
      { type: 'أندي', size: 24, count: 0 },
    ];
  });

  const [warehouseLogs, setWarehouseLogs] = useState<WarehouseLog[]>(() => {
    const saved = localStorage.getItem('factory_warehouse_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [models, setModels] = useState<FabricModel[]>(() => {
    const saved = localStorage.getItem('factory_models');
    return saved ? JSON.parse(saved) : [];
  });

  const [machines, setMachines] = useState<MachineWork[]>(() => {
    const saved = localStorage.getItem('factory_machines');
    return saved ? JSON.parse(saved) : [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('factory_customers');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('factory_stocks', JSON.stringify(stocks));
    localStorage.setItem('factory_warehouse_logs', JSON.stringify(warehouseLogs));
    localStorage.setItem('factory_models', JSON.stringify(models));
    localStorage.setItem('factory_machines', JSON.stringify(machines));
    localStorage.setItem('factory_customers', JSON.stringify(customers));
  }, [stocks, warehouseLogs, models, machines, customers]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      {/* Sidebar for Desktop */}
      <nav className="w-full md:w-64 bg-indigo-700 text-white flex-shrink-0 shadow-xl">
        <div className="p-6 flex items-center gap-3">
          <Factory className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight">إدارة المصنع</h1>
        </div>
        <div className="mt-4 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
          {[
            { id: 'warehouse', label: 'المخزن', icon: Package },
            { id: 'models', label: 'الموديلات', icon: LayoutGrid },
            { id: 'machines', label: 'شغل المكن', icon: Cpu },
            { id: 'customers', label: 'العملاء', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 p-4 text-right transition-colors whitespace-nowrap md:whitespace-normal
                ${activeTab === tab.id ? 'bg-indigo-800 border-r-4 border-white' : 'hover:bg-indigo-600'}`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'warehouse' && (
            <WarehousePage 
              stocks={stocks} 
              setStocks={setStocks} 
              logs={warehouseLogs} 
              setLogs={setWarehouseLogs} 
            />
          )}
          {activeTab === 'models' && (
            <ModelsPage models={models} setModels={setModels} machines={machines} />
          )}
          {activeTab === 'machines' && (
            <MachinesPage 
              stocks={stocks} 
              setStocks={setStocks} 
              models={models} 
              setModels={setModels} 
              machines={machines} 
              setMachines={setMachines} 
            />
          )}
          {activeTab === 'customers' && (
            <CustomersPage 
              customers={customers} 
              setCustomers={setCustomers} 
              models={models} 
              setModels={setModels}
              machines={machines}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
