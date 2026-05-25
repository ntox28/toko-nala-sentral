import React, { useState, useEffect, useMemo } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { PlusIcon, EditIcon, TrashIcon, CloseIcon } from './Icons';
import Pagination from './Pagination';

type ExpenseFormData = Omit<Expense, 'id' | 'date' | 'created_at'>;

const emptyExpense: ExpenseFormData = {
    description: '',
    category: ExpenseCategory.BAHAN_BAKU,
    amount: 0,
};

interface ExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    // FIX: Updated the onSave prop to expect an object that includes the 'date' property for new expenses.
    onSave: (expense: Expense | Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
    expenseToEdit: Expense | null;
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, onSave, expenseToEdit }) => {
    const [expense, setExpense] = useState<ExpenseFormData>(emptyExpense);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (expenseToEdit) {
            const {id, date, created_at, ...editableData} = expenseToEdit;
            setExpense(editableData);
        } else {
            setExpense(emptyExpense);
        }
    }, [expenseToEdit, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setExpense(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // FIX: The type for the object to be saved is now correctly inferred, including the date for new expenses.
        const expenseToSave = expenseToEdit 
            ? { ...expense, id: expenseToEdit.id, date: expenseToEdit.date } 
            : { ...expense, date: new Date().toISOString() };
        await onSave(expenseToSave);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-[115] p-4 font-sans animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-5 overflow-hidden">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 bg-white">
                    <div>
                        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">{expenseToEdit ? 'Edit Catatan Pengeluaran' : 'Catat Pengeluaran Baru'}</h2>
                        <p className="text-[10px] text-slate-400 font-medium tracking-tight">Masukkan detail pengeluaran operasional toko</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50"><CloseIcon className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deskripsi Kegiatan/Barang</label>
                        <input type="text" name="description" value={expense.description} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-855 focus:outline-none focus:border-slate-400 font-medium" placeholder="Contoh: Pembelian gas atau kantong plastik" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori</label>
                            <select name="category" value={expense.category} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400">
                                {Object.values(ExpenseCategory).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jumlah Pemakaian (Rp)</label>
                            <input type="number" name="amount" value={expense.amount} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-855 focus:outline-none focus:border-slate-400 font-bold" placeholder="0" required min="0" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-3 border-t border-slate-50">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer">Batal</button>
                        <button type="submit" disabled={isSaving} className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 disabled:bg-slate-200 shadow-sm shadow-slate-950/10 cursor-pointer">
                            {isSaving ? 'Menyimpan...' : 'Simpan Detail'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ExpensesViewProps {
  expenses: Expense[];
  onSaveExpense: (expenseData: Expense | Omit<Expense, 'id' | 'created_at'>) => Promise<boolean>;
  onDeleteExpense: (expenseId: string) => Promise<boolean>;
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, onSaveExpense, onDeleteExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const totalPages = useMemo(() => Math.ceil(expenses.length / itemsPerPage), [expenses.length]);
  
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return expenses.slice(startIndex, endIndex);
  }, [expenses, currentPage]);

  const handleOpenModal = (expense: Expense | null = null) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setExpenseToEdit(null);
  };

  const handleSaveExpense = async (expenseData: Expense | Omit<Expense, 'id' | 'created_at'>) => {
    const success = await onSaveExpense(expenseData);
    if(success) {
        handleCloseModal();
    }
  };
  
  const handleDeleteExpense = async (expenseId: string) => {
    if(window.confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
        await onDeleteExpense(expenseId);
    }
  };

  return (
    <div className="p-0.5 space-y-4 font-sans animate-fade-in">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Keuangan & Operasional</h2>
          <h1 className="text-lg font-black text-slate-800 tracking-tight mt-0.5">Manajemen Pengeluaran</h1>
          <p className="text-[11px] text-slate-400 font-medium">Catat dan pantau seluruh pengeluaran operasional toko Anda</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center space-x-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold shadow-sm shadow-slate-950/10 cursor-pointer shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span>Catat Pengeluaran</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="border-b border-slate-100 text-slate-450 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
              <tr>
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">Deskripsi</th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3">Jumlah</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 text-xs">
              {paginatedExpenses.map(expense => (
                <tr key={expense.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-5 py-3 text-slate-500 font-mono">{new Date(expense.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">
                    {expense.description}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-block bg-slate-100 border border-slate-200/40 text-slate-600 font-bold text-[10px] rounded-md px-1.5 py-0.5">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-black text-slate-800 font-mono">Rp{expense.amount.toLocaleString('id-ID')}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => handleOpenModal(expense)} className="p-1 px-[5px] text-slate-500 hover:text-slate-800 hover:bg-slate-100/85 border border-transparent rounded-lg transition-colors cursor-pointer" title="Edit"><EditIcon className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteExpense(expense.id)} className="p-1 px-[5px] text-red-500 hover:bg-red-50 hover:border-red-100/10 border border-transparent rounded-lg transition-colors cursor-pointer" title="Hapus"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
               {expenses.length === 0 && (
                  <tr>
                      <td colSpan={5} className="text-center py-8 text-xs text-slate-400 font-medium">Belum ada data pengeluaran terdaftar.</td>
                  </tr>
               )}
            </tbody>
          </table>
        </div>
        
        <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={expenses.length}
            itemsPerPage={itemsPerPage}
        />
      </div>
      
      <ExpenseFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
};

export default ExpensesView;