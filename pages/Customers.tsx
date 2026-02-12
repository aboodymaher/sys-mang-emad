
import React, { useState, useMemo } from 'react';
import { Customer, FabricModel, Invoice, Payment, MachineWork } from '../types';
import Modal from '../components/Modal';
import { PlusCircle, Users, FileText, Wallet, Phone, Trash2, Edit, CheckSquare, Square, Trash, XCircle, Search, Cpu, ArrowLeft } from 'lucide-react';

interface Props {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  models: FabricModel[];
  setModels: React.Dispatch<React.SetStateAction<FabricModel[]>>;
  machines: MachineWork[]; // Added machines to props
}

const CustomersPage: React.FC<Props> = ({ customers, setCustomers, models, setModels, machines }) => {
  const [customerModal, setCustomerModal] = useState({ isOpen: false, id: null as string | null });
  const [invoiceModal, setInvoiceModal] = useState<{ isOpen: boolean, customerId: string, invoiceId: string | null }>({ isOpen: false, customerId: '', invoiceId: null });
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, customerId: string }>({ isOpen: false, customerId: '' });
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' });
  const [invoiceForm, setInvoiceForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    selection: '', // will hold "machineName|modelId"
    quantity: 0, 
    price: 0 
  });
  const [paymentForm, setPaymentForm] = useState({ date: new Date().toISOString().split('T')[0], amount: 0 });

  // Calculate remaining stock per machine and model
  const machineStockOptions = useMemo(() => {
    const options: { machineName: string; modelId: string; modelName: string; available: number }[] = [];
    
    // Group all machines
    const machineNames = Array.from(new Set<string>(machines.map(m => m.machineName)));
    
    machineNames.forEach(mName => {
      models.forEach(model => {
        // Total produced by this machine for this model - updated for new structure
        const totalProduced = machines
          .filter(m => m.machineName === mName)
          .reduce((acc, work) => {
            const entryTotal = work.entries
              .filter(e => e.produced.modelId === model.id)
              .reduce((sum, e) => sum + e.produced.quantity, 0);
            return acc + entryTotal;
          }, 0);

        // Total sold from this machine for this model
        const totalSold = customers.reduce((acc, cust) => {
          return acc + cust.invoices.reduce((accInv, inv) => {
            return accInv + inv.items
              .filter(item => item.modelId === model.id && item.machineName === mName)
              .reduce((sum, item) => sum + item.quantity, 0);
          }, 0);
        }, 0);

        const available = totalProduced - totalSold;
        if (available > 0) {
          options.push({
            machineName: mName,
            modelId: model.id,
            modelName: model.name,
            available
          });
        }
      });
    });
    return options;
  }, [machines, models, customers]);

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
    if (!invoiceForm.selection || invoiceForm.quantity <= 0) return;
    
    const [machineName, modelId] = invoiceForm.selection.split('|');
    const selectedStock = machineStockOptions.find(opt => opt.machineName === machineName && opt.modelId === modelId);

    if (!selectedStock || selectedStock.available < invoiceForm.quantity) {
      if (!invoiceModal.invoiceId) { // Only check stock on new invoices
        alert('الرصيد المتاح من هذا الإنتاج غير كافٍ');
        return;
      }
    }
    
    if (invoiceModal.invoiceId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === invoiceModal.customerId) {
          const updatedInvoices = c.invoices.map(inv => inv.id === invoiceModal.invoiceId ? {
            ...inv,
            date: invoiceForm.date,
            items: [{ modelId, machineName, quantity: invoiceForm.quantity, price: invoiceForm.price }],
            total: invoiceForm.quantity * invoiceForm.price
          } : inv);
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
      
      // Update global stock too for general visibility
      setModels(prev => prev.map(m => m.id === modelId ? { ...m, stockCount: m.stockCount - invoiceForm.quantity } : m));
    }
    setInvoiceModal({ isOpen: false, customerId: '', invoiceId: null });
  };

  const handleDeleteInvoice = (customerId: string, invoiceId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      setCustomers(prev => prev.map(c => {
        if (c.id === customerId) {
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
          <h2 className="text-3xl font-bold text-gray-800">إدارة العملاء</h2>
          <p className="text-sm text-gray-500 mt-1">إجمالي العملاء: {customers.length}</p>
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
          <button onClick={handleOpenAddCustomer} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all">
            <PlusCircle className="w-5 h-5" /> إضافة عميل
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
          className="block w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center">
            <Users className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">لا توجد نتائج</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className={`bg-white p-6 rounded-2xl shadow-sm border transition-all relative ${selectedCustomerIds.has(customer.id) ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/30' : 'border-gray-100'}`}>
              <button onClick={() => toggleCustomerSelect(customer.id)} className="absolute top-4 left-4 text-indigo-600">
                {selectedCustomerIds.has(customer.id) ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6 text-gray-300" />}
              </button>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pr-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">{customer.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Phone className="w-3 h-3" /> {customer.phone}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEditCustomer(customer)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                  <button onClick={() => handleDeleteCustomer(customer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                  <div className="w-[1px] bg-gray-200 mx-2 self-stretch" />
                  <button onClick={() => handleOpenInvoiceModal(customer.id)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100">
                    <FileText className="w-4 h-4" /> إضافة فاتورة
                  </button>
                  <button onClick={() => setPaymentModal({ isOpen: true, customerId: customer.id })} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold hover:bg-green-100">
                    <Wallet className="w-4 h-4" /> تحصيل
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <p className="text-xs text-gray-400 font-bold mb-1">إجمالي الفواتير</p>
                  <p className="text-lg font-bold text-gray-700">{customer.invoices.reduce((a, b) => a + b.total, 0).toLocaleString()} ج.م</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <p className="text-xs text-green-600 font-bold mb-1">إجمالي المحصل</p>
                  <p className="text-lg font-bold text-green-700">{customer.payments.reduce((a, b) => a + b.amount, 0).toLocaleString()} ج.م</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl text-center">
                  <p className="text-xs text-red-600 font-bold mb-1">المتبقي</p>
                  <p className="text-xl font-bold text-red-700">{getBalance(customer).toLocaleString()} ج.م</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-bold text-gray-500 mb-3 border-b pb-1">آخر الفواتير</h5>
                  <div className="space-y-2">
                    {customer.invoices.length === 0 ? <p className="text-xs text-gray-400 italic">لا توجد فواتير</p> : 
                      customer.invoices.slice(-5).reverse().map(inv => (
                        <div key={inv.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded group">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">{inv.date}</span>
                              <span className="font-bold">{inv.total} ج.م</span>
                            </div>
                            <span className="text-[10px] text-indigo-500 font-bold">
                              {inv.items[0]?.machineName} - {models.find(m => m.id === inv.items[0]?.modelId)?.name}
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenInvoiceModal(customer.id, inv)} className="p-1 text-indigo-500 hover:bg-indigo-100 rounded"><Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteInvoice(customer.id, inv.id)} className="p-1 text-red-500 hover:bg-red-100 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-gray-500 mb-3 border-b pb-1">آخر التحصيلات</h5>
                  <div className="space-y-2">
                    {customer.payments.length === 0 ? <p className="text-xs text-gray-400 italic">لا توجد تحصيلات</p> : 
                      customer.payments.slice(-5).reverse().map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded group">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">{p.date}</span>
                            <span className="font-bold text-green-600">+{p.amount} ج.م</span>
                          </div>
                          <button onClick={() => setCustomers(prev => prev.map(c => c.id === customer.id ? {...c, payments: c.payments.filter(pay => pay.id !== p.id)} : c))} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 rounded"><XCircle className="w-3.5 h-3.5" /></button>
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

      <Modal isOpen={customerModal.isOpen} onClose={() => setCustomerModal({ isOpen: false, id: null })} title={customerModal.id ? "تعديل عميل" : "إضافة عميل"}>
        <div className="space-y-4">
          <input type="text" placeholder="الاسم" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900 outline-none" />
          <input type="text" placeholder="رقم الهاتف" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900 outline-none" />
          <button onClick={handleSaveCustomer} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">حفظ</button>
        </div>
      </Modal>

      <Modal isOpen={invoiceModal.isOpen} onClose={() => setInvoiceModal({ ...invoiceModal, isOpen: false })} title={invoiceModal.invoiceId ? "تعديل فاتورة" : "إصدار فاتورة"}>
        <div className="space-y-4">
          <input type="date" value={invoiceForm.date} onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900 outline-none" />
          
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-500 uppercase">اختر الإنتاج (الماكينة - الموديل)</label>
            <select 
              value={invoiceForm.selection}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, selection: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900 outline-none text-sm"
            >
              <option value="">-- اختر من إنتاج الماكينات --</option>
              {machineStockOptions.map((opt, i) => (
                <option key={i} value={`${opt.machineName}|${opt.modelId}`}>
                  {opt.machineName}: {opt.modelName} (المتوفر: {opt.available})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="الكمية" value={invoiceForm.quantity || ''} onChange={(e) => setInvoiceForm({ ...invoiceForm, quantity: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900 outline-none" />
            <input type="number" placeholder="السعر" value={invoiceForm.price || ''} onChange={(e) => setInvoiceForm({ ...invoiceForm, price: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900 outline-none" />
          </div>
          
          <div className="p-4 bg-gray-50 rounded-xl text-center border">
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">الإجمالي</p>
            <p className="text-2xl font-bold text-indigo-700">{(invoiceForm.quantity * invoiceForm.price).toLocaleString()} ج.م</p>
          </div>
          <button onClick={handleSaveInvoice} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">تأكيد</button>
        </div>
      </Modal>

      <Modal isOpen={paymentModal.isOpen} onClose={() => setPaymentModal({ ...paymentModal, isOpen: false })} title="تحصيل مبلغ">
        <div className="space-y-4">
          <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900 outline-none" />
          <input type="number" placeholder="المبلغ" value={paymentForm.amount || ''} onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900 outline-none text-2xl text-center font-bold text-green-600" />
          <button onClick={handleAddPayment} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">تأكيد التحصيل</button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomersPage;
