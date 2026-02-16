
import React, { useState } from 'react';
import { Expense } from '../types';
import Modal from '../components/Modal';
import { 
  Wallet, 
  PlusCircle, 
  Trash2, 
  Search, 
  Calendar, 
  Tag, 
  Receipt,
  TrendingDown,
  ChevronRight,
  Filter,
  AlertCircle,
  FileText
} from 'lucide-react';

interface Props {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const expenseCategories = [
  'اكياس',
  'شكاير',
  'احبال',
  'سوسته',
  'استك',
  'فتل',
  'زراير',
  'نقل (تروسيكل)',
  'كهرباء',
  'تصليح مكوه',
  'تصليح تجهيز',
  'تصليح مكن تريكو',
  'لزق',
  'بكر مزوي',
  'رواتب',
  'إيجار',
  'عامة',
  'أخرى'
];

const ExpensesPage: React.FC<Props> = ({ expenses, setExpenses }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    category: 'عامة',
    description: '',
    amount: 0
  });

  const handleAdd = () => {
    if (!formData.description || formData.amount <= 0) return;
    
    const newExpense: Expense = {
      ...formData,
      id: Date.now().toString()
    };
    
    setExpenses(prev => [newExpense, ...prev]);
    setIsModalOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'عامة',
      description: '',
      amount: 0
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-800 flex items-center gap-3">
            <Wallet className="w-10 h-10 text-red-500" />
            إدارة المصروفات
          </h2>
          <p className="text-gray-500 text-sm font-bold mt-1 italic">تسجيل ومراقبة نفقات المصنع المختلفة</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-red-100 transition-all active:scale-95"
        >
          <PlusCircle className="w-6 h-6" />
          إضافة مصروف جديد
        </button>
      </div>

      {/* Stats Counter Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-red-50 p-8 rounded-[2.5rem] border-2 border-red-100 shadow-sm relative overflow-hidden group">
          <TrendingDown className="absolute -bottom-4 -right-4 w-24 h-24 text-red-100/50 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-2 relative z-10">إجمالي المصروفات</p>
          <h4 className="text-5xl font-black text-red-700 relative z-10">{totalExpenses.toLocaleString()} <span className="text-xl font-bold">ج.م</span></h4>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">عدد العمليات المسجلة</p>
          <h4 className="text-4xl font-black text-gray-800">{expenses.length} <span className="text-lg font-bold">عملية</span></h4>
        </div>

        {filterCategory && (
          <div className="bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-sm flex flex-col justify-center animate-in zoom-in duration-300">
            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">إجمالي فئة: {filterCategory}</p>
            <h4 className="text-4xl font-black text-indigo-700">{filteredTotal.toLocaleString()} <span className="text-lg font-bold">ج.م</span></h4>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث في وصف المصروف..."
            className="w-full pr-12 pl-4 py-4 rounded-xl bg-gray-50 border-none font-bold outline-none focus:ring-4 focus:ring-red-50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="text-gray-400 w-5 h-5" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full md:w-48 p-4 rounded-xl bg-gray-50 border-none font-black outline-none focus:ring-4 focus:ring-red-50 transition-all"
          >
            <option value="">كل التصنيفات</option>
            {expenseCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table/Log with Vertical Scrollbar */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b flex items-center gap-3">
          <Receipt className="w-7 h-7 text-red-500" />
          <h3 className="text-2xl font-black text-gray-800">سجل المصروفات</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar relative">
            <table className="w-full text-right border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <th className="px-8 py-5 bg-gray-50">التاريخ</th>
                  <th className="px-8 py-5 bg-gray-50">الفئة</th>
                  <th className="px-8 py-5 bg-gray-50">الوصف</th>
                  <th className="px-8 py-5 bg-gray-50">المبلغ</th>
                  <th className="px-8 py-5 text-center bg-gray-50">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold italic">لا توجد مصروفات مسجلة تطابق بحثك</td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-red-50/10 transition-colors group">
                      <td className="px-8 py-5 font-bold text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-300" />
                          {expense.date}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-gray-200">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-8 py-5 font-black text-gray-700">{expense.description}</td>
                      <td className="px-8 py-5 text-lg font-black text-red-600">
                        {expense.amount.toLocaleString()} <span className="text-[10px] font-bold">ج.م</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button 
                          onClick={() => handleDelete(expense.id)} 
                          className="text-gray-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"
                        >
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
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تسجيل مصروف جديد" maxWidth="3xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest block mr-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> التاريخ
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl bg-white text-gray-900 font-bold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest block mr-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> تصنيف المصروف
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 bg-gray-50 p-4 rounded-3xl border border-gray-100 max-h-[250px] overflow-y-auto custom-scrollbar">
              {expenseCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`p-3 rounded-xl border-2 text-[11px] font-black transition-all ${formData.category === cat ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white border-transparent text-gray-500 hover:border-red-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest block mr-2 flex items-center gap-1">
              <FileText className="w-3 h-3" /> وصف المصروف
            </label>
            <input
              type="text"
              placeholder="مثال: فاتورة كهرباء شهر يوليو"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl bg-white text-gray-900 font-black outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest block mr-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> المبلغ (ج.م)
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full p-8 text-center text-5xl font-black text-red-600 border-2 border-gray-100 rounded-[2.5rem] bg-gray-50/30 focus:bg-white focus:border-red-500 outline-none transition-all shadow-inner"
            />
          </div>

          <button
            onClick={handleAdd}
            className="w-full bg-red-600 text-white py-6 rounded-[2.5rem] font-black shadow-2xl shadow-red-100 hover:bg-red-700 transition-all text-xl flex items-center justify-center gap-3 active:scale-[0.98] mt-4"
          >
            تأكيد تسجيل المصروف
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
