
import React, { useState, useMemo } from 'react';
import { ProcessingWork, FabricModel, ProcessingEntry, Customer, Payment } from '../types';
import Modal from '../components/Modal';
import { 
  PlusCircle, 
  Search, 
  Scissors, 
  Trash2, 
  Edit, 
  AlertTriangle, 
  Plus, 
  ArrowLeft,
  Calendar,
  Layers,
  CheckCircle2,
  DollarSign,
  UserPlus,
  Users,
  Smartphone,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Hammer,
  Wallet,
  Coins,
  Receipt,
  ArrowDownCircle,
  History,
  Box,
  X,
  PackageSearch,
  UserX
} from 'lucide-react';

interface Props {
  processing: ProcessingWork[];
  setProcessing: React.Dispatch<React.SetStateAction<ProcessingWork[]>>;
  models: FabricModel[];
  setModels: React.Dispatch<React.SetStateAction<FabricModel[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const ProcessingPage: React.FC<Props> = ({ processing, setProcessing, models, setModels, customers, setCustomers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);

  // Forms
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' });
  const [paymentForm, setPaymentForm] = useState({ customerId: '', amount: 0, date: new Date().toLocaleDateString('ar-EG') });
  const [mainInfo, setMainInfo] = useState({
    customerId: '',
    machineName: '',
    date: new Date().toLocaleDateString('ar-EG')
  });

  const [entries, setEntries] = useState<ProcessingEntry[]>([
    { modelId: '', quantitySent: 0, quantityReceived: 0, price: 0 }
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
    setCustomers(prev => [...prev, newCustomer]);
    setIsCustomerModalOpen(false);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف المجهز "${name}" نهائياً؟ سيتم حذف جميع سجلات التشغيل والمدفوعات الخاصة به.`)) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      setProcessing(prev => prev.filter(p => p.customerId !== id));
      setExpandedCustomers(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
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
    if (confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      setCustomers(prev => prev.map(c => 
        c.id === customerId 
          ? { ...c, payments: c.payments.filter(p => p.id !== paymentId) } 
          : c
      ));
    }
  };

  const handleOpenAdd = (customerId: string) => {
    setEditingId(null);
    setMainInfo({
      customerId,
      machineName: '',
      date: new Date().toLocaleDateString('ar-EG')
    });
    setEntries([{ modelId: '', quantitySent: 0, quantityReceived: 0, price: 0 }]);
    setIsModalOpen(true);
    setError(null);
  };

  const handleOpenEdit = (work: ProcessingWork) => {
    setEditingId(work.id);
    setMainInfo({
      customerId: work.customerId,
      machineName: work.machineName,
      date: work.date
    });
    setEntries(JSON.parse(JSON.stringify(work.entries)));
    setIsModalOpen(true);
    setError(null);
  };

  const addEntry = () => setEntries([...entries, { modelId: '', quantitySent: 0, quantityReceived: 0, price: 0 }]);
  const removeEntry = (index: number) => entries.length > 1 && setEntries(entries.filter((_, i) => i !== index));
  const updateEntry = (index: number, field: keyof ProcessingEntry, value: any) => {
     const next = [...entries];
     next[index] = { ...next[index], [field]: value };
     setEntries(next);
  };

  const handleSave = () => {
    if (!mainInfo.machineName || entries.some(e => !e.modelId)) {
      setError('يرجى التأكد من ملء اسم المكنة واختيار الموديلات لكل سطر');
      return;
    }

    for (const entry of entries) {
      const model = models.find(m => m.id === entry.modelId);
      if (!model) continue;
      
      let available = model.producedCount || 0;
      if (editingId) {
        const oldWork = processing.find(p => p.id === editingId);
        const oldEntry = oldWork?.entries.find(e => e.modelId === entry.modelId);
        available += (oldEntry?.quantitySent || 0);
      }

      if (entry.quantitySent > available) {
        setError(`الكمية المرسلة للموديل ${model.name} أكبر من المتاح غير الجاهز (${available})`);
        return;
      }
    }

    if (editingId) {
      const oldWork = processing.find(p => p.id === editingId);
      setModels(prev => prev.map(m => {
        const oldEntry = oldWork?.entries.find(e => e.modelId === m.id);
        const oldSent = oldEntry?.quantitySent || 0;
        const oldReceived = oldEntry?.quantityReceived || 0;
        const newEntriesForModel = entries.filter(e => e.modelId === m.id);
        const newSent = newEntriesForModel.reduce((sum, e) => sum + e.quantitySent, 0);
        const newReceived = newEntriesForModel.reduce((sum, e) => sum + e.quantityReceived, 0);
        return { 
          ...m, 
          producedCount: (m.producedCount || 0) + oldSent - newSent,
          stockCount: (m.stockCount || 0) - oldReceived + newReceived
        };
      }));

      setProcessing(prev => prev.map(p => p.id === editingId ? {
        ...p,
        customerId: mainInfo.customerId,
        machineName: mainInfo.machineName,
        date: mainInfo.date,
        entries: JSON.parse(JSON.stringify(entries))
      } : p));
    } else {
      setModels(prev => prev.map(m => {
        const relevantEntries = entries.filter(e => e.modelId === m.id);
        const totalSent = relevantEntries.reduce((sum, e) => sum + e.quantitySent, 0);
        const totalReceived = relevantEntries.reduce((sum, e) => sum + e.quantityReceived, 0);
        return { 
          ...m, 
          producedCount: (m.producedCount || 0) - totalSent,
          stockCount: (m.stockCount || 0) + totalReceived
        };
      }));

      const newWork: ProcessingWork = {
        id: Date.now().toString(),
        customerId: mainInfo.customerId,
        machineName: mainInfo.machineName,
        date: mainInfo.date,
        entries: JSON.parse(JSON.stringify(entries))
      };
      setProcessing([newWork, ...processing]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteWork = (id: string) => {
    if(confirm('هل تريد حذف هذا السجل؟ سيتم إعادة الكميات المرسلة لعداد (غير الجاهز) وخصم المستلم من (الجاهز).')) {
        const work = processing.find(p => p.id === id);
        if (work) {
            setModels(prev => prev.map(m => {
                const e = work.entries.find(entry => entry.modelId === m.id);
                if (e) return { 
                    ...m, 
                    producedCount: (m.producedCount || 0) + e.quantitySent, 
                    stockCount: Math.max(0, (m.stockCount || 0) - e.quantityReceived) 
                };
                return m;
            }));
        }
        setProcessing(prev => prev.filter(p => p.id !== id));
    }
  }

  const getCustomerStats = (customer: Customer) => {
    const customerWorks = processing.filter(p => p.customerId === customer.id);
    const totalSent = customerWorks.reduce((sum, p) => sum + p.entries.reduce((s, e) => s + e.quantitySent, 0), 0);
    const totalReceived = customerWorks.reduce((sum, p) => sum + p.entries.reduce((s, e) => s + e.quantityReceived, 0), 0);
    const totalAccount = customerWorks.reduce((sum, p) => sum + p.entries.reduce((s, e) => s + (e.quantityReceived * e.price), 0), 0);
    const totalPaid = customer.payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      totalSent,
      totalReceived,
      totalAccount,
      totalPaid,
      balance: totalAccount - totalPaid
    };
  };

  const groupedByCustomer = useMemo(() => {
    return processing.reduce((acc, work) => {
      if (!acc[work.customerId]) acc[work.customerId] = [];
      acc[work.customerId].push(work);
      return acc;
    }, {} as Record<string, ProcessingWork[]>);
  }, [processing]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const activeViewingCustomer = customers.find(c => c.id === viewingCustomerId);

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 flex items-center gap-3"><Scissors className="w-10 h-10 text-indigo-600" /> التجهيز</h2>
          <p className="text-sm font-bold text-gray-400 italic">إدارة ورش التجهيز واستلام المخزون الجاهز</p>
        </div>
        <button onClick={handleOpenAddCustomer} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">إضافة مجهز جديد</button>
      </div>

      <div className="relative mb-8">
         <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400" />
         </div>
         <input type="text" placeholder="ابحث عن ورشة مجهز..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-14 pl-4 py-5 rounded-[2rem] border-none shadow-sm font-bold text-xl outline-none focus:ring-4 focus:ring-indigo-100 outline-none transition-all" />
      </div>

      <div className="space-y-8">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100">
            <Users className="w-20 h-20 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-black italic text-xl">لا يوجد مجهزون مضافون حالياً</p>
          </div>
        ) : (
          filteredCustomers.map(customer => {
            const stats = getCustomerStats(customer);
            return (
              <div key={customer.id} className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-hidden group">
                <div onClick={() => toggleCustomer(customer.id)} className="p-8 flex flex-col lg:flex-row justify-between lg:items-center cursor-pointer hover:bg-indigo-50/30 gap-6 transition-all">
                  <div className="flex items-center gap-5">
                     <div onClick={(e) => { e.stopPropagation(); handleOpenHistory(customer); }} className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform shadow-lg"><Scissors className="w-8 h-8" /></div>
                     <div><h3 className="text-2xl font-black text-gray-800">{customer.name}</h3><span className="text-xs text-indigo-400 font-bold tracking-widest uppercase">{customer.phone || 'بدون هاتف'}</span></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 lg:max-w-3xl">
                     <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black uppercase text-orange-400">إجمالي المرسل</span>
                        <span className="text-xl font-black text-orange-700">{stats.totalSent}</span>
                     </div>
                     <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black uppercase text-blue-400">إجمالي المستلم</span>
                        <span className="text-xl font-black text-blue-700">{stats.totalReceived}</span>
                     </div>
                     <div className="bg-green-50/70 p-4 rounded-2xl border border-green-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black uppercase text-green-400">إجمالي الحساب</span>
                        <span className="text-xl font-black text-green-700">{stats.totalAccount.toLocaleString()}</span>
                     </div>
                     <div className="bg-red-50/70 p-4 rounded-2xl border border-red-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black uppercase text-red-400">الباقي</span>
                        <span className="text-xl font-black text-red-700">{stats.balance.toLocaleString()}</span>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={(e) => { e.stopPropagation(); handleOpenPayment(customer); }} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-green-700 transition-all shadow-lg active:scale-95">دفع</button>
                     <button onClick={(e) => { e.stopPropagation(); handleOpenAdd(customer.id); }} className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm">مكنة</button>
                     <button 
                       onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDeleteCustomer(customer.id, customer.name); 
                       }}
                       className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm group/del"
                       title="حذف المجهز"
                     >
                       <UserX className="w-6 h-6 group-hover/del:scale-110 transition-transform" />
                     </button>
                     {expandedCustomers.has(customer.id) ? <ChevronUp className="w-6 h-6 text-indigo-300" /> : <ChevronDown className="w-6 h-6 text-indigo-300" />}
                  </div>
                </div>

                {expandedCustomers.has(customer.id) && (
                  <div className="p-8 space-y-6 bg-gray-50/30 border-t animate-in slide-in-from-top-4 duration-300">
                    {(groupedByCustomer[customer.id] || []).length === 0 ? (
                      <div className="text-center py-12 text-gray-400 font-black border-2 border-dashed rounded-[2.5rem]">لا توجد سجلات تشغيل لهذا المجهز بعد</div>
                    ) : (
                      (groupedByCustomer[customer.id] || []).map(work => (
                        <div key={work.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm relative border hover:border-indigo-100 transition-all group/card">
                           <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500/10 group-hover/card:bg-indigo-500 transition-all"></div>
                           <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                              <div className="flex items-center gap-4">
                                 <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100"><Hammer className="w-6 h-6 text-indigo-600" /></div>
                                 <div className="flex flex-col">
                                    <span className="font-black text-2xl text-indigo-700 leading-none">{work.machineName}</span>
                                    <span className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3" /> {work.date}</span>
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                 <button onClick={() => handleOpenEdit(work)} className="p-4 text-indigo-600 bg-indigo-50 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><Edit className="w-6 h-6" /></button>
                                 <button onClick={() => handleDeleteWork(work.id)} className="p-4 text-red-600 bg-red-50 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-6 h-6" /></button>
                              </div>
                           </div>
                           <div className="space-y-3">
                              {work.entries.map((entry, idx) => {
                                  const model = models.find(m => m.id === entry.modelId);
                                  return (
                                      <div key={idx} className="flex flex-wrap md:flex-nowrap justify-between items-center bg-gray-50/50 p-5 rounded-2xl text-sm font-bold border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                         <div className="flex items-center gap-5 min-w-[150px]">
                                            <span className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border-2 border-gray-50 text-indigo-600 font-black shadow-sm">{idx+1}</span>
                                            <span className="text-xl font-black text-gray-800">{model?.name}</span>
                                         </div>
                                         <div className="flex gap-8 text-xs font-black mr-auto">
                                            <div className="flex flex-col items-center"><span className="text-orange-400 text-[9px] uppercase tracking-tighter mb-1">المرسل</span><span className="text-xl">{entry.quantitySent}</span></div>
                                            <div className="flex flex-col items-center"><span className="text-green-500 text-[9px] uppercase tracking-tighter mb-1">المستلم</span><span className="text-xl">{entry.quantityReceived}</span></div>
                                            <div className="flex flex-col items-center"><span className="text-indigo-400 text-[9px] uppercase tracking-tighter mb-1">السعر</span><span className="text-xl">{entry.price}</span></div>
                                            <div className="flex flex-col items-center bg-white px-4 py-2 rounded-xl shadow-inner border border-gray-50"><span className="text-gray-300 text-[9px] uppercase tracking-tighter mb-1">الإجمالي</span><span className="text-xl text-indigo-700">{(entry.quantityReceived * entry.price).toLocaleString()}</span></div>
                                         </div>
                                      </div>
                                  )
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "تعديل سجل تجهيز" : "إضافة سجل تجهيز جديد"} maxWidth="4xl">
        <div className="space-y-8">
           {error && <div className="bg-red-50 text-red-600 p-4 rounded-[1.5rem] border-2 border-red-100 font-black flex items-center gap-2 animate-pulse"><AlertTriangle className="w-6 h-6" />{error}</div>}
           
           <div className="grid grid-cols-2 gap-6 bg-indigo-50/20 p-8 rounded-[2.5rem] border border-indigo-50 shadow-inner">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mr-2">اسم المكنة / الورشة</label>
                <input 
                  type="text" 
                  placeholder="رقم المكنة" 
                  value={mainInfo.machineName} 
                  onChange={(e) => setMainInfo({...mainInfo, machineName: e.target.value})} 
                  className="w-full p-5 border-none rounded-2xl font-black bg-white text-gray-900 shadow-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mr-2">تاريخ التشغيل</label>
                <input 
                  type="text" 
                  value={mainInfo.date} 
                  onChange={(e) => setMainInfo({...mainInfo, date: e.target.value})} 
                  className="w-full p-5 border-none rounded-2xl font-black bg-white text-gray-900 shadow-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all" 
                />
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4 border-gray-100">
                <h5 className="font-black text-gray-700 flex items-center gap-3 uppercase tracking-widest">
                  <Layers className="w-6 h-6 text-indigo-600" />
                  أسطر التجهيز والاستلام
                </h5>
                <button 
                  onClick={addEntry} 
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> إضافة سطر جديد
                </button>
              </div>

              <div className="space-y-6">
                {entries.map((entry, idx) => {
                  const model = models.find(m => m.id === entry.modelId);
                  let maxAvailable = model ? model.producedCount : 0;
                  if (editingId) {
                    const oldWork = processing.find(p => p.id === editingId);
                    const oldEntry = oldWork?.entries.find(e => e.modelId === entry.modelId);
                    maxAvailable += (oldEntry?.quantitySent || 0);
                  }

                  return (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 relative group/row hover:border-indigo-100 transition-all shadow-sm">
                      <button 
                        onClick={() => removeEntry(idx)} 
                        className="absolute -top-3 -left-3 text-red-500 bg-white border-2 border-red-50 rounded-2xl p-3 shadow-lg opacity-0 group-hover/row:opacity-100 transition-opacity"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter block mr-2">الموديل (المتاح غير الجاهز)</label>
                        <select 
                          value={entry.modelId} 
                          onChange={(e) => updateEntry(idx, 'modelId', e.target.value)} 
                          className="w-full p-4 rounded-xl font-black border-none bg-gray-50 text-gray-900 shadow-inner focus:ring-2 focus:ring-indigo-100 outline-none text-md"
                        >
                          <option value="">اختر الموديل...</option>
                          {models.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} (غير الجاهز: {m.producedCount || 0})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-orange-400 uppercase tracking-tighter block mr-2 flex items-center gap-1">
                           <PackageSearch className="w-3 h-3" /> الكمية المرسلة (كحد أقصى {maxAvailable})
                        </label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          max={maxAvailable}
                          value={entry.quantitySent || ''} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            updateEntry(idx, 'quantitySent', val);
                          }} 
                          className={`w-full p-4 rounded-xl font-black text-center border-none bg-orange-50/30 text-gray-900 shadow-inner focus:ring-2 focus:ring-orange-100 outline-none text-xl ${entry.quantitySent > maxAvailable ? 'ring-2 ring-red-500' : ''}`} 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-green-500 uppercase tracking-tighter block mr-2">الكمية المستلمة (جاهز)</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={entry.quantityReceived || ''} 
                          onChange={(e) => updateEntry(idx, 'quantityReceived', parseInt(e.target.value) || 0)} 
                          className="w-full p-4 rounded-xl font-black text-center border-none bg-green-50/30 text-gray-900 shadow-inner focus:ring-2 focus:ring-green-100 outline-none text-xl" 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter block mr-2">سعر التجهيز للقطعة</label>
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          value={entry.price || ''} 
                          onChange={(e) => updateEntry(idx, 'price', parseFloat(e.target.value) || 0)} 
                          className="w-full p-4 rounded-xl font-black text-center border-none bg-gray-50/50 text-gray-900 shadow-inner focus:ring-2 focus:ring-indigo-100 outline-none text-xl" 
                        />
                      </div>

                      <div className="md:col-span-4 flex justify-end items-center pt-2">
                        <div className="flex items-center gap-2 bg-indigo-50 px-6 py-2 rounded-2xl border border-indigo-100">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">إجمالي السطر:</span>
                            <span className="text-2xl font-black text-indigo-700">{(entry.quantityReceived * entry.price).toLocaleString()} <span className="text-xs">ج.م</span></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>

           <button 
             onClick={handleSave} 
             className="w-full bg-indigo-600 text-white py-8 rounded-[2.5rem] font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-2xl flex items-center justify-center gap-4 active:scale-[0.98]"
           >
             <CheckCircle2 className="w-9 h-9" />
             تأكيد استلام الجاهز وتحديث الأرصدة
           </button>
        </div>
      </Modal>

      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`سجل مدفوعات: ${activeViewingCustomer?.name || ''}`} maxWidth="2xl">
         <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 text-center">
                 <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">إجمالي المدفوع</p>
                 <h4 className="text-3xl font-black text-indigo-700">{(activeViewingCustomer?.payments.reduce((s, p) => s + p.amount, 0) || 0).toLocaleString()} <span className="text-xs">ج.م</span></h4>
              </div>
              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-center">
                 <p className="text-[10px] font-black text-orange-400 uppercase mb-1">دفعات مسجلة</p>
                 <h4 className="text-3xl font-black text-orange-700">{activeViewingCustomer?.payments.length || 0}</h4>
              </div>
           </div>
           <div className="max-h-[50vh] overflow-y-auto space-y-3 custom-scrollbar">
              {activeViewingCustomer?.payments.slice().reverse().map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-white p-6 rounded-[2rem] border-2 border-gray-50 hover:border-green-100 transition-all shadow-sm">
                     <span className="font-black text-green-600 text-2xl">+{p.amount.toLocaleString()} <span className="text-xs">ج.م</span></span>
                     <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">تاريخ الدفع</span>
                        <span className="text-sm font-bold text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.date}</span>
                     </div>
                     <button onClick={() => viewingCustomerId && handleDeletePayment(viewingCustomerId, p.id)} className="p-3 text-red-300 hover:text-red-600 transition-all"><Trash2 className="w-6 h-6" /></button>
                  </div>
              ))}
           </div>
         </div>
      </Modal>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="تسجيل دفعة نقدية للمجهز">
         <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center block mb-2">المبلغ المطلوب دفعه</label>
              <input type="number" placeholder="0.00" value={paymentForm.amount || ''} onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})} className="w-full p-8 text-center text-6xl font-black text-green-600 border-2 border-green-100 rounded-[2.5rem] bg-green-50/30 focus:bg-white outline-none transition-all shadow-inner" />
            </div>
            <button onClick={handleSavePayment} className="w-full bg-green-600 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-[0.98]">تأكيد دفع المبلغ</button>
         </div>
      </Modal>

      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="إضافة مجهز جديد للمصنع">
         <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-indigo-400 uppercase tracking-widest mr-2">اسم المجهز / صاحب الورشة</label>
              <input type="text" placeholder="الاسم بالكامل" value={customerForm.name} onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})} className="w-full p-5 border rounded-2xl font-bold bg-white outline-none focus:ring-4 focus:ring-indigo-100 shadow-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-indigo-400 uppercase tracking-widest mr-2">رقم الموبايل</label>
              <input type="text" placeholder="رقم الهاتف" value={customerForm.phone} onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full p-5 border rounded-2xl font-bold bg-white outline-none focus:ring-4 focus:ring-indigo-100 shadow-sm" />
            </div>
            <button onClick={handleSaveCustomer} className="w-full bg-indigo-600 text-white py-5 rounded-[2.5rem] font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-xl">حفظ بيانات المجهز</button>
         </div>
      </Modal>
    </div>
  );
};

export default ProcessingPage;
