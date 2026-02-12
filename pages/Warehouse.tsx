
import React, { useState } from 'react';
import { WarehouseStock, MaterialType, MaterialSize, WarehouseLog } from '../types';
import Modal from '../components/Modal';
import { PlusCircle, Package, History, Calendar, Trash2 } from 'lucide-react';

interface Props {
  stocks: WarehouseStock[];
  setStocks: React.Dispatch<React.SetStateAction<WarehouseStock[]>>;
  logs: WarehouseLog[];
  setLogs: React.Dispatch<React.SetStateAction<WarehouseLog[]>>;
}

const WarehousePage: React.FC<Props> = ({ stocks, setStocks, logs, setLogs }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{ type: MaterialType; size: MaterialSize; count: number }>({
    type: 'عجينة',
    size: 24,
    count: 1
  });

  const handleAdd = () => {
    // Update Stocks
    setStocks(prev => prev.map(item => {
      if (item.type === formData.type && item.size === formData.size) {
        return { ...item, count: item.count + Number(formData.count) };
      }
      return item;
    }));

    // Add Log entry
    const newLog: WarehouseLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      type: formData.type,
      size: formData.size,
      quantity: Number(formData.count)
    };
    setLogs(prev => [newLog, ...prev]);

    setIsModalOpen(false);
  };

  const deleteLog = (id: string) => {
    if(confirm('هل تريد حذف هذا السجل؟ لن يتأثر الرصيد الحالي.')) {
      setLogs(prev => prev.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">رصيد المخزن</h2>
          <p className="text-gray-500 text-sm">إدارة وتتبع الشكائر والمواد الخام</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          إضافة شكارة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stocks.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center group hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Package className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-gray-500">{item.type} - {item.size}</h4>
            <p className="text-4xl font-black text-indigo-700 mt-2">{item.count}</p>
            <span className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-wider">شكارة متوفرة</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b flex items-center gap-3">
          <History className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-bold text-gray-800">سجل الإضافات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">النوع</th>
                <th className="px-6 py-4">المقاس</th>
                <th className="px-6 py-4">الكمية</th>
                <th className="px-6 py-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">لا توجد عمليات إضافة مسجلة</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-gray-300" />
                      {log.date}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{log.type}</td>
                    <td className="px-6 py-4 text-sm font-bold">{log.size}</td>
                    <td className="px-6 py-4 text-sm font-black text-green-600">+{log.quantity}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => deleteLog(log.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة رصيد خام">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">النوع</label>
            <div className="grid grid-cols-2 gap-2">
              {['عجينة', 'أندي'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFormData({ ...formData, type: t as MaterialType })}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${formData.type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">المقاس</label>
            <div className="grid grid-cols-2 gap-2">
              {[18, 24].map((s) => (
                <button
                  key={s}
                  onClick={() => setFormData({ ...formData, size: s as MaterialSize })}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${formData.size === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">عدد الشكائر المضافة</label>
            <input
              type="number"
              min="1"
              value={formData.count}
              onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-lg"
            />
          </div>

          <button
            onClick={handleAdd}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black mt-4 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            تأكيد الإضافة للمخزن
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default WarehousePage;
