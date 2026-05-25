import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Transaction, Product, Expense, Size, PaymentMethod } from '../types';
import { TrashIcon, EditIcon, PlusIcon, PackageIcon, ReceiptRefundIcon, ChartBarIcon, ArchiveBoxIcon, CloseIcon, DownloadIcon, UploadIcon, SearchIcon } from './Icons';
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
    <div className="p-0.5 space-y-4 font-sans animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-150/40 dark:border-slate-800/80 space-y-2 md:space-y-0">
        <div>
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">Portal Administrator</h2>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">Manajemen Data Base</h1>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Urus master data ukuran, katalog produk, pengeluaran kas, serta hapus/audit riwayat transaksi</p>
        </div>
      </div>
      
      <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-150/45 dark:border-slate-800 max-w-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setEditingItem(null); }}
            className={`flex items-center justify-center space-x-1.5 flex-1 py-2 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-xs'
                : 'text-slate-400 dark:text-slate-550 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150/50 dark:border-slate-800/80 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.015)]">
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
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Manajemen Ukuran</h2>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={downloadTemplate}
                        className="flex items-center space-x-1 text-xs bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 transition-colors cursor-pointer"
                    >
                        <DownloadIcon className="w-3.5 h-3.5" />
                        <span>Template Excel</span>
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-1 text-xs bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 transition-colors cursor-pointer"
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
            
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="text-slate-400 w-4 h-4" />
                    </div>
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Cari ukuran..."
                        className="w-full pl-9 pr-4 py-1.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs text-slate-850 dark:text-slate-100 rounded-xl font-medium focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-xs"
                    />
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Nama Ukuran"
                        className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs text-slate-850 dark:text-slate-100 rounded-xl font-medium focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-xs"
                        required
                    />
                    <button type="submit" className="bg-slate-950 hover:bg-slate-850 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors">
                        {editingId ? 'Simpan' : 'Tambah'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={() => { setEditingId(null); setName(''); }} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer">Batal</button>
                    )}
                </form>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {paginatedSizes.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-150/60 dark:border-slate-850/60 hover:border-slate-205 dark:hover:border-slate-755 transition-colors">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{s.name}</span>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => { setEditingId(s.id); setName(s.name); }} className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><EditIcon className="w-3.5 h-3.5"/></button>
                            <button onClick={() => window.confirm('Hapus ukuran ini?') && onDelete(s.id)} className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"><TrashIcon className="w-3.5 h-3.5"/></button>
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
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                    <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Katalog Produk & Harga Modal</h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic mt-0.5">* Atur harga modal rahasia yang tidak tampak di modul kasir.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={downloadTemplate}
                        className="flex items-center space-x-1 text-xs bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-755 transition-colors cursor-pointer"
                    >
                        <DownloadIcon className="w-3.5 h-3.5" />
                        <span>Template Excel</span>
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-1 text-xs bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 transition-colors cursor-pointer"
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
            
            <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="text-slate-400 w-4 h-4" />
                </div>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    placeholder="Cari produk atau barcode..."
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs text-slate-855 dark:text-slate-100 rounded-xl font-medium focus:outline-none focus:border-slate-400 dark:focus:border-slate-655 shadow-xs"
                />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-150/40 dark:border-slate-800/70">
                <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-150/40 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="px-4 py-2.5">Nama Produk</th>
                            <th className="px-4 py-2.5">Barcode</th>
                            <th className="px-4 py-2.5">Stok</th>
                            <th className="px-4 py-2.5 text-right">Modal</th>
                            <th className="px-4 py-2.5 text-right">Harga Jual</th>
                            <th className="px-4 py-2.5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-705 dark:text-slate-350">
                        {paginatedProducts.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-150">
                                    {p.name} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({p.size})</span>
                                </td>
                                <td className="px-4 py-3 font-mono text-[10px] text-slate-400 dark:text-slate-500">{p.barcode || '-'}</td>
                                <td className="px-4 py-3">
                                    <span className={`font-mono font-bold ${p.stock <= p.low_stock_threshold ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {p.stock} pcs
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-indigo-650 dark:text-indigo-400 font-mono">Rp{p.cost_price?.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100 font-mono">Rp{p.price.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                                    <button onClick={() => handleEdit(p)} className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><EditIcon className="w-3.5 h-3.5"/></button>
                                    <button onClick={() => window.confirm('Hapus produk ini?') && onDelete(p.id)} className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-455 transition-colors"><TrashIcon className="w-3.5 h-3.5"/></button>
                                </td>
                            </tr>
                        ))}
                        {paginatedProducts.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 dark:text-slate-655 font-semibold">Tidak ada produk ditemukan</td>
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
                <div className="fixed inset-0 bg-slate-905/60 dark:bg-black/70 backdrop-blur-xs flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-805 shadow-xl animate-fade-in text-slate-800 dark:text-slate-100">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-150/40 dark:border-slate-800">
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Edit Detail & Harga Modal</h3>
                            <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><CloseIcon className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800">
                                    {editingProduct.image_url ? (
                                        <img src={editingProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <PackageIcon className="w-6 h-6 text-slate-400 dark:text-slate-600" />
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
                                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-[10px] font-bold disabled:bg-slate-100/50 disabled:text-slate-400"
                                    >
                                        <UploadIcon className="w-3.5 h-3.5" />
                                        <span>{isUploading ? 'Proses...' : 'Ubah Gambar'}</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 leading-none">Nama Produk</label>
                                <input 
                                    type="text" 
                                    value={editingProduct.name} 
                                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-xs"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 leading-none">Barcode</label>
                                    <input 
                                        type="text" 
                                        value={editingProduct.barcode || ''} 
                                        onChange={(e) => setEditingProduct({...editingProduct, barcode: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-xs font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 leading-none">Ukuran</label>
                                    <select 
                                        value={editingProduct.size} 
                                        onChange={(e) => setEditingProduct({...editingProduct, size: e.target.value})}
                                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-xs"
                                    >
                                        {sizes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-550 mb-1 leading-none">Harga Modal (Rp)</label>
                                    <input 
                                        type="number" 
                                        value={editingProduct.cost_price} 
                                        onChange={(e) => setEditingProduct({...editingProduct, cost_price: parseFloat(e.target.value) || 0})}
                                        className="w-full px-3 py-2 border-2 border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/10 dark:bg-indigo-950/20 text-indigo-705 dark:text-indigo-400 rounded-xl focus:outline-none focus:border-indigo-400 font-bold font-mono"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 leading-none">Harga Jual (Rp)</label>
                                    <input 
                                        type="number" 
                                        value={editingProduct.price} 
                                        onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 font-bold font-mono"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 leading-none">Stok Saat Ini</label>
                                    <input 
                                        type="number" 
                                        value={editingProduct.stock} 
                                        onChange={(e) => setEditingProduct({...editingProduct, stock: parseFloat(e.target.value) || 0})}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-855 dark:text-slate-100 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 font-mono font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 leading-none">Min. Batas Habis</label>
                                    <input 
                                        type="number" 
                                        value={editingProduct.low_stock_threshold} 
                                        onChange={(e) => setEditingProduct({...editingProduct, low_stock_threshold: parseFloat(e.target.value) || 0})}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-855 dark:text-slate-100 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 font-mono"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-705 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-colors">Batal</button>
                                <button type="submit" className="px-5 py-2 bg-slate-950 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-indigo-50 hover:bg-slate-850 text-white rounded-xl font-bold cursor-pointer transition-colors">Simpan</button>
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
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Audit Pengeluaran Toko</h2>
                <div className="relative max-w-md w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="text-slate-400 w-4 h-4" />
                    </div>
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Cari deskripsi atau kategori..."
                        className="w-full pl-9 pr-4 py-1.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs text-slate-855 dark:text-slate-100 rounded-xl font-medium focus:outline-none focus:border-slate-400 dark:focus:border-slate-655 shadow-xs"
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-150/40 dark:border-slate-800/70">
                <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-150/40 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="px-4 py-2.5">Tanggal</th>
                            <th className="px-4 py-2.5">Deskripsi</th>
                            <th className="px-4 py-2.5">Kategori</th>
                            <th className="px-4 py-2.5 text-right">Jumlah</th>
                            <th className="px-4 py-2.5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-705 dark:text-slate-350">
                        {paginatedExpenses.map(e => (
                            <tr key={e.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors">
                                <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-450">{new Date(e.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-150">{e.description}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-semibold text-[10px]">
                                        {e.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-rose-500 dark:text-rose-400 font-mono">Rp{e.amount.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => window.confirm('Hapus pengeluaran ini?') && onDelete(e.id)} className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-455 transition-colors"><TrashIcon className="w-3.5 h-3.5"/></button>
                                </td>
                            </tr>
                        ))}
                        {paginatedExpenses.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-650 font-semibold">Tidak ada data pengeluaran</td>
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
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Manajemen Arsip Transaksi</h2>
                <div className="relative max-w-md w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="text-slate-400 w-4 h-4" />
                    </div>
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Cari kode atau kasir..."
                        className="w-full pl-9 pr-4 py-1.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs text-slate-855 dark:text-slate-100 rounded-xl font-medium focus:outline-none focus:border-slate-400 dark:focus:border-slate-655 shadow-xs"
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-150/40 dark:border-slate-800/70">
                <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-150/40 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="px-4 py-2.5">Kode Transaksi</th>
                            <th className="px-4 py-2.5">Waktu</th>
                            <th className="px-4 py-2.5">Kasir</th>
                            <th className="px-4 py-2.5 text-right">Total Belanja</th>
                            <th className="px-4 py-2.5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-705 dark:text-slate-350">
                        {paginatedTransactions.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors">
                                <td className="px-4 py-3 font-mono font-bold text-slate-850 dark:text-slate-100">{t.transaction_code}</td>
                                <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-450">{new Date(t.date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{t.cashier_name}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">Rp{t.total.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                                    <button onClick={() => handleEdit(t)} className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><EditIcon className="w-3.5 h-3.5"/></button>
                                    <button onClick={() => window.confirm('Hapus transaksi ini?') && onDelete(t.id)} className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-455 transition-colors"><TrashIcon className="w-3.5 h-3.5"/></button>
                                </td>
                            </tr>
                        ))}
                        {paginatedTransactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-650 font-semibold">Tidak ada data transaksi ditemukan</td>
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
                <div className="fixed inset-0 bg-slate-905/60 dark:bg-black/70 backdrop-blur-xs flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl p-6 border border-slate-105 dark:border-slate-805 shadow-xl animate-fade-in text-slate-800 dark:text-slate-100 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-150/40 dark:border-slate-800">
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Koreksi Transaksi {editingTransaction.transaction_code}</h3>
                            <button onClick={() => setEditingTransaction(null)}><CloseIcon className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"/></button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-5 text-xs font-semibold">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">Metode Pembayaran</label>
                                <select 
                                    value={editingTransaction.payment_method}
                                    onChange={(e) => setEditingTransaction({...editingTransaction, payment_method: e.target.value as PaymentMethod})}
                                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-855 dark:text-slate-100 rounded-xl focus:outline-none focus:border-slate-450"
                                >
                                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">Total Belanja (Auto-kalkulasi)</label>
                                <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 border border-slate-100 dark:border-slate-850">Rp{editingTransaction.total.toLocaleString('id-ID')}</div>
                            </div>
                        </div>

                        <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2 tracking-wider">Item dalam Transaksi</h4>
                        <div className="space-y-2 mb-6 text-xs font-semibold">
                            {editingTransaction.details.map((det, idx) => (
                                <div key={det.id} className="flex items-center space-x-4 p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-150/50 dark:border-slate-850/50 hover:border-slate-200 dark:hover:border-slate-800 transition-colors">
                                    <div className="flex-grow">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">Produk ID: {det.product_id}</p>
                                        <div className="flex items-center space-x-3 text-[10px] text-slate-400     mt-0.5">
                                            <span>Unit: Rp{det.unit_price.toLocaleString('id-ID')}</span>
                                            <span>Subtotal: Rp{det.subtotal.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Qty:</label>
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
                                            className="w-16 border border-slate-200 dark:border-slate-800 rounded-xl py-1 px-2 text-center bg-white dark:bg-slate-950 dark:text-white font-bold font-mono"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newDetails = editingTransaction.details.filter((_, i) => i !== idx);
                                            const newTotal = newDetails.reduce((sum, d) => sum + d.subtotal, 0);
                                            setEditingTransaction({ ...editingTransaction, details: newDetails, total: newTotal });
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2 text-xs font-bold">
                            <button onClick={() => setEditingTransaction(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-705 dark:text-slate-300 rounded-xl transition-colors cursor-pointer">Batal</button>
                            <button onClick={handleSaveEdit} className="px-5 py-2 bg-slate-950 dark:bg-slate-100 dark:text-slate-950 hover:bg-slate-850 dark:hover:bg-indigo-50 text-white rounded-xl transition-colors cursor-pointer">Simpan Perubahan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataManagementView;