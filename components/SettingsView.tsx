import React, { useState } from 'react';
import { User, UserRole, View } from '../types';
import { PlusIcon, EditIcon, TrashIcon, CloseIcon } from './Icons';

interface SettingsViewProps {
  users: User[];
  onSaveUser: (user: User | Omit<User, 'id' | 'created_at'>) => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<boolean>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ users, onSaveUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Omit<User, 'id' | 'created_at'>>({
    name: '',
    role: UserRole.KASIR,
    allowed_views: [View.POS, View.EXPENSES, View.PRODUCTS]
  });

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        role: user.role,
        allowed_views: user.allowed_views || []
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        role: UserRole.KASIR,
        allowed_views: [View.POS, View.EXPENSES, View.PRODUCTS]
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSaveUser(editingUser ? { ...editingUser, ...formData } : formData);
    if (success) {
      handleCloseModal();
    }
  };

  const toggleView = (view: View) => {
    setFormData(prev => {
      const currentViews = prev.allowed_views || [];
      if (currentViews.includes(view)) {
        return { ...prev, allowed_views: currentViews.filter(v => v !== view) };
      } else {
        return { ...prev, allowed_views: [...currentViews, view] };
      }
    });
  };

  const availableViews = [
    { view: View.POS, label: 'Kasir' },
    { view: View.EXPENSES, label: 'Pengeluaran' },
    { view: View.PRODUCTS, label: 'Produk' },
    { view: View.REPORTS, label: 'Laporan' },
    { view: View.PRICING_CALCULATOR, label: 'Kalkulator Harga' },
    { view: View.DATA_MANAGEMENT, label: 'Manajemen Data' },
    { view: View.SETTINGS, label: 'Pengaturan' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Manajemen Pengguna</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-[#2F4B8B] text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-800 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3">Nama Pengguna</th>
              <th scope="col" className="px-6 py-3">Peran</th>
              <th scope="col" className="px-6 py-3">Akses Menu</th>
              <th scope="col" className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {user.name}
                </th>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role?.toLowerCase() === UserRole.ADMIN.toLowerCase() ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {user.role}
                    </span>
                </td>
                <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                        {(user.allowed_views || []).map(v => (
                            <span key={v} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{v}</span>
                        ))}
                    </div>
                </td>
                <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-800 mr-4"><EditIcon className="w-5 h-5" /></button>
                    <button onClick={() => onDeleteUser(user.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
             {users.length === 0 && (
                <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">Belum ada pengguna terdaftar.</td>
                </tr>
             )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-900">{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</h2>
              <button onClick={handleCloseModal}><CloseIcon className="w-6 h-6 text-gray-500 hover:text-gray-800" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nama Pengguna</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Peran</label>
                <select 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={UserRole.KASIR}>Kasir</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Akses Menu</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableViews.map(({ view, label }) => (
                    <label key={view} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(formData.allowed_views || []).includes(view)}
                        onChange={() => toggleView(view)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-[#2F4B8B] text-white rounded-md hover:bg-blue-800">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
