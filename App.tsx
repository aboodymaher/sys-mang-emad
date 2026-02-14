
import React, { useState, useEffect } from 'react';
import { WarehouseStock, FabricModel, MachineWork, Customer, WarehouseLog, ProcessingWork, Expense } from './types';
import WarehousePage from './pages/Warehouse';
import ModelsPage from './pages/Models';
import MachinesPage from './pages/Machines';
import ProcessingPage from './pages/Processing';
import CustomersPage from './pages/Customers';
import ExpensesPage from './pages/Expenses';
import { LayoutGrid, Package, Cpu, Users, Factory, Scissors, Menu, X, Wallet } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'warehouse' | 'models' | 'machines' | 'processing' | 'customers' | 'expenses'>('warehouse');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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

  const [machineCustomers, setMachineCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('factory_machine_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [processingCustomers, setProcessingCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('factory_processing_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [salesCustomers, setSalesCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('factory_sales_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('factory_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('factory_stocks', JSON.stringify(stocks));
    localStorage.setItem('factory_warehouse_logs', JSON.stringify(warehouseLogs));
    localStorage.setItem('factory_models', JSON.stringify(models));
    localStorage.setItem('factory_machines', JSON.stringify(machines));
    localStorage.setItem('factory_processing', JSON.stringify(processing));
    localStorage.setItem('factory_machine_customers', JSON.stringify(machineCustomers));
    localStorage.setItem('factory_processing_customers', JSON.stringify(processingCustomers));
    localStorage.setItem('factory_sales_customers', JSON.stringify(salesCustomers));
    localStorage.setItem('factory_expenses', JSON.stringify(expenses));
  }, [stocks, warehouseLogs, models, machines, processing, machineCustomers, processingCustomers, salesCustomers, expenses]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const menuItems = [
    { id: 'warehouse', label: 'المخزن', icon: Package },
    { id: 'models', label: 'الموديلات', icon: LayoutGrid },
    { id: 'machines', label: 'شغل المكن', icon: Cpu },
    { id: 'processing', label: 'تجهيز', icon: Scissors },
    { id: 'customers', label: 'العملاء (مبيعات)', icon: Users },
    { id: 'expenses', label: 'المصروفات', icon: Wallet },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-hidden font-['Cairo']">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Vertical Sidebar */}
      <nav className={`
        fixed inset-y-0 right-0 z-50 w-72 bg-indigo-700 text-white transform transition-transform duration-300 ease-in-out shadow-2xl
        md:relative md:translate-x-0 md:flex md:flex-col
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Factory className="w-10 h-10 text-indigo-100" />
            <h1 className="text-2xl font-black tracking-tight leading-none">إدارة<br/><span className="text-indigo-200">المصنع</span></h1>
          </div>
          <button onClick={closeSidebar} className="md:hidden p-2 hover:bg-indigo-600 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-6 flex-1 px-4 space-y-2">
          {menuItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                closeSidebar();
              }}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl text-right transition-all duration-200 group
                ${activeTab === tab.id 
                  ? 'bg-white text-indigo-700 shadow-xl shadow-indigo-900/20 translate-x-[-8px]' 
                  : 'hover:bg-indigo-600/50 text-indigo-100'}`}
            >
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'text-indigo-700' : 'text-indigo-300 group-hover:text-white'}`} />
              <span className="font-black text-lg">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-indigo-600/50">
          <div className="bg-indigo-800/50 p-4 rounded-2xl text-center">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">حالة النظام</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-indigo-100">متصل وجاهز</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Mobile Header */}
        <header className="md:hidden bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Factory className="w-6 h-6 text-indigo-600" />
            <span className="font-black text-lg text-gray-800">إدارة المصنع</span>
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <Menu className="w-7 h-7" />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'warehouse' && (
              <WarehousePage 
                stocks={stocks} 
                setStocks={setStocks} 
                logs={warehouseLogs} 
                setLogs={setWarehouseLogs} 
              />
            )}
            {activeTab === 'models' && (
              <ModelsPage models={models} setModels={setModels} machines={machines} processing={processing} />
            )}
            {activeTab === 'machines' && (
              <MachinesPage 
                stocks={stocks} 
                setStocks={setStocks} 
                models={models} 
                setModels={setModels} 
                machines={machines} 
                setMachines={setMachines}
                customers={machineCustomers}
                setCustomers={setMachineCustomers}
              />
            )}
            {activeTab === 'processing' && (
              <ProcessingPage
                processing={processing}
                setProcessing={setProcessing}
                models={models}
                setModels={setModels}
                customers={processingCustomers}
                setCustomers={setProcessingCustomers}
              />
            )}
            {activeTab === 'customers' && (
              <CustomersPage 
                customers={salesCustomers} 
                setCustomers={setSalesCustomers} 
                models={models} 
                setModels={setModels}
                machines={machines}
              />
            )}
            {activeTab === 'expenses' && (
              <ExpensesPage
                expenses={expenses}
                setExpenses={setExpenses}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
