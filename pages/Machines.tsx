
import React, { useState, useMemo } from 'react';
import { MachineWork, WarehouseStock, FabricModel, MaterialType, MaterialSize, ProductionEntry, Customer, Payment } from '../types';
import Modal from '../components/Modal';
import { 
  PlusCircle, 
  AlertTriangle, 
  Trash2, 
  Edit, 
  Plus, 
  Search, 
  ArrowLeft, 
  Cpu, 
  History, 
  Palette, 
  UserPlus, 
  Users,
  ChevronDown,
  ChevronUp,
  Box,
  TrendingUp,
  Hammer,
  Smartphone,
  CheckCircle2,
  Wallet,
  Coins,
  Receipt,
  X,
  Package
} from 'lucide-react';

interface Props {
  stocks: WarehouseStock[];
  setStocks: React.Dispatch<React.SetStateAction<WarehouseStock[]>>;
  models: FabricModel[];
  setModels: React.Dispatch<React.SetStateAction<FabricModel[]>>;
  machines: MachineWork[];
  setMachines: React.Dispatch<React.SetStateAction<MachineWork[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const colorPalette = [
  { name: 'أبيض', value: '#FFFFFF', border: true },
  { name: 'سمني', value: '#F5F5DC' },
  { name: 'أسود 1', value: '#1A1A1A' },
  { name: 'أسود 2', value: '#000000' },
  { name: 'بيج فاتح', value: '#E8D5B7' },
  { name: 'بيج غامق', value: '#966F33' },
  { name: 'كافيه فاتح', value: '#C19A6B' },
  { name: 'كافيه غامق', value: '#4B3621' },
  { name: 'أصفر فاتح', value: '#FFFACD' },
  { name: 'أصفر غامق', value: '#FFD700' },
  { name: 'لبني فاتح', value: '#ADD8E6' },
  { name: 'لبني غامق', value: '#00008B' },
  { name: 'روز فاتح', value: '#FFB6C1' },
  { name: 'روز غامق', value: '#E75480' },
  { name: 'كشمير', value: '#D1B399' },
  { name: 'جينز', value: '#5D77A3' },
  { name: 'تفاحي', value: '#8DB600' },
  { name: 'زيتي', value: '#4B5320' },
  { name: 'كاكي', value: '#C3B091' },
];

const MachinesPage: React.FC<Props> = ({ stocks, setStocks, models, setModels, machines, setMachines, customers, setCustomers }) => {
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  // Forms
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' });
  const [paymentForm, setPaymentForm] = useState({ customerId: '', amount: 0, date: new Date().toLocaleDateString('ar-EG') });
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);
  
  const [machineMainInfo, setMachineMainInfo] = useState({
    customerId: '',
    machineName: '',
    date: new Date().toLocaleDateString('ar-EG')
  });
  
  const [entries, setEntries] = useState<ProductionEntry[]>([
    {
      raw: { type: 'عجينة', size: 24, color: '', quantity: 1 },
      produced: { modelId: '', quantity: 0, price: 0 }
    }
  ]);

  const toggleCustomer = (id: string) => {
    const next = new Set(expandedCustomers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCustomers(next);
  };

  const handleOpenAddCustomer = () => {
    setCustomerForm({ name: '', phone: '' });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = () => {
    if (!customerForm.name) return;
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: customerForm.name,
      phone: customerForm.phone,
      invoices: [],
      payments: []
    };
    setCustomers([...customers, newCustomer]);
    setIsCustomerModalOpen(false);
  };

  const handleOpenPayment = (customer: Customer) => {
    setPaymentForm({
      customerId: customer.id,
      amount: 0,
      date: new Date().toLocaleDateString('ar-EG')
    });
    setIsPaymentModalOpen(true);
  };

  const handleOpenHistory = (customer: Customer) => {
    setViewingCustomerId(customer.id);
    setIsHistoryModalOpen(true);
  };

  const handleSavePayment = () => {
    if (paymentForm.amount <= 0) return;
    const newPayment: Payment = {
      id: Date.now().toString(),
      date: paymentForm.date,
      amount: paymentForm.amount
    };
    setCustomers(prev => prev.map(c => 
      c.id === paymentForm.customerId 
        ? { ...c, payments: [...c.payments, newPayment] } 
        : c
    ));
    setIsPaymentModalOpen(false);
  };

  const handleDeletePayment = (customerId: string, paymentId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الدفعة من السجل؟')) {
      setCustomers(prev => prev.map(c => 
        c.id === customerId 
          ? { ...c, payments: c.payments.filter(p => p.id !== paymentId) } 
          : c
      ));
    }
  };

  const handleOpenAddMachine = (customerId: string) => {
    setEditingId(null);
    setMachineMainInfo({
      customerId,
      machineName: '',
      date: new Date().toLocaleDateString('ar-EG')
    });
    setEntries([{
      raw: { type: 'عجينة', size: 24, color: '', quantity: 1 },
      produced: { modelId: '', quantity: 0, price: 0 }
    }]);
    setIsMachineModalOpen(true);
    setError(null);
  };

  const handleOpenEditMachine = (work: MachineWork) => {
    setEditingId(work.id);
    setMachineMainInfo({
      customerId: work.customerId,
      machineName: work.machineName,
      date: work.date
    });
    setEntries(JSON.parse(JSON.stringify(work.entries)));
    setIsMachineModalOpen(true);
    setError(null);
  };

  const addEntry = () => setEntries([...entries, {
    raw: { type: 'عجينة', size: 24, color: '', quantity: 1 },
    produced: { modelId: '', quantity: 0, price: 0 }
  }]);

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntryRaw = (index: number, field: keyof ProductionEntry['raw'], value: any) => {
    setEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, raw: { ...entry.raw, [field]: value } } : entry
    ));
  };

  const updateEntryProduced = (index: number, field: keyof ProductionEntry['produced'], value: any) => {
    setEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, produced: { ...entry.produced, [field]: value } } : entry
    ));
  };

  const handleSaveMachineWork = () => {
    if (!machineMainInfo.machineName || entries.some(e => !e.produced.modelId || !e.raw.color)) {
      setError('يرجى التأكد من ملء رقم المكنة واختيار الموديلات والألوان المتاحة في المخزن لكل سطر');
      return;
    }

    const requiredRaw: Record<string, number> = {};
    entries.forEach(e => {
      const key = `${e.raw.type}-${e.raw.size}-${e.raw.color}`;
      requiredRaw[key] = (requiredRaw[key] || 0) + Number(e.raw.quantity);
    });

    const oldWork = editingId ? machines.find(m => m.id === editingId) : null;
    
    // Check stock
    for (const [key, qty] of Object.entries(requiredRaw)) {
      const [type, size, color] = key.split('-');
      const targetStock = stocks.find(s => s.type === type && s.size === parseInt(size) && s.color === color);
      let availableCount = targetStock?.count || 0;
      if (oldWork) {
        const oldQty = oldWork.entries
          .filter(e => e.raw.type === type && e.raw.size === parseInt(size) && e.raw.color === color)
          .reduce((sum, e) => sum + e.raw.quantity, 0);
        availableCount += oldQty;
      }
      if (availableCount < qty) {
        setError(`الرصيد غير كافٍ للنوع ${type} مقاس ${size} لون ${color}. المتاح: ${availableCount}`);
        return;
      }
    }

    // Revert old values if editing
    if (oldWork) {
      setStocks(prev => prev.map(s => {
        const oldQty = oldWork.entries
          .filter(e => e.raw.type === s.type && e.raw.size === s.size && e.raw.color === s.color)
          .reduce((sum, e) => sum + e.raw.quantity, 0);
        return oldQty > 0 ? { ...s, count: s.count + oldQty } : s;
      }));
      setModels(prev => prev.map(m => {
        const oldProduced = oldWork.entries
          .filter(e => e.produced.modelId === m.id)
          .reduce((sum, e) => sum + e.produced.quantity, 0);
        return oldProduced > 0 ? { ...m, producedCount: (m.producedCount || 0) - oldProduced } : m;
      }));
    }

    // Deduct new values from stocks
    setStocks(prev => prev.map(s => {
      const key = `${s.type}-${s.size}-${s.color}`;
      return requiredRaw[key] ? { ...s, count: s.count - requiredRaw[key] } : s;
    }));

    // Add produced count to models (Raw production)
    setModels(prev => {
      const next = [...prev];
      entries.forEach(e => {
        const idx = next.findIndex(m => m.id === e.produced.modelId);
        if (idx !== -1) {
          next[idx] = { ...next[idx], producedCount: (next[idx].producedCount || 0) + Number(e.produced.quantity) };
        }
      });
      return next;
    });

    const workData: MachineWork = {
      id: editingId || Date.now().toString(),
      customerId: machineMainInfo.customerId,
      machineName: machineMainInfo.machineName,
      date: machineMainInfo.date,
      entries: JSON.parse(JSON.stringify(entries))
    };

    if (editingId) {
      setMachines(prev => prev.map(m => m.id === editingId ? workData : m));
    } else {
      setMachines([workData, ...machines]);
    }

    setIsMachineModalOpen(false);
  };

  const handleDeleteMachineWork = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟ سيتم إعادة الخامات للمخزن وخصم الإنتاج الخام.')) {
      const work = machines.find(m => m.id === id);
      if (work) {
        setStocks(prev => prev.map(s => {
          const qty = work.entries
            .filter(e => e.raw.type === s.type && e.raw.size === s.size && e.raw.color === s.color)
            .reduce((sum, e) => sum + e.raw.quantity, 0);
          return qty > 0 ? { ...s, count: s.count + qty } : s;
        }));
        setModels(prev => prev.map(m => {
          const produced = work.entries
            .filter(e => e.produced.modelId === m.id)
            .reduce((sum, e) => sum + e.produced.quantity, 0);
          return produced > 0 ? { ...m, producedCount: (m.producedCount || 0) - produced } : m;
        }));
      }
      setMachines(prev => prev.filter(m => m.id !== id));
    }
  };

  const getColorValue = (name: string) => colorPalette.find(c => c.name === name)?.value || '#CCCCCC';

  const groupedByCustomer = useMemo(() => {
    return machines.reduce((acc, work) => {
      if (!acc[work.customerId]) acc[work.customerId] = [];
      acc[work.customerId].push(work);
      return acc;
    }, {} as Record<string, MachineWork[]>);
  }, [machines]);

  const getCustomerStats = (customer: Customer) => {
    const customerMachines = machines.filter(m => m.customerId === customer.id);
    
    const totalBags = customerMachines.reduce((sum, m) => 
      sum + m.entries.reduce((s, e) => s + e.raw.quantity, 0), 0);
    
    const totalProductionValue = customerMachines.reduce((sum, m) => 
      sum + m.entries.reduce((s, e) => s + (e.produced.quantity * e.produced.price), 0), 0);
    
    const totalPaid = customer.payments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      totalBags,
      totalProductionValue,
      totalPaid,
      balance: totalProductionValue - totalPaid
    };
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const activeViewingCustomer = customers.find(c => c.id === viewingCustomerId);

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 flex items-center gap-3">
            <Cpu className="w-10 h-10 text-indigo-600" />
            شغل المكن
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-semibold italic">إدارة العملاء وربط الماكينات وحسابات الإنتاج</p>
        </div>
        <button
          onClick={handleOpenAddCustomer}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          <UserPlus className="w-6 h-6" />
          إضافة عميل جديد
        </button>
      </div>

      <div className="relative mb-10">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ابحث عن اسم عميل أو رقم هاتف..."
          className="block w-full pr-14 pl-4 py-5 border-none rounded-[2rem] bg-white text-gray-900 focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm transition-all text-xl font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100">
            <Users className="w-20 h-20 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-black italic text-xl">لا يوجد عملاء مضافون حالياً</p>
          </div>
        ) : (
          filteredCustomers.map(customer => {
            const stats = getCustomerStats(customer);
            return (
              <div key={customer.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-50 overflow-hidden group">
                <div 
                  onClick={() => toggleCustomer(customer.id)}
                  className="p-8 flex flex-col lg:flex-row justify-between lg:items-center cursor-pointer hover:bg-indigo-50/30 transition-all gap-6"
                >
                  <div className="flex items-center gap-5">
                    <div 
                      onClick={(e) => { e.stopPropagation(); handleOpenHistory(customer); }}
                      className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform cursor-pointer relative group/icon"
                    >
                      <Users className="w-8 h-8" />
                      <div className="absolute -bottom-2 -left-2 bg-green-500 text-white rounded-full p-1 opacity-0 group-hover/icon:opacity-100 transition-opacity">
                         <Receipt className="w-3 h-3" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-800 tracking-tight">{customer.name}</h3>
                      <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
                         <Smartphone className="w-3 h-3" /> {customer.phone || 'بدون هاتف'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 lg:max-w-2xl">
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 flex flex-col items-center">
                       <span className="text-[10px] font-black text-indigo-400 uppercase">إجمالي الشكائر</span>
                       <span className="text-xl font-black text-indigo-700">{stats.totalBags} <span className="text-[10px]">شكارة</span></span>
                    </div>
                    <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50 flex flex-col items-center">
                       <span className="text-[10px] font-black text-green-400 uppercase">إجمالي الحساب</span>
                       <span className="text-xl font-black text-green-700">{stats.totalProductionValue.toLocaleString()} <span className="text-[10px]">ج.م</span></span>
                    </div>
                    <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50 flex flex-col items-center col-span-2 md:col-span-1">
                       <span className="text-[10px] font-black text-red-400 uppercase">إجمالي الباقي</span>
                       <span className="text-xl font-black text-red-700">{stats.balance.toLocaleString()} <span className="text-[10px]">ج.م</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenPayment(customer); }}
                      className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-green-700 transition-all shadow-lg active:scale-95"
                    >
                      <Wallet className="w-5 h-5" /> دفع
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenAddMachine(customer.id); }}
                      className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      <Plus className="w-5 h-5" /> إضافة مكنة
                    </button>
                    {expandedCustomers.has(customer.id) ? <ChevronUp className="w-8 h-8 text-indigo-300" /> : <ChevronDown className="w-8 h-8 text-indigo-300" />}
                  </div>
                </div>

                {expandedCustomers.has(customer.id) && (
                  <div className="px-8 pb-8 pt-2 space-y-6 animate-in slide-in-from-top-4 duration-300 bg-gray-50/30">
                    <div className="h-px bg-gray-100 w-full mb-6"></div>
                    {(groupedByCustomer[customer.id] || []).length === 0 ? (
                      <p className="text-center text-gray-400 font-black py-10 border-2 border-dashed border-gray-100 rounded-[2rem]">لا يوجد ماكينات مضافة لهذا العميل بعد</p>
                    ) : (
                      groupedByCustomer[customer.id].map(work => (
                        <div key={work.id} className="bg-white rounded-[2.5rem] p-8 border-2 border-gray-50 hover:border-indigo-100 transition-all shadow-sm relative overflow-hidden group/card">
                          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600/10 group-hover/card:bg-indigo-600 transition-all"></div>
                          <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                            <div className="flex items-center gap-6">
                              <div className="px-6 py-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                                <Hammer className="w-6 h-6 text-indigo-600" />
                                <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">رقم الماكينة:</span>
                                <span className="text-2xl font-black text-indigo-700">{work.machineName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-400 text-sm font-bold">
                                <History className="w-4 h-4" />
                                {work.date}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleOpenEditMachine(work)} className="p-4 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm"><Edit className="w-6 h-6" /></button>
                              <button onClick={() => handleDeleteMachineWork(work.id)} className="p-4 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm"><Trash2 className="w-6 h-6" /></button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {work.entries.map((entry, idx) => {
                              const model = models.find(m => m.id === entry.produced.modelId);
                              const totalLineCost = entry.produced.quantity * entry.produced.price;
                              return (
                                <div key={idx} className="flex flex-wrap items-center gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:bg-white hover:shadow-md transition-all">
                                  <div className="flex items-center gap-4 min-w-[150px]">
                                    <div className="w-10 h-10 rounded-2xl bg-white text-indigo-600 flex items-center justify-center font-black text-sm shadow-sm border border-gray-50">{idx + 1}</div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span className="font-black text-gray-800 text-xl leading-none">{entry.raw.quantity} شكارة</span>
                                          <div className="w-5 h-5 rounded-lg shadow-inner border border-gray-100" style={{ backgroundColor: getColorValue(entry.raw.color) }} />
                                        </div>
                                        <span className="text-[11px] text-gray-400 font-bold mt-1 uppercase">{entry.raw.type} ({entry.raw.size})</span>
                                    </div>
                                  </div>
                                  <ArrowLeft className="w-8 h-8 text-indigo-100 hidden md:block" />
                                  <div className="flex items-center gap-5">
                                    <TrendingUp className="w-6 h-6 text-green-500" />
                                    <div className="flex flex-col min-w-[140px]">
                                        <span className="font-black text-green-600 text-2xl leading-none">{entry.produced.quantity} قطعة</span>
                                        <span className="text-[11px] text-gray-500 font-black mt-1">{model?.name || 'موديل مجهول'}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-center bg-white px-5 py-2 rounded-2xl border border-gray-100 shadow-inner mr-auto">
                                     <span className="text-[10px] font-black text-gray-300 uppercase leading-none mb-1">إجمالي التكلفة</span>
                                     <span className="text-xl font-black text-indigo-600">{totalLineCost.toLocaleString()} <span className="text-[11px]">ج.م</span></span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`سجل مدفوعات: ${activeViewingCustomer?.name || ''}`} maxWidth="2xl">
        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 text-center">
                 <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">إجمالي المدفوع</p>
                 <h4 className="text-3xl font-black text-indigo-700">{(activeViewingCustomer?.payments.reduce((s, p) => s + p.amount, 0) || 0).toLocaleString()} <span className="text-xs">ج.م</span></h4>
              </div>
              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-center">
                 <p className="text-[10px] font-black text-orange-400 uppercase mb-1">عدد الدفعات</p>
                 <h4 className="text-3xl font-black text-orange-700">{activeViewingCustomer?.payments.length || 0}</h4>
              </div>
           </div>
           <div className="max-h-[40vh] overflow-y-auto space-y-3 custom-scrollbar">
              {activeViewingCustomer?.payments.slice().reverse().map((payment) => (
                <div key={payment.id} className="flex justify-between items-center bg-gray-50/50 p-5 rounded-2xl border border-gray-50">
                  <span className="text-xl font-black text-green-600">+{payment.amount.toLocaleString()} ج.م</span>
                  <div className="text-gray-400 text-xs font-bold">{payment.date}</div>
                  <button onClick={() => viewingCustomerId && handleDeletePayment(viewingCustomerId, payment.id)} className="text-red-300 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
           </div>
        </div>
      </Modal>

      <Modal isOpen={isMachineModalOpen} onClose={() => setIsMachineModalOpen(false)} title={editingId ? "تعديل بيانات الماكينة" : "إضافة ماكينة تشغيل"} maxWidth="4xl">
        <div className="space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 font-black border border-red-100">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/20 p-8 rounded-[2.5rem]">
            <div className="space-y-2">
              <label className="text-xs font-black text-indigo-400 uppercase tracking-widest mr-2">رقم الماكينة</label>
              <input 
                type="text" 
                placeholder="رقم المكنة" 
                value={machineMainInfo.machineName} 
                onChange={(e) => setMachineMainInfo({ ...machineMainInfo, machineName: e.target.value })} 
                className="w-full p-5 rounded-2xl border-2 border-white shadow-sm font-black focus:ring-4 focus:ring-indigo-100 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-indigo-400 uppercase tracking-widest mr-2">تاريخ التشغيل</label>
              <input 
                type="text" 
                value={machineMainInfo.date} 
                onChange={(e) => setMachineMainInfo({ ...machineMainInfo, date: e.target.value })} 
                className="w-full p-5 rounded-2xl border-2 border-white shadow-sm font-black focus:ring-4 focus:ring-indigo-100 outline-none" 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
              <h5 className="font-black text-gray-700 flex items-center gap-2 uppercase tracking-widest">
                <Hammer className="w-5 h-5 text-indigo-600" />
                أسطر التشغيل (الخامات والإنتاج)
              </h5>
              <button 
                onClick={addEntry} 
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" /> إضافة سطر
              </button>
            </div>

            <div className="space-y-6">
              {entries.map((entry, index) => {
                // Get available colors from warehouse for this specific type and size
                const availableColors = stocks
                  .filter(s => s.type === entry.raw.type && s.size === entry.raw.size && s.count > 0)
                  .map(s => s.color);

                return (
                  <div key={index} className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 shadow-sm relative group/row overflow-hidden hover:border-indigo-100 transition-all">
                    <button 
                      onClick={() => removeEntry(index)} 
                      className="absolute top-4 left-4 text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-xl opacity-0 group-hover/row:opacity-100 transition-opacity"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 items-center">
                      {/* Raw Materials Column */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase">
                          <Package className="w-4 h-4" /> الخامات المستخدمة
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <select 
                            value={entry.raw.type} 
                            onChange={(e) => updateEntryRaw(index, 'type', e.target.value)} 
                            className="p-4 rounded-xl bg-gray-50 border-none font-bold outline-none focus:ring-2 focus:ring-indigo-200"
                          >
                            <option value="عجينة">عجينة</option>
                            <option value="أندي">أندي</option>
                          </select>
                          <select 
                            value={entry.raw.size} 
                            onChange={(e) => updateEntryRaw(index, 'size', parseInt(e.target.value))} 
                            className="p-4 rounded-xl bg-gray-50 border-none font-bold outline-none focus:ring-2 focus:ring-indigo-200"
                          >
                            <option value={18}>18</option>
                            <option value={24}>24</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative group/select">
                            <div 
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded shadow-sm z-10 pointer-events-none" 
                              style={{ backgroundColor: getColorValue(entry.raw.color) }}
                            />
                            <select 
                              value={entry.raw.color} 
                              onChange={(e) => updateEntryRaw(index, 'color', e.target.value)} 
                              className="w-full p-4 pr-10 rounded-xl bg-gray-50 border-none font-bold outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                              <option value="">اختر اللون...</option>
                              {availableColors.length === 0 ? (
                                <option disabled>لا يوجد ألوان متاحة</option>
                              ) : (
                                availableColors.map(cName => (
                                  <option key={cName} value={cName}>{cName}</option>
                                ))
                              )}
                            </select>
                          </div>
                          <input 
                            type="number" 
                            placeholder="الشكائر" 
                            value={entry.raw.quantity || ''} 
                            onChange={(e) => updateEntryRaw(index, 'quantity', parseInt(e.target.value) || 0)} 
                            className="p-4 rounded-xl bg-gray-50 border-none font-black text-center outline-none focus:ring-2 focus:ring-indigo-200" 
                          />
                        </div>
                      </div>

                      {/* Arrow Spacer */}
                      <div className="hidden lg:flex lg:col-span-1 justify-center">
                        <ArrowLeft className="w-8 h-8 text-gray-200" />
                      </div>

                      {/* Production Column */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-black text-green-400 uppercase">
                          <TrendingUp className="w-4 h-4" /> الإنتاج الناتج
                        </div>
                        <select 
                          value={entry.produced.modelId} 
                          onChange={(e) => updateEntryProduced(index, 'modelId', e.target.value)} 
                          className="w-full p-4 rounded-xl bg-green-50/50 border-none font-bold outline-none focus:ring-2 focus:ring-green-200"
                        >
                          <option value="">اختر الموديل...</option>
                          {models.map(m => (
                            <option key={m.id} value={m.id}>{m.name} (كود: {m.code})</option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            type="number" 
                            placeholder="عدد القطع" 
                            value={entry.produced.quantity || ''} 
                            onChange={(e) => updateEntryProduced(index, 'quantity', parseInt(e.target.value) || 0)} 
                            className="p-4 rounded-xl bg-green-50/50 border-none font-black text-center outline-none focus:ring-2 focus:ring-green-200" 
                          />
                          <input 
                            type="number" 
                            placeholder="السعر" 
                            value={entry.produced.price || ''} 
                            onChange={(e) => updateEntryProduced(index, 'price', parseFloat(e.target.value) || 0)} 
                            className="p-4 rounded-xl bg-green-50/50 border-none font-black text-center outline-none focus:ring-2 focus:ring-green-200" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 flex justify-end items-center">
                      <div className="text-right">
                         <span className="text-[10px] font-black text-gray-300 uppercase ml-2 tracking-widest">إجمالي السطر:</span>
                         <span className="text-xl font-black text-indigo-600">{(entry.produced.quantity * entry.produced.price).toLocaleString()} <span className="text-[10px]">ج.م</span></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={handleSaveMachineWork} 
            className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-xl flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <CheckCircle2 className="w-7 h-7" />
            تأكيد وتسجيل الماكينة وحفظ الأرصدة
          </button>
        </div>
      </Modal>

      {/* Customer Modal with white inputs */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="إضافة عميل جديد">
        <div className="space-y-4">
           <input 
             type="text" 
             placeholder="اسم العميل" 
             value={customerForm.name} 
             onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})} 
             className="w-full p-4 border rounded-xl font-bold bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-100 outline-none" 
           />
           <input 
             type="text" 
             placeholder="رقم الهاتف" 
             value={customerForm.phone} 
             onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})} 
             className="w-full p-4 border rounded-xl font-bold bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-100 outline-none" 
           />
           <button onClick={handleSaveCustomer} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all">حفظ العميل</button>
        </div>
      </Modal>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="تسجيل دفعة نقدية">
         <div className="space-y-4">
            <input type="number" placeholder="المبلغ" value={paymentForm.amount || ''} onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})} className="w-full p-6 text-center text-4xl font-black text-green-600 border rounded-3xl bg-gray-50" />
            <button onClick={handleSavePayment} className="w-full bg-green-600 text-white py-5 rounded-2xl font-black shadow-lg">تأكيد الدفع</button>
         </div>
      </Modal>
    </div>
  );
};

export default MachinesPage;
