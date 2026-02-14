
import React, { useState } from 'react';
import { FabricModel, MachineWork, ProcessingWork } from '../types';
import Modal from '../components/Modal';
import { 
  PlusCircle, 
  Scissors, 
  Trash2, 
  Edit, 
  Search, 
  History, 
  Cpu, 
  CheckCircle,
  Maximize,
  Ruler,
  Wind,
  Shirt,
  LayoutGrid,
  Calendar,
  AlertCircle,
  PackageCheck,
  PackageSearch,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react';

interface Props {
  models: FabricModel[];
  setModels: React.Dispatch<React.SetStateAction<FabricModel[]>>;
  machines: MachineWork[];
  processing: ProcessingWork[];
}

const ModelsPage: React.FC<Props> = ({ models, setModels, machines, processing }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean, model: FabricModel | null }>({ isOpen: false, model: null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<FabricModel, 'id' | 'stockCount' | 'producedCount'>>({
    name: '',
    code: '',
    length: 0,
    width: 0,
    sleeveLength: 0,
    sleeveWidth: 0,
    neckType: '',
    imageUrl: ''
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      code: '', 
      length: 0, 
      width: 0, 
      sleeveLength: 0, 
      sleeveWidth: 0, 
      neckType: '',
      imageUrl: ''
    });
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
      neckType: model.neckType,
      imageUrl: model.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenHistory = (model: FabricModel) => {
    setHistoryModal({ isOpen: true, model });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) return;
    
    if (editingId) {
      setModels(prev => prev.map(m => m.id === editingId ? { ...m, ...formData } : m));
    } else {
      const newModel: FabricModel = {
        ...formData,
        id: Date.now().toString(),
        stockCount: 0,
        producedCount: 0
      };
      setModels([...models, newModel]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموديل؟')) {
      setModels(prev => prev.filter(m => m.id !== id));
    }
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-black text-gray-800 flex items-center gap-3">
            <LayoutGrid className="w-10 h-10 text-indigo-600" />
            الموديلات
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-semibold text-indigo-500 italic">تعريف الموديلات ومراقبة عدادات الإنتاج والجاهز</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          <PlusCircle className="w-5 h-5" />
          إضافة موديل جديد
        </button>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ابحث عن موديل بالاسم أو الكود..."
          className="block w-full pr-12 pl-4 py-4 border-none rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm transition-all text-lg font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredModels.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] shadow-sm border border-dashed border-gray-200 flex flex-col items-center justify-center">
          <Scissors className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-gray-400 font-black italic text-xl">لا توجد موديلات مضافة بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredModels.map((model) => (
            <div key={model.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-50 hover:shadow-2xl transition-all relative group overflow-visible">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col gap-1 relative group/title">
                    <h4 className="text-3xl font-black text-gray-800 tracking-tight leading-none cursor-help">
                      {model.name}
                    </h4>
                    {model.imageUrl && (
                      <div className="absolute bottom-full right-0 mb-4 opacity-0 pointer-events-none group-hover/title:opacity-100 group-hover/title:pointer-events-auto transition-all duration-300 transform scale-90 group-hover/title:scale-100 z-[100] w-48 h-48 bg-white p-2 rounded-3xl shadow-2xl border-4 border-white overflow-hidden ring-4 ring-indigo-50/50">
                        <img src={model.imageUrl} alt={model.name} className="w-full h-full object-cover rounded-2xl" />
                      </div>
                    )}
                    <span className="text-[11px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full uppercase tracking-widest inline-block w-fit mt-2 shadow-lg shadow-indigo-100">كود: {model.code}</span>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => handleOpenEdit(model)} className="p-3 text-indigo-600 bg-indigo-50 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><Edit className="w-5 h-5" /></button>
                     <button onClick={() => handleDelete(model.id)} className="p-3 text-red-500 bg-red-50 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div 
                      onClick={() => handleOpenHistory(model)}
                      className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group/counter"
                   >
                      <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                         <PackageCheck className="w-4 h-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">جاهز</span>
                      </div>
                      <span className="text-4xl font-black text-green-700 leading-none">{Math.max(0, model.stockCount || 0)}</span>
                   </div>
                   <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-center">
                      <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                         <PackageSearch className="w-4 h-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">غير جاهز</span>
                      </div>
                      <span className="text-4xl font-black text-orange-700 leading-none">{Math.max(0, model.producedCount || 0)}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-8">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                    <span className="text-[10px] text-gray-400 font-black uppercase flex items-center gap-1"><Maximize className="w-3 h-3" /> المقاسات</span>
                    <p className="font-black text-gray-800 text-sm">{model.length} × {model.width} سم</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                    <span className="text-[10px] text-gray-400 font-black uppercase flex items-center gap-1"><Wind className="w-3 h-3" /> الرقبة</span>
                    <p className="font-black text-gray-800 text-sm truncate">{model.neckType || '---'}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleOpenHistory(model)}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white rounded-2xl text-xs font-black transition-all shadow-sm"
                >
                  <History className="w-4 h-4" /> عرض سجل التحركات
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
        title={`حركة موديل: ${historyModal.model?.name || ''}`}
        maxWidth="3xl"
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-green-50 p-8 rounded-[2.5rem] border-2 border-green-100 shadow-xl shadow-green-50/50 relative overflow-hidden group">
               <CheckCircle className="absolute -bottom-4 -right-4 w-24 h-24 text-green-100 group-hover:scale-110 transition-transform" />
               <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-2 relative z-10">المخزون الجاهز (المستلم من التجهيز)</p>
               <h4 className="text-5xl font-black text-green-600 relative z-10">{Math.max(0, historyModal.model?.stockCount || 0)} <span className="text-xl font-bold">قطعة</span></h4>
            </div>
            <div className="bg-orange-50 p-8 rounded-[2.5rem] border-2 border-orange-100 shadow-xl shadow-orange-50/50 relative overflow-hidden group">
               <Cpu className="absolute -bottom-4 -right-4 w-24 h-24 text-orange-100 group-hover:scale-110 transition-transform" />
               <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 relative z-10">غير جاهز (فائض شغل المكن)</p>
               <h4 className="text-5xl font-black text-orange-600 relative z-10">{Math.max(0, historyModal.model?.producedCount || 0)} <span className="text-xl font-bold">قطعة</span></h4>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-xl shadow-gray-100/50">
            <div className="p-6 border-b flex items-center gap-3 bg-gray-50/50">
              <History className="w-6 h-6 text-indigo-500" />
              <h5 className="font-black text-gray-700 text-lg">سجل التحركات الأخيرة</h5>
            </div>
            <div className="max-h-[40vh] overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {processing.filter(p => p.entries.some(e => e.modelId === historyModal.model?.id)).length === 0 ? (
                <p className="text-center text-gray-400 font-bold py-10 italic">لا توجد حركات استلام مسجلة لهذا الموديل</p>
              ) : (
                processing.filter(p => p.entries.some(e => e.modelId === historyModal.model?.id)).map((p, i) => {
                  const entry = p.entries.find(e => e.modelId === historyModal.model?.id);
                  return (
                    <div key={i} className="flex justify-between items-center bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-all">
                      <div className="flex flex-col gap-1">
                        <span className="text-md font-black text-gray-800">استلام من ورشة: <span className="text-indigo-600">{p.machineName}</span></span>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                          <Calendar className="w-3 h-3" /> {p.date}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-green-600">+{entry?.quantityReceived}</span>
                        <p className="text-[10px] text-gray-400 font-black uppercase">جاهز للاستلام</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <button 
            onClick={() => setHistoryModal({ isOpen: false, model: null })}
            className="w-full py-5 bg-gray-100 text-gray-600 rounded-[2rem] font-black hover:bg-gray-200 transition-all text-lg shadow-inner"
          >
            إغلاق النافذة
          </button>
        </div>
      </Modal>

      {/* Add/Edit Model Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "تعديل الموديل" : "تعريف موديل جديد"}
        maxWidth="3xl"
      >
        <div className="space-y-8">
          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-1">صورة الموديل</label>
            <div className="flex items-center gap-6">
               <div className="relative group w-32 h-32 flex-shrink-0">
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} alt="Model preview" className="w-full h-full object-cover rounded-2xl border-2 border-gray-100 shadow-sm" />
                      <button 
                        onClick={() => setFormData({...formData, imageUrl: ''})}
                        className="absolute -top-2 -left-2 bg-red-500 text-white rounded-lg p-1 shadow-lg hover:scale-110 transition-transform"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-300">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
               </div>
               <div className="flex-1">
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-white border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group/upload">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-300 group-hover/upload:text-indigo-400 transition-colors mb-2" />
                      <p className="text-xs font-black text-gray-400 group-hover/upload:text-indigo-500 uppercase tracking-widest">اضغط لرفع صورة</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
               </div>
            </div>
          </div>

          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-1">اسم الموديل</label>
              <div className="relative group">
                <Shirt className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="مثال: قميص أطفال"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pr-4 pl-12 py-4 border-2 border-gray-100 rounded-2xl bg-white text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-black"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black mb-1 text-indigo-400 uppercase tracking-widest mr-1">كود الموديل</label>
              <div className="relative group">
                <Scissors className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="مثال: MOD-2024"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full pr-4 pl-12 py-4 border-2 border-gray-100 rounded-2xl bg-white text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-black"
                />
              </div>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="space-y-6">
            <h5 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b pb-4">
              <Ruler className="w-5 h-5" /> المواصفات التقنية
            </h5>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter">طول الموديل (سم)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.length || ''}
                  onChange={(e) => setFormData({ ...formData, length: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-4 border-2 border-gray-100 rounded-2xl bg-white text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-black text-center text-lg shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter">عرض الموديل (سم)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.width || ''}
                  onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-4 border-2 border-gray-100 rounded-2xl bg-white text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-black text-center text-lg shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter">نوع الرقبة</label>
                <input
                  type="text"
                  placeholder="مثال: سبعة"
                  value={formData.neckType}
                  onChange={(e) => setFormData({ ...formData, neckType: e.target.value })}
                  className="w-full px-4 py-4 border-2 border-gray-100 rounded-2xl bg-white text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-black text-center shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter">طول الكم (سم)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.sleeveLength || ''}
                  onChange={(e) => setFormData({ ...formData, sleeveLength: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-4 border-2 border-gray-100 rounded-2xl bg-white text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-black text-center text-lg shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter">عرض الكم (سم)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.sleeveWidth || ''}
                  onChange={(e) => setFormData({ ...formData, sleeveWidth: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-4 border-2 border-gray-100 rounded-2xl bg-white text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-black text-center text-lg shadow-sm"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-xl active:scale-[0.98] mt-6"
          >
            {editingId ? "حفظ التغييرات" : "تأكيد وإضافة الموديل"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ModelsPage;
