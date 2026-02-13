
import React, { useState } from 'react';
import { MachineWork, WarehouseStock, FabricModel, MaterialType, MaterialSize, ProductionEntry } from '../types';
import Modal from '../components/Modal';
import { PlusCircle, AlertTriangle, Trash2, Edit, CheckSquare, Square, Trash, Plus, Search, ArrowLeft, Cpu, History, Layers, Palette } from 'lucide-react';

interface Props {
  stocks: WarehouseStock[];
  setStocks: React.Dispatch<React.SetStateAction<WarehouseStock[]>>;
  models: FabricModel[];
  setModels: React.Dispatch<React.SetStateAction<FabricModel[]>>;
  machines: MachineWork[];
  setMachines: React.Dispatch<React.SetStateAction<MachineWork[]>>;
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

const MachinesPage: React.FC<Props> = ({ stocks, setStocks, models, setModels, machines, setMachines }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const [mainInfo, setMainInfo] = useState({
    machineName: '',
    date: new Date().toLocaleDateString('ar-EG')
  });

  const [entries, setEntries] = useState<ProductionEntry[]>([
    {
      raw: { type: 'عجينة', size: 24, color: '', quantity: 1 },
      produced: { modelId: '', quantity: 0, price: 0 }
    }
  ]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setMainInfo({
      machineName: '',
      date: new Date().toLocaleDateString('ar-EG')
    });
    setEntries([{
      raw: { type: 'عجينة', size: 24, color: '', quantity: 1 },
      produced: { modelId: '', quantity: 0, price: 0 }
    }]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (work: MachineWork) => {
    setEditingId(work.id);
    setMainInfo({
      machineName: work.machineName,
      date: work.date
    });
    setEntries(JSON.parse(JSON.stringify(work.entries)));
    setIsModalOpen(true);
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

  const handleSaveWork = () => {
    if (!mainInfo.machineName || entries.some(e => !e.produced.modelId || !e.raw.color)) {
      setError('يرجى التأكد من ملء اسم المكنة واختيار الموديلات والألوان لكل سطر إنتاج');
      return;
    }

    const newRequiredRaw: Record<string, number> = {};
    entries.forEach(e => {
      const key = `${e.raw.type}-${e.raw.size}-${e.raw.color}`;
      newRequiredRaw[key] = (newRequiredRaw[key] || 0) + Number(e.raw.quantity);
    });

    if (!editingId) {
      for (const [key, qty] of Object.entries(newRequiredRaw)) {
        const [type, size, color] = key.split('-');
        const targetStock = stocks.find(s => s.type === type && s.size === parseInt(size) && s.color === color);
        if (!targetStock || targetStock.count < qty) {
          setError(`الرصيد في المخزن غير كافٍ للنوع ${type} مقاس ${size} لون ${color}`);
          return;
        }
      }

      setStocks(prev => prev.map(s => {
        const key = `${s.type}-${s.size}-${s.color}`;
        return newRequiredRaw[key] ? { ...s, count: s.count - newRequiredRaw[key] } : s;
      }));

      setModels(prev => {
        const updatedModels = [...prev];
        entries.forEach(e => {
          const idx = updatedModels.findIndex(m => m.id === e.produced.modelId);
          if (idx !== -1) {
            updatedModels[idx] = { ...updatedModels[idx], stockCount: updatedModels[idx].stockCount + Number(e.produced.quantity) };
          }
        });
        return updatedModels;
      });
      
      const newWork: MachineWork = {
        id: Date.now().toString(),
        machineName: mainInfo.machineName,
        date: mainInfo.date,
        entries: JSON.parse(JSON.stringify(entries))
      };
      setMachines([newWork, ...machines]);
    } else {
      const oldWork = machines.find(m => m.id === editingId);
      if (oldWork) {
        setStocks(prev => {
          let revertStocks = [...prev];
          oldWork.entries.forEach(e => {
            const idx = revertStocks.findIndex(s => s.type === e.raw.type && s.size === e.raw.size && s.color === e.raw.color);
            if(idx !== -1) revertStocks[idx].count += e.raw.quantity;
            else revertStocks.push({ type: e.raw.type, size: e.raw.size, color: e.raw.color, count: e.raw.quantity });
          });
          
          return revertStocks.map(s => {
            const key = `${s.type}-${s.size}-${s.color}`;
            return newRequiredRaw[key] ? { ...s, count: s.count - newRequiredRaw[key] } : s;
          });
        });

        setModels(prev => {
          let updatedModels = [...prev];
          oldWork.entries.forEach(e => {
            const idx = updatedModels.findIndex(m => m.id === e.produced.modelId);
            if (idx !== -1) updatedModels[idx].stockCount -= e.produced.quantity;
          });
          entries.forEach(e => {
            const idx = updatedModels.findIndex(m => m.id === e.produced.modelId);
            if (idx !== -1) updatedModels[idx].stockCount += Number(e.produced.quantity);
          });
          return updatedModels;
        });
      }

      setMachines(prev => prev.map(m => m.id === editingId ? {
        ...m,
        machineName: mainInfo.machineName,
        date: mainInfo.date,
        entries: JSON.parse(JSON.stringify(entries))
      } : m));
    }

    setIsModalOpen(false);
    setError(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      setMachines(prev => prev.filter(m => m.id !== id));
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
    }
  };

  const filteredMachines = machines.filter(m => {
    const machineMatch = m.machineName.toLowerCase().includes(searchTerm.toLowerCase());
    const modelMatch = m.entries.some(e => {
      const model = models.find(mod => mod.id === e.produced.modelId);
      return model?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
    return machineMatch || modelMatch;
  });

  const getColorValue = (name: string) => colorPalette.find(c => c.name === name)?.value || '#CCCCCC';

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 flex items-center gap-3">
            <Cpu className="w-10 h-10 text-indigo-600" />
            شغل المكن
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-semibold">تتبع الإنتاج اليومي وتوزيع الخامات</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={() => {
                if(confirm(`حذف ${selectedIds.size} سجل؟`)) {
                  setMachines(prev => prev.filter(m => !selectedIds.has(m.id)));
                  setSelectedIds(new Set());
                }
              }}
              className="flex items-center gap-2 bg-red-100 text-red-700 px-6 py-3 rounded-2xl font-bold hover:bg-red-200 shadow-sm transition-all"
            >
              <Trash className="w-5 h-5" />
              حذف المحدد
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all transform hover:-translate-y-1 active:translate-y-0"
          >
            <PlusCircle className="w-5 h-5" />
            إضافة شغل مكنة
          </button>
        </div>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ابحث عن مكنة أو موديل منتج..."
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
                <th className="px-6 py-5 w-16 text-center">
                  <button onClick={() => {
                    if (selectedIds.size === machines.length && machines.length > 0) setSelectedIds(new Set());
                    else setSelectedIds(new Set(machines.map(m => m.id)));
                  }} className="text-indigo-600 transition-transform hover:scale-110">
                    {selectedIds.size === machines.length && machines.length > 0 ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6 text-gray-300" />}
                  </button>
                </th>
                <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">التاريخ</th>
                <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">المكنة</th>
                <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">التشغيل (خام ← إنتاج)</th>
                <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMachines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold italic">لا توجد سجلات تشغيل حالية</td>
                </tr>
              ) : (
                filteredMachines.map((work) => (
                  <tr key={work.id} className={`hover:bg-indigo-50/10 transition-colors ${selectedIds.has(work.id) ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => {
                        const next = new Set(selectedIds);
                        if (next.has(work.id)) next.delete(work.id); else next.add(work.id);
                        setSelectedIds(next);
                      }} className="text-indigo-600 transition-transform hover:scale-110">
                        {selectedIds.has(work.id) ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6 text-gray-300" />}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-gray-600">{work.date}</td>
                    <td className="px-6 py-5 font-black text-indigo-700 text-lg">{work.machineName}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        {work.entries.map((entry, idx) => {
                          const model = models.find(m => m.id === entry.produced.modelId);
                          return (
                            <div key={idx} className="flex items-center gap-4 text-sm bg-gray-50/80 px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-indigo-600 text-base">{entry.raw.quantity}</span>
                                <span className="text-gray-400 font-bold">{entry.raw.type} ({entry.raw.size})</span>
                                <div className="w-3 h-3 rounded shadow-inner" style={{ backgroundColor: getColorValue(entry.raw.color) }} />
                              </div>
                              <ArrowLeft className="w-5 h-5 text-indigo-400 font-black" />
                              <div className="flex items-center gap-2">
                                <span className="font-black text-green-600 text-base">{entry.produced.quantity}</span>
                                <span className="text-gray-700 font-black">{model?.name || '---'}</span>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "تعديل سجل تشغيل" : "إضافة شغل مكنة جديد"} maxWidth="4xl">
        <div className="space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-5 rounded-3xl flex items-center gap-4 text-md font-black border border-red-100 animate-in slide-in-from-top-4 duration-300">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-2">اسم المكنة</label>
              <div className="relative group">
                <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="رقم أو اسم المكنة"
                  value={mainInfo.machineName}
                  onChange={(e) => setMainInfo({ ...mainInfo, machineName: e.target.value })}
                  className="w-full pr-4 pl-12 py-4 border-2 border-gray-100 rounded-2xl bg-white text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-2">تاريخ التشغيل</label>
              <div className="relative group">
                <History className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
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
                تفاصيل العمليات
              </h5>
              <button 
                onClick={addEntry} 
                className="group flex items-center gap-2 text-sm bg-indigo-600 text-white px-5 py-3 rounded-2xl hover:bg-indigo-700 font-black transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                إضافة سطر تشغيل
              </button>
            </div>

            <div className="space-y-6">
              {entries.map((entry, index) => {
                const availableStockColors = Array.from(new Set<string>(
                  stocks
                    .filter(s => s.type === entry.raw.type && s.size === entry.raw.size && s.count > 0)
                    .map(s => s.color)
                ));

                return (
                  <div key={index} className="bg-gray-50/50 rounded-[2.5rem] p-8 border-2 border-gray-100 relative hover:border-indigo-200 transition-all shadow-sm">
                    <button 
                      onClick={() => removeEntry(index)} 
                      disabled={entries.length === 1} 
                      className="absolute -top-3 -left-3 bg-white text-red-500 p-3 rounded-2xl hover:bg-red-50 disabled:opacity-0 transition-all shadow-xl border border-gray-100 z-10 active:scale-90"
                      title="حذف هذه العملية"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col gap-8">
                      <div className="space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs">١</div>
                          <h6 className="text-sm font-black text-indigo-500 uppercase tracking-widest">المواد الخام المستهلكة</h6>
                        </div>
                        
                        <div className="space-y-6">
                          {/* Row 1: Type and Size */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] text-gray-400 font-black mr-1 uppercase">النوع</label>
                              <select 
                                value={entry.raw.type} 
                                onChange={(e) => updateEntryRaw(index, 'type', e.target.value as MaterialType)}
                                className="w-full p-4 border-2 border-white rounded-2xl bg-white text-gray-900 font-black shadow-sm"
                              >
                                <option value="عجينة">عجينة</option>
                                <option value="أندي">أندي</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] text-gray-400 font-black mr-1 uppercase">المقاس</label>
                              <select 
                                value={entry.raw.size} 
                                onChange={(e) => updateEntryRaw(index, 'size', parseInt(e.target.value) as MaterialSize)}
                                className="w-full p-4 border-2 border-white rounded-2xl bg-white text-gray-900 font-black shadow-sm"
                              >
                                <option value={18}>18</option>
                                <option value={24}>24</option>
                              </select>
                            </div>
                          </div>

                          {/* Row 2: Color Dropdown and Quantity */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                              <label className="text-[10px] text-gray-400 font-black mr-1 uppercase tracking-widest flex items-center gap-1">
                                <Palette className="w-3 h-3" /> اللون المتوفر
                              </label>
                              <div className="relative">
                                {/* Square preview on the RIGHT of the text (Right edge of box) */}
                                <div 
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg border border-gray-100 shadow-sm z-10" 
                                  style={{ backgroundColor: getColorValue(entry.raw.color) }}
                                />
                                <select 
                                  value={entry.raw.color} 
                                  onChange={(e) => updateEntryRaw(index, 'color', e.target.value)}
                                  // pr-12 to make space for the square on the right
                                  className={`w-full p-4 pr-12 border-2 border-white rounded-2xl bg-white text-gray-900 font-black shadow-sm ${availableStockColors.length === 0 ? 'border-red-100 text-red-400' : ''}`}
                                >
                                  <option value="">اختر اللون من المخزن...</option>
                                  {availableStockColors.map(colorName => (
                                    <option key={colorName} value={colorName}>{colorName}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] text-gray-400 font-black mr-1 uppercase">الكمية (شكارة)</label>
                              <input
                                type="number"
                                placeholder="٠"
                                value={entry.raw.quantity || ''}
                                onChange={(e) => updateEntryRaw(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-full p-4 border-2 border-white rounded-2xl bg-white text-indigo-700 font-black text-xl shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 opacity-30">
                        <div className="flex-1 h-[2px] bg-indigo-300"></div>
                        <Layers className="w-5 h-5 text-indigo-400" />
                        <div className="flex-1 h-[2px] bg-indigo-300"></div>
                      </div>

                      <div className="space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black text-xs">٢</div>
                          <h6 className="text-sm font-black text-green-500 uppercase tracking-widest">الإنتاج المستخرج</h6>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2 col-span-1 sm:col-span-2">
                            <label className="text-[10px] text-gray-400 font-black mr-1 uppercase">الموديل المنتج</label>
                            <select 
                              value={entry.produced.modelId} 
                              onChange={(e) => updateEntryProduced(index, 'modelId', e.target.value)}
                              className="w-full p-4 border-2 border-white rounded-2xl bg-white text-gray-900 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all font-black shadow-sm"
                            >
                              <option value="">اختر الموديل...</option>
                              {models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 font-black mr-1 uppercase">الكمية (قطعة)</label>
                            <input
                              type="number"
                              placeholder="٠"
                              value={entry.produced.quantity || ''}
                              onChange={(e) => updateEntryProduced(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-full p-4 border-2 border-white rounded-2xl bg-white text-green-700 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all font-black text-xl shadow-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 font-black mr-1 uppercase tracking-widest">السعر (ج.م)</label>
                            <input
                              type="number"
                              placeholder="٠"
                              value={entry.produced.price || ''}
                              onChange={(e) => updateEntryProduced(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full p-4 border-2 border-white rounded-2xl bg-white text-gray-900 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all font-bold shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSaveWork}
            className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-xl active:scale-[0.98]"
          >
            {editingId ? "حفظ التعديلات وتحديث المخزون" : "تأكيد العملية وتسجيل الإنتاج"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default MachinesPage;
