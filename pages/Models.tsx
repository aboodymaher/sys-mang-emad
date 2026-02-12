
import React, { useState } from 'react';
import { FabricModel, MachineWork } from '../types';
import Modal from '../components/Modal';
import { PlusCircle, Scissors, Trash2, Edit, CheckSquare, Square, Trash, Search, History, Calendar, Cpu, ArrowLeft } from 'lucide-react';

interface Props {
  models: FabricModel[];
  setModels: React.Dispatch<React.SetStateAction<FabricModel[]>>;
  machines: MachineWork[];
}

const ModelsPage: React.FC<Props> = ({ models, setModels, machines }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean, model: FabricModel | null }>({ isOpen: false, model: null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<FabricModel, 'id' | 'stockCount'>>({
    name: '',
    code: '',
    length: 0,
    width: 0,
    sleeveLength: 0,
    sleeveWidth: 0,
    neckType: ''
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', code: '', length: 0, width: 0, sleeveLength: 0, sleeveWidth: 0, neckType: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (model: FabricModel) => {
    setEditingId(model.id);
    setFormData({
      name: model.name,
      code: model.code,
      length: model.length,
      width: model.width,
      sleeveLength: model.sleeveLength,
      sleeveWidth: model.sleeveWidth,
      neckType: model.neckType
    });
    setIsModalOpen(true);
  };

  const handleOpenHistory = (model: FabricModel) => {
    setHistoryModal({ isOpen: true, model });
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) return;
    
    if (editingId) {
      setModels(prev => prev.map(m => m.id === editingId ? { ...m, ...formData } : m));
    } else {
      const newModel: FabricModel = {
        ...formData,
        id: Date.now().toString(),
        stockCount: 0
      };
      setModels([...models, newModel]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموديل؟')) {
      setModels(prev => prev.filter(m => m.id !== id));
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.size} موديل؟`)) {
      setModels(prev => prev.filter(m => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === models.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(models.map(m => m.id)));
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getModelHistory = (modelId: string) => {
    const history: { date: string, machineName: string, quantity: number, rawType: string, rawSize: number }[] = [];
    machines.forEach(work => {
      work.entries.forEach(entry => {
        if (entry.produced.modelId === modelId) {
          history.push({
            date: work.date,
            machineName: work.machineName,
            quantity: entry.produced.quantity,
            rawType: entry.raw.type,
            rawSize: entry.raw.size
          });
        }
      });
    });
    return history.reverse(); // Newest first
  };

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">الموديلات</h2>
          <p className="text-sm text-gray-500 mt-1 font-semibold text-indigo-500">إجمالي الموديلات: {models.length}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-3 rounded-xl font-bold hover:bg-red-200 transition-all"
            >
              <Trash className="w-5 h-5" />
              حذف المحدد ({selectedIds.size})
            </button>
          )}
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
          >
            {selectedIds.size === models.length && models.length > 0 ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
            {selectedIds.size === models.length && models.length > 0 ? 'إلغاء التحديد' : 'تحديد الكل'}
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            إضافة موديل
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ابحث عن موديل بالاسم أو الكود..."
          className="block w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredModels.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center">
          <Scissors className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium font-bold italic text-lg">
            {searchTerm ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد موديلات مسجلة حالياً'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <div key={model.id} className={`bg-white p-6 rounded-3xl shadow-sm border transition-all relative ${selectedIds.has(model.id) ? 'border-indigo-500 ring-4 ring-indigo-50 bg-indigo-50/10' : 'border-gray-100 hover:shadow-xl hover:-translate-y-1'}`}>
              <button 
                onClick={() => toggleSelect(model.id)}
                className="absolute top-4 left-4 text-indigo-600 transition-transform hover:scale-110"
              >
                {selectedIds.has(model.id) ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6 text-gray-200 hover:text-gray-300" />}
              </button>

              <div className="flex justify-between items-start mb-6 pr-8">
                <div className="flex flex-col gap-1">
                  <h4 className="text-2xl font-black text-gray-800 tracking-tight leading-none">{model.name}</h4>
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-500 px-2 py-1 rounded-lg uppercase tracking-widest inline-block w-fit">كود: {model.code}</span>
                </div>
                {/* Interactive Stock Counter */}
                <button 
                  onClick={() => handleOpenHistory(model)}
                  className="text-right group hover:bg-indigo-50 p-2 rounded-2xl transition-all"
                  title="اضغط لعرض سجل الإنتاج"
                >
                  <span className="text-4xl font-black text-indigo-600 group-hover:scale-110 transition-transform block">{model.stockCount}</span>
                  <div className="flex items-center gap-1 justify-end">
                    <History className="w-3 h-3 text-indigo-300" />
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">المخزون</p>
                  </div>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-gray-600 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase mb-1">الطول</span>
                  <span className="font-black text-gray-700 text-sm">{model.length} سم</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase mb-1">العرض</span>
                  <span className="font-black text-gray-700 text-sm">{model.width} سم</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase mb-1">الكم</span>
                  <span className="font-black text-gray-700 text-sm">{model.sleeveLength} × {model.sleeveWidth}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase mb-1">الرقبة</span>
                  <span className="font-black text-gray-700 text-sm">{model.neckType}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => handleOpenEdit(model)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-indigo-600 bg-white border-2 border-indigo-50 hover:bg-indigo-50 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-sm"
                >
                  <Edit className="w-4 h-4" />
                  تعديل
                </button>
                <button 
                  onClick={() => handleDelete(model.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-red-500 bg-white border-2 border-red-50 hover:bg-red-50 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Modal */}
      <Modal 
        isOpen={historyModal.isOpen} 
        onClose={() => setHistoryModal({ isOpen: false, model: null })} 
        title={`سجل إنتاج موديل: ${historyModal.model?.name || ''}`}
        maxWidth="3xl"
      >
        <div className="space-y-6">
          <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">إجمالي القطع المتوفرة</p>
              <h4 className="text-4xl font-black text-indigo-600">{historyModal.model?.stockCount} قطعة</h4>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm text-right">
              <span className="text-xs font-bold text-gray-400 block mb-1">كود الموديل</span>
              <span className="text-xl font-black text-gray-800">{historyModal.model?.code}</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-5 border-b flex items-center gap-3">
              <History className="w-5 h-5 text-indigo-500" />
              <h5 className="font-black text-gray-700">تاريخ الإضافات من الماكينات</h5>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">التاريخ</th>
                    <th className="px-6 py-4">المكنة</th>
                    <th className="px-6 py-4">نوع الخام</th>
                    <th className="px-6 py-4">الكمية المضافة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historyModal.model && getModelHistory(historyModal.model.id).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic font-bold">لم يتم تسجيل أي إنتاج لهذا الموديل بعد</td>
                    </tr>
                  ) : (
                    historyModal.model && getModelHistory(historyModal.model.id).map((h, i) => (
                      <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-6 py-4 text-sm font-bold text-gray-500 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-300" />
                          {h.date}
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-gray-800">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-indigo-300 group-hover:text-indigo-500 transition-colors" />
                            {h.machineName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
                            {h.rawType} ({h.rawSize})
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-green-600">
                          <div className="flex items-center gap-1">
                            <PlusCircle className="w-3.5 h-3.5 opacity-50" />
                            {h.quantity} قطعة
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="pt-4">
            <button 
              onClick={() => setHistoryModal({ isOpen: false, model: null })}
              className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
              إغلاق السجل
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "تعديل موديل" : "إضافة موديل جديد"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-1">اسم الموديل</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-50 rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-1">كود الموديل</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-50 rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-1">الطول (سم)</label>
              <input
                type="number"
                value={formData.length || ''}
                onChange={(e) => setFormData({ ...formData, length: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border-2 border-gray-50 rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-1">العرض (سم)</label>
              <input
                type="number"
                value={formData.width || ''}
                onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border-2 border-gray-50 rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-1">طول الكم</label>
              <input
                type="number"
                value={formData.sleeveLength || ''}
                onChange={(e) => setFormData({ ...formData, sleeveLength: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border-2 border-gray-50 rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-1">عرض الكم</label>
              <input
                type="number"
                value={formData.sleeveWidth || ''}
                onChange={(e) => setFormData({ ...formData, sleeveWidth: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border-2 border-gray-50 rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-1">نوع الرقبة</label>
            <input
              type="text"
              value={formData.neckType}
              placeholder="مثال: دائرية، سبعة..."
              onChange={(e) => setFormData({ ...formData, neckType: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-50 rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black mt-4 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 text-lg"
          >
            {editingId ? "تحديث الموديل" : "حفظ الموديل"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ModelsPage;
