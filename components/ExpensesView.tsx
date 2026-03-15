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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-blue-900">{expenseToEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500 hover:text-gray-800" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                        <input type="text" name="description" value={expense.description} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kategori</label>
                            <select name="category" value={expense.category} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                {Object.values(ExpenseCategory).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Jumlah (Rp)</label>
                            <input type="number" name="amount" value={expense.amount} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required min="0" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-[#2F4B8B] text-white rounded-md hover:bg-blue-800 disabled:bg-gray-400">
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Manajemen Pengeluaran</h1>
        <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-[#2F4B8B] text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-800 transition-colors">
          <PlusIcon className="w-5 h-5" />
          <span>Catat Pengeluaran</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3">Tanggal</th>
              <th scope="col" className="px-6 py-3">Deskripsi</th>
              <th scope="col" className="px-6 py-3">Kategori</th>
              <th scope="col" className="px-6 py-3">Jumlah</th>
              <th scope="col" className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedExpenses.map(expense => (
              <tr key={expense.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString('id-ID')}</td>
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {expense.description}
                </th>
                <td className="px-6 py-4">{expense.category}</td>
                <td className="px-6 py-4">Rp {expense.amount.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(expense)} className="text-blue-600 hover:text-blue-800 mr-4"><EditIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
             {expenses.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">Belum ada data pengeluaran.</td>
                </tr>
             )}
          </tbody>
        </table>
        
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