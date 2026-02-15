
import React, { useState } from 'react';
import { WarehouseStock, MaterialType, MaterialSize, WarehouseLog } from '../types';
import Modal from '../components/Modal';
import { PlusCircle, Package, History, Calendar, Trash2, Palette, ChevronRight, Edit, Settings2 } from 'lucide-react';

interface Props {
  stocks: WarehouseStock[];
  setStocks: React.Dispatch<React.SetStateAction<WarehouseStock[]>>;
  logs: WarehouseLog[];
  setLogs: React.Dispatch<React.SetStateAction<WarehouseLog[]>>;
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

const WarehousePage: React.FC<Props> = ({ stocks, setStocks, logs, setLogs }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<{ index: number, count: number } | null>(null);
  
  const [formData, setFormData] = useState<{ type: MaterialType; size: MaterialSize; color: string; count: number }>({
    type: 'عجينة',
    size: 24,
    color: 'أبيض',
    count: 1
  });

  const createLogEntry = (type: MaterialType, size: MaterialSize, color: string, quantity: number) => {
    const newLog: WarehouseLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      type,
      size,
      color,
      quantity
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleAdd = () => {
    setStocks(prev => {
      const existingIdx = prev.findIndex(s => s.type === formData.type && s.size === formData.size && s.color === formData.color);
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], count: next[existingIdx].count + Number(formData.count) };
        return next;
      } else {
        return [...prev, { type: formData.type, size: formData.size, color: formData.color, count: Number(formData.count) }];
      }
    });

    createLogEntry(formData.type, formData.size, formData.color, Number(formData.count));
    setIsModalOpen(false);
  };

  const handleEditStock = (index: number, count: number) => {
    setEditingStock({ index, count });
    setIsEditModalOpen(true);
  };

  const saveEditedStock = () => {
    if (editingStock !== null) {
      const target = stocks[editingStock.index];
      const diff = editingStock.count - target.count;
      
      if (diff !== 0) {
        setStocks(prev => {
          const next = [...prev];
          next[editingStock.index].count = editingStock.count;
          return next;
        });
        
        // Log the adjustment
        createLogEntry(target.type, target.size, target.color, diff);
      }
      
      setIsEditModalOpen(false);
      setEditingStock(null);
    }
  };

  const handleDeleteStock = (index: number) => {
    const target = stocks[index];
    if (target.count === 0) return;

    if (confirm(`هل أنت متأكد من تصفير رصيد ${target.type} مقاس ${target.size} لون ${target.color}؟ سيتم تسجيل عملية خصم بالرصيد الحالي.`)) {
      const diff = -target.count;
      
      setStocks(prev => {
        const next = [...prev];
        next[index].count = 0;
        return next;
      });

      // Log the full deduction
      createLogEntry(target.type, target.size, target.color, diff);
    }
  };

  const deleteLog = (id: string) => {
    if(confirm('هل تريد حذف هذا السجل؟ لاحظ أن حذف السجل لا يؤثر على الأرصدة الحالية.')) {
      setLogs(prev => prev.filter(l => l.id !== id));
    }
  };

  const getColorValue = (name: string) => colorPalette.find(c => c.name === name)?.value || '#CCCCCC';

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-gray-800">إدارة المخزن</h2>
          <p className="text-gray-500 text-sm font-bold mt-1">تتبع الخامات بالألوان والمقاسات</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <PlusCircle className="w-6 h-6" />
          إضافة شكارة جديدة
        </button>
      </div>

      {/* Current Balance Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b flex items-center justify-between bg-gray-50/30">
          <div className="flex items-center gap-3">
            <Package className="w-7 h-7 text-indigo-600" />
            <h3 className="text-2xl font-black text-gray-800">الرصيد المتوفر حالياً</h3>
          </div>
          <span className="text-xs font-black bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full uppercase tracking-widest">
            {stocks.reduce((acc, s) => acc + s.count, 0)} شكارة إجمالاً
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">نوع الخام</th>
                <th className="px-8 py-5">المقاس</th>
                <th className="px-8 py-5">اللون</th>
                <th className="px-8 py-5">الرصيد المتاح</th>
                <th className="px-8 py-5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold italic">لا يوجد رصيد حالي بالمخزن</td>
                </tr>
              ) : (
                stocks.map((item, idx) => (
                  <tr key={idx} className={`hover:bg-indigo-50/10 transition-colors ${item.count === 0 ? 'opacity-40' : ''}`}>
                    <td className="px-8 py-5 font-black text-gray-700">{item.type}</td>
                    <td className="px-8 py-5 font-black text-indigo-600">{item.size}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded-lg border border-gray-200 shadow-inner" 
                          style={{ backgroundColor: getColorValue(item.color) }}
                        />
                        <span className="font-bold text-gray-600">{item.color}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-black ${item.count === 0 ? 'text-gray-300' : 'text-indigo-700'}`}>{item.count}</span>
                        <span className="text-xs text-gray-400 font-bold uppercase">شكارة</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditStock(idx, item.count)}
                          className="p-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="تعديل الرصيد"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStock(idx)}
                          className="p-3 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-red-50 disabled:hover:text-red-500"
                          title="تصفير الرصيد"
                          disabled={item.count === 0}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b flex items-center gap-3">
          <History className="w-7 h-7 text-indigo-600" />
          <h3 className="text-2xl font-black text-gray-800">سجل حركة المخزن</h3>
          <p className="text-xs text-gray-400 font-bold mr-auto">يتم تسجيل كل إضافة أو تسوية يدوية هنا</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">التاريخ والوقت</th>
                <th className="px-8 py-5">النوع</th>
                <th className="px-8 py-5">المقاس</th>
                <th className="px-8 py-5">اللون</th>
                <th className="px-8 py-5">الكمية (+ / -)</th>
                <th className="px-8 py-5 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center text-gray-400 italic font-bold">لم يتم تسجيل أي عمليات بعد</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-8 py-5 text-sm font-bold text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-300" />
                        {log.date}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-indigo-600">{log.type}</td>
                    <td className="px-8 py-5 text-sm font-black">{log.size}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded shadow-inner" style={{ backgroundColor: getColorValue(log.color) }} />
                        <span className="text-sm font-bold">{log.color}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-black">
                      <div className={`flex items-center gap-1 ${log.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.quantity >= 0 ? <PlusCircle className="w-4 h-4 opacity-50" /> : <Trash2 className="w-4 h-4 opacity-50" />}
                        {log.quantity >= 0 ? `+${log.quantity}` : log.quantity}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button onClick={() => deleteLog(log.id)} className="text-gray-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة شكارة للمخزن" maxWidth="3xl">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest mr-2">نوع الخام</label>
              <div className="grid grid-cols-2 gap-3">
                {['عجينة', 'أندي'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFormData({ ...formData, type: t as MaterialType })}
                    className={`py-4 px-6 rounded-2xl border-2 text-md font-black transition-all ${formData.type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100 scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-100'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest mr-2">المقاس</label>
              <div className="grid grid-cols-2 gap-3">
                {[18, 24].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFormData({ ...formData, size: s as MaterialSize })}
                    className={`py-4 px-6 rounded-2xl border-2 text-md font-black transition-all ${formData.size === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100 scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-100'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-widest mr-2">
              <Palette className="w-4 h-4" />
              اختر لون الخام
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-[2rem] border border-gray-100 max-h-[300px] overflow-y-auto custom-scrollbar">
              {colorPalette.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setFormData({ ...formData, color: c.name })}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${formData.color === c.name ? 'bg-white border-indigo-500 shadow-md ring-4 ring-indigo-50' : 'bg-white border-transparent hover:border-gray-200'}`}
                >
                  <div className={`w-5 h-5 rounded shadow-sm flex-shrink-0 ${c.border ? 'border border-gray-200' : ''}`} style={{ backgroundColor: c.value }} />
                  <span className="text-[11px] font-black text-gray-700">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest mr-2">عدد الشكائر</label>
            <input
              type="number"
              min="1"
              value={formData.count || ''}
              onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 0 })}
              className="w-full px-6 py-5 border-2 border-gray-100 rounded-[1.5rem] bg-gray-50 text-gray-900 focus:bg-white focus:border-indigo-500 outline-none transition-all font-black text-2xl shadow-inner text-center"
            />
          </div>

          <button
            onClick={handleAdd}
            className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black mt-4 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-[0.98] text-xl flex items-center justify-center gap-3"
          >
            تأكيد الإضافة للمخزن
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </Modal>

      {/* Edit Stock Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="تعديل الرصيد الحالي" maxWidth="lg">
        <div className="space-y-6 text-center">
           <div className="bg-indigo-50/50 p-6 rounded-[2rem] border-2 border-dashed border-indigo-100">
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">الصنف المحدد</p>
              <h4 className="text-xl font-black text-gray-800">
                {editingStock !== null && stocks[editingStock.index].type} - {editingStock !== null && stocks[editingStock.index].size} - {editingStock !== null && stocks[editingStock.index].color}
              </h4>
           </div>

           <div className="space-y-4">
             <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest">الرصيد الجديد (عدد الشكائر)</label>
             <input
               type="number"
               min="0"
               value={editingStock?.count || 0}
               onChange={(e) => setEditingStock(prev => prev ? { ...prev, count: parseInt(e.target.value) || 0 } : null)}
               className="w-full px-6 py-6 border-2 border-indigo-100 rounded-[2rem] bg-white text-gray-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-black text-5xl text-center shadow-lg"
             />
             <p className="text-[10px] text-gray-400 font-bold">سيتم تسجيل الفرق في سجل حركة المخزن</p>
           </div>

           <div className="flex gap-3">
             <button
               onClick={() => setIsEditModalOpen(false)}
               className="flex-1 bg-gray-100 text-gray-600 py-5 rounded-2xl font-black hover:bg-gray-200 transition-all"
             >
               إلغاء
             </button>
             <button
               onClick={saveEditedStock}
               className="flex-2 bg-indigo-600 text-white py-5 px-10 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               حفظ التعديل
               <ChevronRight className="w-5 h-5" />
             </button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default WarehousePage;
