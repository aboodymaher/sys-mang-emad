
import React, { useState, useEffect } from 'react';
import { WarehouseStock, FabricModel, MachineWork, Customer, WarehouseLog, ProcessingWork } from './types';
import WarehousePage from './pages/Warehouse';
import ModelsPage from './pages/Models';
import MachinesPage from './pages/Machines';
import ProcessingPage from './pages/Processing';
import CustomersPage from './pages/Customers';
import { LayoutGrid, Package, Cpu, Users, Factory, Scissors } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'warehouse' | 'models' | 'machines' | 'processing' | 'customers'>('warehouse');
  
  const [stocks, setStocks] = useState<WarehouseStock[]>(() => {
    const saved = localStorage.getItem('factory_stocks');
    return saved ? JSON.parse(saved) : [];
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

  const [processing, setProcessing] = useState<ProcessingWork[]>(() => {
    const saved = localStorage.getItem('factory_processing');
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
    localStorage.setItem('factory_processing', JSON.stringify(processing));
    localStorage.setItem('factory_customers', JSON.stringify(customers));
  }, [stocks, warehouseLogs, models, machines, processing, customers]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-indigo-700 text-white flex-shrink-0 shadow-xl z-10">
        <div className="p-6 flex items-center gap-3">
          <Factory className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight">إدارة المصنع</h1>
        </div>
        <div className="mt-4 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible custom-scrollbar">
          {[
            { id: 'warehouse', label: 'المخزن', icon: Package },
            { id: 'models', label: 'الموديلات', icon: LayoutGrid },
            { id: 'machines', label: 'شغل المكن', icon: Cpu },
            { id: 'processing', label: 'تجهيز', icon: Scissors },
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
          {activeTab === 'processing' && (
            <ProcessingPage
              processing={processing}
              setProcessing={setProcessing}
              models={models}
              setModels={setModels}
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
