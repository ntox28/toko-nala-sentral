import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Transaction, Product, Expense, Size, PaymentMethod } from '../types';
import { TrashIcon, EditIcon, PlusIcon, PackageIcon, ReceiptRefundIcon, ChartBarIcon, ArchiveBoxIcon, CloseIcon, DownloadIcon, UploadIcon, RefreshIcon, SearchIcon } from './Icons';
import { uploadProductImage } from '../supabase';
import Pagination from './Pagination';

interface DataManagementViewProps {
  transactions: Transaction[];
  products: Product[];
  expenses: Expense[];
  sizes: Size[];
  onDeleteTransaction: (transactionId: string) => Promise<boolean>;
  onSaveTransaction: (transaction: Transaction) => Promise<boolean>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
  onSaveProduct: (product: any) => Promise<boolean>;
  onDeleteExpense: (expenseId: string) => Promise<boolean>;
  onSaveExpense: (expense: any) => Promise<boolean>;
  onSaveSize: (size: any) => Promise<boolean>;
  onDeleteSize: (sizeId: string) => Promise<boolean>;
  onRefresh?: () => void;
}

const DataManagementView: React.FC<DataManagementViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'ukuran' | 'produk' | 'pengeluaran' | 'transaksi'>('ukuran');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleOpenModal = (item: any = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const tabs = [
    { id: 'ukuran', label: 'Ukuran', icon: <ArchiveBoxIcon className="w-5 h-5" /> },
    { id: 'produk', label: 'Produk', icon: <PackageIcon className="w-5 h-5" /> },
    { id: 'pengeluaran', label: 'Pengeluaran', icon: <ReceiptRefundIcon className="w-5 h-5" /> },
    { id: 'transaksi', label: 'Transaksi', icon: <ChartBarIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Manajemen Data (Admin)</h1>
        {props.onRefresh && (
            <button 
                onClick={props.onRefresh}
                className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 flex items-center space-x-2"
                title="Segarkan Data"
            >
                <RefreshIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Segarkan Data</span>
            </button>
        )}
      </div>
      
      <div className="flex space-x-1 bg-blue-100 p-1 rounded-xl mb-6 max-w-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 flex-1 py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-[#2F4B8B] shadow'
                : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-900'
            }`}
          >
            <span className="mx-auto flex items-center space-x-2">
                {tab.icon}
                <span>{tab.label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {activeTab === 'ukuran' && (
          <UkuranTab 
            sizes={props.sizes} 
            onSave={props.onSaveSize} 
            onDelete={props.onDeleteSize} 
          />
        )}
        {activeTab === 'produk' && (
          <ProdukTab 
            products={props.products} 
            sizes={props.sizes}
            onSave={props.onSaveProduct} 
            onDelete={props.onDeleteProduct} 
          />
        )}
        {activeTab === 'pengeluaran' && (
          <PengeluaranTab 
            expenses={props.expenses} 
            onSave={props.onSaveExpense} 
            onDelete={props.onDeleteExpense} 
          />
        )}
        {activeTab === 'transaksi' && (
          <TransaksiTab 
            transactions={props.transactions} 
            onSave={props.onSaveTransaction} 
            onDelete={props.onDeleteTransaction} 
          />
        )}
      </div>
    </div>
  );
};

// --- Sub-Components ---

const UkuranTab: React.FC<{ sizes: Size[], onSave: (s: any) => Promise<boolean>, onDelete: (id: string) => Promise<boolean> }> = ({ sizes, onSave, onDelete }) => {
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredSizes = useMemo(() => {
        return sizes.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sizes, searchTerm]);

    const totalPages = Math.ceil(filteredSizes.length / itemsPerPage);
    const paginatedSizes = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredSizes.slice(start, start + itemsPerPage);
    }, [filteredSizes, currentPage, itemsPerPage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        await onSave({ id: editingId, name });
        setName('');
        setEditingId(null);
    };

    const downloadTemplate = () => {
        const template = [
            { "Nama Ukuran": "Jumbo" },
            { "Nama Ukuran": "Reguler" },
            { "Nama Ukuran": "Kecil" }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Ukuran");
        XLSX.writeFile(wb, "Template_Ukuran.xlsx");
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws) as any[];

            let count = 0;
            for (const row of data) {
                const sizeName = row["Nama Ukuran"];
                if (sizeName && typeof sizeName === 'string') {
                    // Check if already exists to avoid duplicates
                    if (!sizes.find(s => s.name.toLowerCase() === sizeName.toLowerCase())) {
                        await onSave({ name: sizeName });
                        count++;
                    }
                }
            }
            alert(`Berhasil mengimpor ${count} ukuran baru.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-900">Manajemen Ukuran</h2>
                <div className="flex space-x-2">
                    <button 
                        onClick={downloadTemplate}
                        className="flex items-center space-x-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100"
                    >
                        <DownloadIcon className="w-3.5 h-3.5" />
                        <span>Template Excel</span>
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100"
                    >
                        <UploadIcon className="w-3.5 h-3.5" />
                        <span>Import Excel</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImport} 
                        accept=".xlsx, .xls" 
                        className="hidden" 
                    />
                </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
                <div className="relative flex-grow">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Cari ukuran..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <form onSubmit={handleSubmit} className="flex space-x-2">
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Nama Ukuran"
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                    <button type="submit" className="bg-[#2F4B8B] text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors">
                        {editingId ? 'Simpan' : 'Tambah'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={() => { setEditingId(null); setName(''); }} className="bg-gray-200 px-4 py-2 rounded-lg">Batal</button>
                    )}
                </form>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {paginatedSizes.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <span className="font-medium">{s.name}</span>
                        <div className="flex space-x-2">
                            <button onClick={() => { setEditingId(s.id); setName(s.name); }} className="text-blue-600 hover:text-blue-800"><EditIcon className="w-4 h-4"/></button>
                            <button onClick={() => window.confirm('Hapus ukuran ini?') && onDelete(s.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredSizes.length}
                itemsPerPage={itemsPerPage}
            />
        </div>
    );
};

const ProdukTab: React.FC<{ products: Product[], sizes: Size[], onSave: (p: any) => Promise<boolean>, onDelete: (id: string) => Promise<boolean> }> = ({ products, sizes, onSave, onDelete }) => {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (p.barcode && p.barcode.includes(searchTerm))
        );
    }, [products, searchTerm]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, currentPage, itemsPerPage]);

    const handleEdit = (p: Product) => {
        setEditingProduct({ ...p });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingProduct) return;

        setIsUploading(true);
        const publicUrl = await uploadProductImage(file);
        if (publicUrl) {
            setEditingProduct({ ...editingProduct, image_url: publicUrl });
        } else {
            alert('Gagal mengunggah gambar. Pastikan Supabase sudah dikonfigurasi.');
        }
        setIsUploading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        await onSave(editingProduct);
        setEditingProduct(null);
    };

    const downloadTemplate = () => {
        const template = [
            { 
                "Nama Produk": "Es Teh Manis", 
                "Barcode": "123456789", 
                "Ukuran": "Reguler", 
                "Harga Modal": 2000, 
                "Harga Jual": 5000,
                "Stok": 100,
                "Batas Stok Menipis": 10
            },
            { 
                "Nama Produk": "Es Jeruk", 
                "Barcode": "", 
                "Ukuran": "Jumbo", 
                "Harga Modal": 3000, 
                "Harga Jual": 7000,
                "Stok": 50,
                "Batas Stok Menipis": 5
            }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Produk");
        XLSX.writeFile(wb, "Template_Produk.xlsx");
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws) as any[];

            let count = 0;
            for (const row of data) {
                const name = row["Nama Produk"];
                const barcode = row["Barcode"]?.toString() || "";
                const size = row["Ukuran"] || "Reguler";
                const costPrice = parseFloat(row["Harga Modal"]) || 0;
                const price = parseFloat(row["Harga Jual"]) || 0;
                const stock = parseFloat(row["Stok"]) || 0;
                const lowStockThreshold = parseFloat(row["Batas Stok Menipis"]) || 5;

                if (name && typeof name === 'string') {
                    await onSave({
                        name,
                        barcode,
                        size,
                        cost_price: costPrice,
                        price,
                        stock,
                        low_stock_threshold: lowStockThreshold,
                        category: 'Minuman', // Default category
                        image_url: 'https://picsum.photos/seed/drink/200/200',
                        is_active: true
                    });
                    count++;
                }
            }
            alert(`Berhasil mengimpor ${count} produk baru.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-900">Manajemen Produk & Harga Modal</h2>
                <div className="flex space-x-2">
                    <button 
                        onClick={downloadTemplate}
                        className="flex items-center space-x-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100"
                    >
                        <DownloadIcon className="w-3.5 h-3.5" />
                        <span>Template Excel</span>
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100"
                    >
                        <UploadIcon className="w-3.5 h-3.5" />
                        <span>Import Excel</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImport} 
                        accept=".xlsx, .xls" 
                        className="hidden" 
                    />
                </div>
            </div>
            <p className="text-sm text-gray-500 mb-4 italic">* Di sini Anda dapat mengatur harga modal yang tidak terlihat oleh kasir.</p>
            
            <div className="relative mb-4 max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    placeholder="Cari produk atau barcode..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Barcode</th>
                            <th className="px-4 py-3">Ukuran</th>
                            <th className="px-4 py-3 text-right">Stok</th>
                            <th className="px-4 py-3 text-right">Modal</th>
                            <th className="px-4 py-3 text-right">Jual</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {paginatedProducts.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{p.name}</td>
                                <td className="px-4 py-3 font-mono text-xs">{p.barcode || '-'}</td>
                                <td className="px-4 py-3">{p.size}</td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`font-bold ${p.stock <= p.low_stock_threshold ? 'text-red-600' : 'text-gray-900'}`}>
                                        {p.stock}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-blue-700">Rp {p.cost_price?.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right">Rp {p.price.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => window.confirm('Hapus produk ini?') && onDelete(p.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                        {paginatedProducts.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada produk ditemukan</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredProducts.length}
                itemsPerPage={itemsPerPage}
            />

            {/* Product Edit Modal */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-bold text-blue-900">Edit Produk & Modal</h3>
                            <button onClick={() => setEditingProduct(null)}><CloseIcon className="w-6 h-6"/></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                                    {editingProduct.image_url ? (
                                        <img src={editingProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <PackageIcon className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-grow">
                                    <input 
                                        type="file" 
                                        ref={imageInputRef}
                                        onChange={handleImageUpload}
                                        className="hidden" 
                                        accept="image/*"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        <UploadIcon className="w-4 h-4" />
                                        <span>{isUploading ? 'Mengunggah...' : 'Ubah Gambar'}</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nama Produk</label>
                                <input 
                                    type="text" 
                                    value={editingProduct.name} 
                                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                                    className="mt-1 block w-full border rounded-md p-2"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Barcode</label>
                                    <input 
                                        type="text" 
                                        value={editingProduct.barcode || ''} 
                                        onChange={(e) => setEditingProduct({...editingProduct, barcode: e.target.value})}
                                        className="mt-1 block w-full border rounded-md p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ukuran</label>
                                    <select 
                                        value={editingProduct.size} 
                                        onChange={(e) => setEditingProduct({...editingProduct, size: e.target.value})}
                                        className="mt-1 block w-full border rounded-md p-2"
                                    >
                                        {sizes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 font-bold text-blue-700">Harga Modal (Rp)</label>
                                    <input 
                                        type="number" 
                                        value={editingProduct.cost_price} 
                                        onChange={(e) => setEditingProduct({...editingProduct, cost_price: parseFloat(e.target.value) || 0})}
                                        className="mt-1 block w-full border-2 border-blue-200 rounded-md p-2 font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Harga Jual (Rp)</label>
                                    <input 
                                        type="number" 
                                        value={editingProduct.price} 
                                        onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                                        className="mt-1 block w-full border rounded-md p-2"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Stok Saat Ini</label>
                                    <input 
                                        type="number" 
                                        value={editingProduct.stock} 
                                        onChange={(e) => setEditingProduct({...editingProduct, stock: parseFloat(e.target.value) || 0})}
                                        className="mt-1 block w-full border rounded-md p-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Batas Stok Menipis</label>
                                    <input 
                                        type="number" 
                                        value={editingProduct.low_stock_threshold} 
                                        onChange={(e) => setEditingProduct({...editingProduct, low_stock_threshold: parseFloat(e.target.value) || 0})}
                                        className="mt-1 block w-full border rounded-md p-2"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 bg-gray-200 rounded-md">Batal</button>
                                <button type="submit" className="px-6 py-2 bg-[#2F4B8B] text-white rounded-md font-bold">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const PengeluaranTab: React.FC<{ expenses: Expense[], onSave: (e: any) => Promise<boolean>, onDelete: (id: string) => Promise<boolean> }> = ({ expenses, onSave, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => 
            e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
            e.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [expenses, searchTerm]);

    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
    const paginatedExpenses = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredExpenses.slice(start, start + itemsPerPage);
    }, [filteredExpenses, currentPage, itemsPerPage]);

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-4 md:space-y-0">
                <h2 className="text-xl font-bold text-blue-900">Audit Pengeluaran</h2>
                <div className="relative max-w-md w-full">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Cari deskripsi atau kategori..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Tanggal</th>
                            <th className="px-4 py-3">Deskripsi</th>
                            <th className="px-4 py-3">Kategori</th>
                            <th className="px-4 py-3 text-right">Jumlah</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {paginatedExpenses.map(e => (
                            <tr key={e.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{new Date(e.date).toLocaleDateString('id-ID')}</td>
                                <td className="px-4 py-3">{e.description}</td>
                                <td className="px-4 py-3">{e.category}</td>
                                <td className="px-4 py-3 text-right">Rp {e.amount.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => window.confirm('Hapus pengeluaran ini?') && onDelete(e.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                        {paginatedExpenses.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada pengeluaran ditemukan</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredExpenses.length}
                itemsPerPage={itemsPerPage}
            />
        </div>
    );
};

const TransaksiTab: React.FC<{ transactions: Transaction[], onSave: (t: Transaction) => Promise<boolean>, onDelete: (id: string) => Promise<boolean> }> = ({ transactions, onSave, onDelete }) => {
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => 
            t.transaction_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
            t.cashier_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [transactions, searchTerm]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTransactions.slice(start, start + itemsPerPage);
    }, [filteredTransactions, currentPage, itemsPerPage]);

    const handleEdit = (t: Transaction) => {
        setEditingTransaction(JSON.parse(JSON.stringify(t))); // Deep clone
    };

    const handleSaveEdit = async () => {
        if (!editingTransaction) return;
        await onSave(editingTransaction);
        setEditingTransaction(null);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-4 md:space-y-0">
                <h2 className="text-xl font-bold text-blue-900">Manajemen Transaksi</h2>
                <div className="relative max-w-md w-full">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Cari kode atau kasir..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Kode</th>
                            <th className="px-4 py-3">Tanggal</th>
                            <th className="px-4 py-3">Kasir</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {paginatedTransactions.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-mono font-bold">{t.transaction_code}</td>
                                <td className="px-4 py-3">{new Date(t.date).toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3">{t.cashier_name}</td>
                                <td className="px-4 py-3 text-right font-bold">Rp {t.total.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-800"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => window.confirm('Hapus transaksi ini?') && onDelete(t.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                        {paginatedTransactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada transaksi ditemukan</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredTransactions.length}
                itemsPerPage={itemsPerPage}
            />

            {/* Transaction Edit Modal */}
            {editingTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-bold text-blue-900">Edit Transaksi {editingTransaction.transaction_code}</h3>
                            <button onClick={() => setEditingTransaction(null)}><CloseIcon className="w-6 h-6"/></button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Metode Pembayaran</label>
                                <select 
                                    value={editingTransaction.payment_method}
                                    onChange={(e) => setEditingTransaction({...editingTransaction, payment_method: e.target.value as PaymentMethod})}
                                    className="mt-1 block w-full border rounded-md p-2"
                                >
                                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Total (Otomatis dihitung dari item)</label>
                                <div className="mt-1 p-2 bg-gray-100 rounded-md font-bold">Rp {editingTransaction.total.toLocaleString('id-ID')}</div>
                            </div>
                        </div>

                        <h4 className="font-bold mb-2">Item Transaksi</h4>
                        <div className="space-y-3 mb-6">
                            {editingTransaction.details.map((det, idx) => (
                                <div key={det.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex-grow">
                                        <p className="font-medium">Produk ID: {det.product_id}</p>
                                        <div className="flex space-x-4 text-sm text-gray-600">
                                            <span>Harga: Rp {det.unit_price.toLocaleString('id-ID')}</span>
                                            <span>Subtotal: Rp {det.subtotal.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <label className="text-xs">Qty:</label>
                                        <input 
                                            type="number" 
                                            value={det.quantity}
                                            onChange={(e) => {
                                                const newQty = parseInt(e.target.value) || 0;
                                                const newDetails = [...editingTransaction.details];
                                                newDetails[idx] = { ...det, quantity: newQty, subtotal: newQty * det.unit_price };
                                                const newTotal = newDetails.reduce((sum, d) => sum + d.subtotal, 0);
                                                setEditingTransaction({ ...editingTransaction, details: newDetails, total: newTotal });
                                            }}
                                            className="w-16 border rounded p-1 text-center"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newDetails = editingTransaction.details.filter((_, i) => i !== idx);
                                            const newTotal = newDetails.reduce((sum, d) => sum + d.subtotal, 0);
                                            setEditingTransaction({ ...editingTransaction, details: newDetails, total: newTotal });
                                        }}
                                        className="text-red-500"
                                    >
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setEditingTransaction(null)} className="px-4 py-2 bg-gray-200 rounded-md">Batal</button>
                            <button onClick={handleSaveEdit} className="px-6 py-2 bg-[#2F4B8B] text-white rounded-md font-bold">Simpan Perubahan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataManagementView;