
import React, { useState, useMemo } from 'react';
import { Customer, FabricModel, Invoice, Payment, MachineWork } from '../types';
import Modal from '../components/Modal';
import { PlusCircle, Users, FileText, Wallet, Phone, Trash2, Edit, CheckSquare, Square, Trash, XCircle, Search, Cpu, ArrowLeft, AlertCircle } from 'lucide-react';

interface Props {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  models: FabricModel[];
  setModels: React.Dispatch<React.SetStateAction<FabricModel[]>>;
  machines: MachineWork[]; 
}

const CustomersPage: React.FC<Props> = ({ customers, setCustomers, models, setModels, machines }) => {
  const [customerModal, setCustomerModal] = useState({ isOpen: false, id: null as string | null });
  const [invoiceModal, setInvoiceModal] = useState<{ isOpen: boolean, customerId: string, invoiceId: string | null }>({ isOpen: false, customerId: '', invoiceId: null });
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, customerId: string }>({ isOpen: false, customerId: '' });
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' });
  const [invoiceForm, setInvoiceForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    selection: '', // will hold "machineName|modelId"
    quantity: 0, 
    price: 0 
  });
  const [paymentForm, setPaymentForm] = useState({ date: new Date().toISOString().split('T')[0], amount: 0 });

  // Modified logic: availability now comes strictly from "Ready" counter (stockCount)
  const machineStockOptions = useMemo(() => {
    const options: { machineName: string; modelId: string; modelName: string; available: number }[] = [];
    
    // Group all machines to know which machines produced which models
    const machineNames = Array.from(new Set<string>(machines.map(m => m.machineName)));
    
    machineNames.forEach(mName => {
      models.forEach(model => {
        // Find if this machine produced this model
        const hasProduction = machines.some(m => 
          m.machineName === mName && 
          m.entries.some(e => e.produced.modelId === model.id)
        );

        if (hasProduction && model.stockCount > 0) {
          options.push({
            machineName: mName,
            modelId: model.id,
            modelName: model.name,
            available: model.stockCount // This is the "Ready" counter
          });
        }
      });
    });
    return options;
  }, [machines, models]);

  const handleOpenAddCustomer = () => {
    setCustomerModal({ isOpen: true, id: null });
    setCustomerForm({ name: '', phone: '' });
  };

  const handleOpenEditCustomer = (customer: Customer) => {
    setCustomerModal({ isOpen: true, id: customer.id });
    setCustomerForm({ name: customer.name, phone: customer.phone });
  };

  const handleSaveCustomer = () => {
    if (!customerForm.name) return;
    if (customerModal.id) {
      setCustomers(prev => prev.map(c => c.id === customerModal.id ? { ...c, ...customerForm } : c));
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: customerForm.name,
        phone: customerForm.phone,
        invoices: [],
        payments: []
      };
      setCustomers([...customers, newCustomer]);
    }
    setCustomerModal({ isOpen: false, id: null });
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل وجميع سجلاته؟')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      const newSelected = new Set(selectedCustomerIds);
      newSelected.delete(id);
      setSelectedCustomerIds(newSelected);
    }
  };

  const handleBulkDeleteCustomers = () => {
    if (confirm(`هل أنت متأكد من حذف ${selectedCustomerIds.size} عميل؟`)) {
      setCustomers(prev => prev.filter(c => !selectedCustomerIds.has(c.id)));
      setSelectedCustomerIds(new Set());
    }
  };

  const toggleCustomerSelect = (id: string) => {
    const newSelected = new Set(selectedCustomerIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedCustomerIds(newSelected);
  };

  const toggleSelectAllCustomers = () => {
    if (selectedCustomerIds.size === customers.length) setSelectedCustomerIds(new Set());
    else setSelectedCustomerIds(new Set(customers.map(c => c.id)));
  };

  const handleOpenInvoiceModal = (customerId: string, invoice: Invoice | null = null) => {
    setError(null);
    if (invoice) {
      setInvoiceModal({ isOpen: true, customerId, invoiceId: invoice.id });
      const firstItem = invoice.items[0];
      setInvoiceForm({
        date: invoice.date,
        selection: firstItem ? `${firstItem.machineName}|${firstItem.modelId}` : '',
        quantity: firstItem ? firstItem.quantity : 0,
        price: firstItem ? firstItem.price : 0
      });
    } else {
      setInvoiceModal({ isOpen: true, customerId, invoiceId: null });
      setInvoiceForm({ date: new Date().toISOString().split('T')[0], selection: '', quantity: 0, price: 0 });
    }
  };

  const handleSaveInvoice = () => {
    if (!invoiceForm.selection || invoiceForm.quantity <= 0) {
        setError('يرجى اختيار الموديل والكمية');
        return;
    }
    
    const [machineName, modelId] = invoiceForm.selection.split('|');
    const model = models.find(m => m.id === modelId);

    if (!model) return;

    // Check if enough stock is "Ready" (Gahiz)
    let available = model.stockCount;
    if (invoiceModal.invoiceId) {
       // Add back old quantity for validation if editing
       const customer = customers.find(c => c.id === invoiceModal.customerId);
       const oldInvoice = customer?.invoices.find(inv => inv.id === invoiceModal.invoiceId);
       const oldItem = oldInvoice?.items.find(i => i.modelId === modelId);
       if (oldItem) available += oldItem.quantity;
    }

    if (invoiceForm.quantity > available) {
      setError(`الرصيد الجاهز غير كافٍ. المتاح حالياً: ${available} قطعة فقط`);
      return;
    }
    
    if (invoiceModal.invoiceId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === invoiceModal.customerId) {
          const updatedInvoices = c.invoices.map(inv => {
              if (inv.id === invoiceModal.invoiceId) {
                  const oldItem = inv.items[0];
                  // Update model stock: add back old, subtract new
                  setModels(mPrev => mPrev.map(m => {
                      if (m.id === oldItem.modelId) {
                          return { ...m, stockCount: m.stockCount + oldItem.quantity };
                      }
                      return m;
                  }));
                  setModels(mPrev => mPrev.map(m => {
                    if (m.id === modelId) {
                        return { ...m, stockCount: m.stockCount - invoiceForm.quantity };
                    }
                    return m;
                }));

                  return {
                    ...inv,
                    date: invoiceForm.date,
                    items: [{ modelId, machineName, quantity: invoiceForm.quantity, price: invoiceForm.price }],
                    total: invoiceForm.quantity * invoiceForm.price
                  };
              }
              return inv;
          });
          return { ...c, invoices: updatedInvoices };
        }
        return c;
      }));
    } else {
      const newInvoice: Invoice = {
        id: Date.now().toString(),
        date: invoiceForm.date,
        items: [{ modelId, machineName, quantity: invoiceForm.quantity, price: invoiceForm.price }],
        total: invoiceForm.quantity * invoiceForm.price
      };
      
      setCustomers(prev => prev.map(c => c.id === invoiceModal.customerId ? { ...c, invoices: [...c.invoices, newInvoice] } : c));
      
      // Update global "Ready" stock counter
      setModels(prev => prev.map(m => m.id === modelId ? { ...m, stockCount: Math.max(0, m.stockCount - invoiceForm.quantity) } : m));
    }
    setInvoiceModal({ isOpen: false, customerId: '', invoiceId: null });
  };

  const handleDeleteInvoice = (customerId: string, invoiceId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟ سيتم استرداد الكمية للمخزون الجاهز.')) {
      setCustomers(prev => prev.map(c => {
        if (c.id === customerId) {
          const invToDelete = c.invoices.find(inv => inv.id === invoiceId);
          if (invToDelete) {
             const item = invToDelete.items[0];
             setModels(mPrev => mPrev.map(m => m.id === item.modelId ? { ...m, stockCount: m.stockCount + item.quantity } : m));
          }
          return { ...c, invoices: c.invoices.filter(inv => inv.id !== invoiceId) };
        }
        return c;
      }));
    }
  };

  const handleAddPayment = () => {
    if (paymentForm.amount <= 0) return;
    const newPayment: Payment = {
      id: Date.now().toString(),
      date: paymentForm.date,
      amount: paymentForm.amount
    };

    setCustomers(prev => prev.map(c => {
      if (c.id === paymentModal.customerId) {
        return { ...c, payments: [...c.payments, newPayment] };
      }
      return c;
    }));

    setPaymentModal({ isOpen: false, customerId: '' });
  };

  const getBalance = (customer: Customer) => {
    const totalInvoiced = customer.invoices.reduce((acc, inv) => acc + inv.total, 0);
    const totalPaid = customer.payments.reduce((acc, p) => acc + p.amount, 0);
    return totalInvoiced - totalPaid;
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800">إدارة العملاء</h2>
          <p className="text-sm text-gray-500 mt-1 font-bold italic">متابعة مبيعات المخزون الجاهز والتحصيلات المالية</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedCustomerIds.size > 0 && (
            <button onClick={handleBulkDeleteCustomers} className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-3 rounded-xl font-bold hover:bg-red-200 transition-all">
              <Trash className="w-5 h-5" /> حذف المحدد ({selectedCustomerIds.size})
            </button>
          )}
          <button onClick={toggleSelectAllCustomers} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
            {selectedCustomerIds.size === customers.length && customers.length > 0 ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
            {selectedCustomerIds.size === customers.length && customers.length > 0 ? 'إلغاء التحديد' : 'تحديد الكل'}
          </button>
          <button onClick={handleOpenAddCustomer} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black shadow-lg transition-all">
            <PlusCircle className="w-5 h-5" /> إضافة عميل جديد
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ابحث عن عميل بالاسم أو رقم الهاتف..."
          className="block w-full pr-10 pl-4 py-4 border-none rounded-2xl bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center">
            <Users className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-black italic">لا يوجد عملاء مضافون حالياً</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className={`bg-white p-8 rounded-[2.5rem] shadow-xl transition-all relative border-2 ${selectedCustomerIds.has(customer.id) ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-transparent'}`}>
              <button onClick={() => toggleCustomerSelect(customer.id)} className="absolute top-6 left-6 text-indigo-600">
                {selectedCustomerIds.has(customer.id) ? <CheckSquare className="w-7 h-7" /> : <Square className="w-7 h-7 text-gray-200" />}
              </button>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pr-12">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-gray-800">{customer.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-gray-400 font-bold">
                      <Phone className="w-3 h-3" /> {customer.phone || 'بدون رقم'}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEditCustomer(customer)} className="p-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"><Edit className="w-5 h-5" /></button>
                  <button onClick={() => handleDeleteCustomer(customer.id)} className="p-3 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                  <div className="w-[1px] bg-gray-100 mx-2 self-stretch" />
                  <button onClick={() => handleOpenInvoiceModal(customer.id)} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    <FileText className="w-4 h-4" /> فاتورة جديدة
                  </button>
                  <button onClick={() => setPaymentModal({ isOpen: true, customerId: customer.id })} className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl text-sm font-black hover:bg-green-700 transition-all shadow-lg shadow-green-100">
                    <Wallet className="w-4 h-4" /> تحصيل نقدي
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50/50 p-6 rounded-3xl text-center border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-black uppercase mb-1">إجمالي المسحوبات</p>
                  <p className="text-2xl font-black text-gray-800">{customer.invoices.reduce((a, b) => a + b.total, 0).toLocaleString()} <span className="text-xs">ج.م</span></p>
                </div>
                <div className="bg-green-50/50 p-6 rounded-3xl text-center border border-green-100">
                  <p className="text-[10px] text-green-400 font-black uppercase mb-1">إجمالي المحصل</p>
                  <p className="text-2xl font-black text-green-700">{customer.payments.reduce((a, b) => a + b.amount, 0).toLocaleString()} <span className="text-xs">ج.م</span></p>
                </div>
                <div className="bg-red-50/50 p-6 rounded-3xl text-center border border-red-100">
                  <p className="text-[10px] text-red-400 font-black uppercase mb-1">المتبقي (المديونية)</p>
                  <p className="text-3xl font-black text-red-700">{getBalance(customer).toLocaleString()} <span className="text-xs">ج.م</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl p-6 border border-gray-50 shadow-inner">
                  <h5 className="text-xs font-black text-indigo-400 mb-4 border-b pb-2 uppercase tracking-widest flex items-center gap-2"><FileText className="w-4 h-4" /> آخر الفواتير الصادرة</h5>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {customer.invoices.length === 0 ? <p className="text-center py-4 text-xs text-gray-400 italic font-bold">لم تصدر فواتير بعد</p> : 
                      customer.invoices.slice().reverse().map(inv => (
                        <div key={inv.id} className="flex justify-between items-center text-sm p-3 hover:bg-gray-50 rounded-2xl group border border-transparent hover:border-gray-100 transition-all">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 font-bold">{inv.date}</span>
                              <span className="font-black text-gray-800">{inv.total.toLocaleString()} ج.م</span>
                            </div>
                            <span className="text-[10px] text-indigo-500 font-black mt-1">
                              {inv.items[0]?.machineName} • {models.find(m => m.id === inv.items[0]?.modelId)?.name} • {inv.items[0]?.quantity} قطعة
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenInvoiceModal(customer.id, inv)} className="p-2 text-indigo-500 hover:bg-white rounded-xl shadow-sm border border-gray-50"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteInvoice(customer.id, inv.id)} className="p-2 text-red-500 hover:bg-white rounded-xl shadow-sm border border-gray-50"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-50 shadow-inner">
                  <h5 className="text-xs font-black text-green-400 mb-4 border-b pb-2 uppercase tracking-widest flex items-center gap-2"><Wallet className="w-4 h-4" /> سجل التحصيلات</h5>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {customer.payments.length === 0 ? <p className="text-center py-4 text-xs text-gray-400 italic font-bold">لا يوجد تحصيلات مسجلة</p> : 
                      customer.payments.slice().reverse().map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm p-3 hover:bg-gray-50 rounded-2xl group border border-transparent hover:border-gray-100 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-400 font-bold">{p.date}</span>
                            <span className="font-black text-green-600">+{p.amount.toLocaleString()} ج.م</span>
                          </div>
                          <button onClick={() => setCustomers(prev => prev.map(c => c.id === customer.id ? {...c, payments: c.payments.filter(pay => pay.id !== p.id)} : c))} className="opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={customerModal.isOpen} onClose={() => setCustomerModal({ isOpen: false, id: null })} title={customerModal.id ? "تعديل بيانات العميل" : "إضافة عميل جديد"}>
        <div className="space-y-5">
          <div className="space-y-1">
             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-2">اسم العميل بالكامل</label>
             <input type="text" placeholder="الاسم" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} className="w-full px-5 py-4 border rounded-2xl bg-white text-gray-900 font-bold outline-none focus:ring-4 focus:ring-indigo-50" />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-2">رقم الهاتف للتواصل</label>
             <input type="text" placeholder="رقم الموبايل" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} className="w-full px-5 py-4 border rounded-2xl bg-white text-gray-900 font-bold outline-none focus:ring-4 focus:ring-indigo-50" />
          </div>
          <button onClick={handleSaveCustomer} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black shadow-lg hover:bg-indigo-700 transition-all text-lg">حفظ البيانات</button>
        </div>
      </Modal>

      <Modal isOpen={invoiceModal.isOpen} onClose={() => setInvoiceModal({ ...invoiceModal, isOpen: false })} title={invoiceModal.invoiceId ? "تعديل الفاتورة" : "إصدار فاتورة بيع من الجاهز"} maxWidth="2xl">
        <div className="space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-black flex items-center gap-2 animate-pulse"><AlertCircle className="w-5 h-5" />{error}</div>}
          
          <div className="space-y-2">
             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mr-2">تاريخ الفاتورة</label>
             <input type="date" value={invoiceForm.date} onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })} className="w-full px-5 py-4 border rounded-2xl bg-white text-gray-900 font-bold outline-none focus:ring-4 focus:ring-indigo-50" />
          </div>
          
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-2">اختر الإنتاج الجاهز (المصنع - الموديل)</label>
            <select 
              value={invoiceForm.selection}
              onChange={(e) => {
                  setError(null);
                  setInvoiceForm({ ...invoiceForm, selection: e.target.value });
              }}
              className="w-full px-5 py-4 border rounded-2xl bg-white text-gray-900 font-black outline-none focus:ring-4 focus:ring-indigo-50"
            >
              <option value="">-- اختر من المتاح حالياً بالمخزن الجاهز --</option>
              {machineStockOptions.map((opt, i) => (
                <option key={i} value={`${opt.machineName}|${opt.modelId}`}>
                  {opt.machineName}: {opt.modelName} (المتوفر جاهز: {opt.available} قطعة)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mr-2">الكمية المباعة</label>
               <input type="number" placeholder="الكمية" value={invoiceForm.quantity || ''} onChange={(e) => { setError(null); setInvoiceForm({ ...invoiceForm, quantity: parseInt(e.target.value) || 0 }); }} className="w-full px-5 py-4 border rounded-2xl bg-white text-gray-900 font-black text-center text-xl outline-none focus:ring-4 focus:ring-indigo-50" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mr-2">سعر القطعة (ج.م)</label>
               <input type="number" placeholder="السعر" value={invoiceForm.price || ''} onChange={(e) => setInvoiceForm({ ...invoiceForm, price: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 border rounded-2xl bg-white text-gray-900 font-black text-center text-xl outline-none focus:ring-4 focus:ring-indigo-50" />
            </div>
          </div>
          
          <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] text-center border-2 border-dashed border-indigo-100 shadow-inner">
            <p className="text-xs text-indigo-300 font-black uppercase mb-1 tracking-[0.2em]">إجمالي الفاتورة</p>
            <p className="text-5xl font-black text-indigo-700">{(invoiceForm.quantity * invoiceForm.price).toLocaleString()} <span className="text-lg">ج.م</span></p>
          </div>
          
          <button onClick={handleSaveInvoice} className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-xl active:scale-[0.98]">تأكيد وإصدار الفاتورة</button>
        </div>
      </Modal>

      <Modal isOpen={paymentModal.isOpen} onClose={() => setPaymentModal({ ...paymentModal, isOpen: false })} title="تسجيل عملية تحصيل نقدي">
        <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mr-2">تاريخ التحصيل</label>
             <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} className="w-full px-5 py-4 border rounded-2xl bg-white text-gray-900 font-bold outline-none focus:ring-4 focus:ring-indigo-50" />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-green-400 uppercase tracking-widest block text-center mb-2">المبلغ المحصل</label>
             <input type="number" placeholder="المبلغ" value={paymentForm.amount || ''} onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })} className="w-full p-8 text-center text-5xl font-black text-green-600 border-2 border-green-100 rounded-[2.5rem] bg-green-50/30 focus:bg-white outline-none transition-all" />
          </div>
          <button onClick={handleAddPayment} className="w-full bg-green-600 text-white py-6 rounded-[2.5rem] font-black shadow-xl shadow-green-100 text-xl hover:bg-green-700 transition-all active:scale-[0.98]">تأكيد استلام المبلغ</button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomersPage;
