
import React, { useState } from 'react';
import { ProcessingWork, FabricModel, ProcessingEntry } from '../types';
import Modal from '../components/Modal';
import { 
  PlusCircle, 
  Search, 
  Scissors, 
  Trash2, 
  Edit, 
  AlertTriangle, 
  Plus, 
  Trash, 
  ArrowLeft,
  Calendar,
  Layers,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface Props {
  processing: ProcessingWork[];
  setProcessing: React.Dispatch<React.SetStateAction<ProcessingWork[]>>;
  models: FabricModel[];
  setModels: React.Dispatch<React.SetStateAction<FabricModel[]>>;
}

const ProcessingPage: React.FC<Props> = ({ processing, setProcessing, models, setModels }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mainInfo, setMainInfo] = useState({
    machineName: '',
    date: new Date().toLocaleDateString('ar-EG')
  });

  const [entries, setEntries] = useState<ProcessingEntry[]>([
    { modelId: '', quantitySent: 0, quantityReceived: 0, price: 0 }
  ]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setMainInfo({
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
      machineName: work.machineName,
      date: work.date
    });
    setEntries(JSON.parse(JSON.stringify(work.entries)));
    setIsModalOpen(true);
    setError(null);
  };

  const addEntry = () => setEntries([...entries, { modelId: '', quantitySent: 0, quantityReceived: 0, price: 0 }]);
  
  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof ProcessingEntry, value: any) => {
    setEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        if (field === 'quantitySent') {
          // Validation: Check if it exceeds available stock considering other entries
          const model = models.find(m => m.id === entry.modelId);
          if (model) {
            const otherEntriesSent = prev
              .filter((_, idx) => idx !== index && prev[idx].modelId === entry.modelId)
              .reduce((sum, e) => sum + e.quantitySent, 0);
            
            const realAvailable = editingId 
              ? model.stockCount + (processing.find(p => p.id === editingId)?.entries.find(e => e.modelId === entry.modelId)?.quantitySent || 0) - otherEntriesSent
              : model.stockCount - otherEntriesSent;

            if (value > realAvailable) {
              setError(`الكمية المدخلة (${value}) تتجاوز الرصيد المتاح حالياً (${realAvailable}) لهذا الموديل`);
              return { ...entry, [field]: realAvailable };
            } else {
              setError(null);
            }
          }
        }
        return { ...entry, [field]: value };
      }
      return entry;
    }));
  };

  const handleSave = () => {
    if (!mainInfo.machineName || entries.some(e => !e.modelId)) {
      setError('يرجى التأكد من ملء اسم المكنة واختيار الموديلات لكل سطر');
      return;
    }

    if (editingId) {
      const oldWork = processing.find(p => p.id === editingId);
      setModels(prev => prev.map(m => {
        const oldSent = oldWork?.entries.find(e => e.modelId === m.id)?.quantitySent || 0;
        const newSent = entries.filter(e => e.modelId === m.id).reduce((sum, e) => sum + e.quantitySent, 0);
        return { ...m, stockCount: m.stockCount + oldSent - newSent };
      }));

      setProcessing(prev => prev.map(p => p.id === editingId ? {
        ...p,
        machineName: mainInfo.machineName,
        date: mainInfo.date,
        entries: JSON.parse(JSON.stringify(entries))
      } : p));
    } else {
      // Update models stock globally
      setModels(prev => prev.map(m => {
        const totalSentForModel = entries
          .filter(e => e.modelId === m.id)
          .reduce((sum, e) => sum + e.quantitySent, 0);
        return { ...m, stockCount: m.stockCount - totalSentForModel };
      }));

      const newWork: ProcessingWork = {
        id: Date.now().toString(),
        machineName: mainInfo.machineName,
        date: mainInfo.date,
        entries: JSON.parse(JSON.stringify(entries))
      };
      setProcessing([newWork, ...processing]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟ سيتم إعادة الكميات المسلمة للمخزن.')) {
      const workToDelete = processing.find(p => p.id === id);
      if (workToDelete) {
        setModels(prev => prev.map(m => {
          const sentBack = workToDelete.entries.find(e => e.modelId === m.id)?.quantitySent || 0;
          return { ...m, stockCount: m.stockCount + sentBack };
        }));
      }
      setProcessing(prev => prev.filter(p => p.id !== id));
    }
  };

  const filteredProcessing = processing.filter(p => 
    p.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.entries.some(e => models.find(m => m.id === e.modelId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 flex items-center gap-3">
            <Scissors className="w-10 h-10 text-indigo-600" />
            التجهيز
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-semibold">متابعة ماكينات التجهيز والتشطيب</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          <PlusCircle className="w-5 h-5" />
          إضافة ماكينة تجهيز
        </button>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ابحث عن مكنة تجهيز أو موديل..."
          className="block w-full pr-12 pl-4 py-4 border-none rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm transition-all text-lg font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[900px]">
            <thead className="bg-gray-50/50 border-b">
              <tr>
                <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">التاريخ</th>
                <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">مكنة التجهيز</th>
                <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">تفاصيل التجهيز</th>
                <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProcessing.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-400 font-bold italic">لا توجد سجلات تجهيز حالية</td>
                </tr>
              ) : (
                filteredProcessing.map((work) => (
                  <tr key={work.id} className="hover:bg-indigo-50/10 transition-colors">
                    <td className="px-6 py-5 text-sm font-bold text-gray-600">{work.date}</td>
                    <td className="px-6 py-5 font-black text-indigo-700 text-lg">{work.machineName}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        {work.entries.map((entry, idx) => {
                          const model = models.find(m => m.id === entry.modelId);
                          return (
                            <div key={idx} className="flex items-center gap-4 text-sm bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                              <span className="font-black text-indigo-600 min-w-[120px]">{model?.name || '---'}</span>
                              <div className="flex items-center gap-3 text-xs text-gray-500 font-bold">
                                <span>مسلم: <span className="text-orange-600">{entry.quantitySent}</span></span>
                                <ArrowLeft className="w-3 h-3" />
                                <span>مستلم: <span className="text-green-600">{entry.quantityReceived}</span></span>
                              </div>
                              <div className="mr-auto font-black text-gray-400">
                                {entry.price} ج.م
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => handleOpenEdit(work)} className="p-3 text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all shadow-sm bg-indigo-50/50"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(work.id)} className="p-3 text-red-600 hover:bg-red-100 rounded-2xl transition-all shadow-sm bg-red-50/50"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "تعديل سجل تجهيز" : "إضافة ماكينة تجهيز"} maxWidth="4xl">
        <div className="space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-5 rounded-3xl flex items-center gap-4 text-md font-black border border-red-100 animate-in slide-in-from-top-4 duration-300">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-2">اسم المكنة (التجهيز)</label>
              <div className="relative group">
                <Scissors className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="اسم مكنة التجهيز"
                  value={mainInfo.machineName}
                  onChange={(e) => setMainInfo({ ...mainInfo, machineName: e.target.value })}
                  className="w-full pr-4 pl-12 py-4 border-2 border-gray-100 rounded-2xl bg-white text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-2">التاريخ</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={mainInfo.date}
                  onChange={(e) => setMainInfo({ ...mainInfo, date: e.target.value })}
                  className="w-full pr-4 pl-12 py-4 border-2 border-gray-100 rounded-2xl bg-white text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h5 className="text-xl font-black text-gray-800 flex items-center gap-3">
                <Layers className="w-6 h-6 text-indigo-500" />
                الموديلات قيد التجهيز
              </h5>
              <button 
                onClick={addEntry} 
                className="group flex items-center gap-2 text-sm bg-indigo-600 text-white px-5 py-3 rounded-2xl hover:bg-indigo-700 font-black transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                إضافة سطر تجهيز
              </button>
            </div>

            <div className="space-y-4">
              {entries.map((entry, index) => {
                // Calculate dynamic available stock for this specific row
                const currentModel = models.find(m => m.id === entry.modelId);
                const otherEntriesTotalSent = entries
                  .filter((e, idx) => idx !== index && e.modelId === entry.modelId)
                  .reduce((sum, e) => sum + e.quantitySent, 0);
                
                // If editing, we should account for the original stock this entry already had
                const originalWork = editingId ? processing.find(p => p.id === editingId) : null;
                const originalEntrySent = originalWork?.entries.find(e => e.modelId === entry.modelId)?.quantitySent || 0;
                
                const dynamicAvailable = currentModel 
                  ? currentModel.stockCount + originalEntrySent - otherEntriesTotalSent 
                  : 0;

                return (
                  <div key={index} className="bg-gray-50/50 rounded-[2.5rem] p-6 border-2 border-gray-100 relative hover:border-indigo-200 transition-all shadow-sm">
                    <button 
                      onClick={() => removeEntry(index)} 
                      disabled={entries.length === 1} 
                      className="absolute -top-3 -left-3 bg-white text-red-500 p-2 rounded-xl hover:bg-red-50 disabled:opacity-0 transition-all shadow-xl border border-gray-100 z-10"
                    >
                      <Trash className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-4 space-y-2">
                        <label className="text-[10px] text-gray-400 font-black mr-1 uppercase">الموديل (المتوفر في الإنتاج)</label>
                        <select 
                          value={entry.modelId} 
                          onChange={(e) => updateEntry(index, 'modelId', e.target.value)}
                          className="w-full p-3 border-2 border-white rounded-xl bg-white text-gray-900 font-black shadow-sm outline-none focus:border-indigo-500"
                        >
                          <option value="">اختر الموديل...</option>
                          {models.map(m => {
                            const otherSent = entries
                              .filter((e, idx) => idx !== index && e.modelId === m.id)
                              .reduce((sum, e) => sum + e.quantitySent, 0);
                            const origSent = originalWork?.entries.find(e => e.modelId === m.id)?.quantitySent || 0;
                            const availableNow = m.stockCount + origSent - otherSent;
                            
                            return (
                              <option key={m.id} value={m.id} disabled={availableNow <= 0 && entry.modelId !== m.id}>
                                {m.name} (المتاح: {availableNow})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] text-gray-400 font-black mr-1 uppercase text-orange-600">المسلم (قطعة)</label>
                        <input
                          type="number"
                          placeholder="٠"
                          value={entry.quantitySent || ''}
                          onChange={(e) => updateEntry(index, 'quantitySent', parseInt(e.target.value) || 0)}
                          className="w-full p-3 border-2 border-white rounded-xl bg-white text-orange-700 font-black shadow-sm outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] text-gray-400 font-black mr-1 uppercase text-green-600">المستلم (قطعة)</label>
                        <input
                          type="number"
                          placeholder="٠"
                          value={entry.quantityReceived || ''}
                          onChange={(e) => updateEntry(index, 'quantityReceived', parseInt(e.target.value) || 0)}
                          className="w-full p-3 border-2 border-white rounded-xl bg-white text-green-700 font-black shadow-sm outline-none focus:border-green-500"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] text-gray-400 font-black mr-1 uppercase">السعر (ج.م)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                          <input
                            type="number"
                            placeholder="٠"
                            value={entry.price || ''}
                            onChange={(e) => updateEntry(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full p-3 pl-8 border-2 border-white rounded-xl bg-white text-gray-700 font-black shadow-sm outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 flex justify-center pb-2">
                        <div className={`p-2 rounded-full ${entry.quantityReceived >= entry.quantitySent && entry.quantitySent > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-300'}`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-xl active:scale-[0.98]"
          >
            {editingId ? "حفظ التعديلات" : "تأكيد وتسجيل عملية التجهيز"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProcessingPage;
