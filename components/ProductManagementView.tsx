import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, Size, User, UserRole } from '../types';
import { PlusIcon, EditIcon, TrashIcon, CloseIcon, PackageIcon, UploadIcon, SearchIcon } from './Icons';
import { uploadProductImage } from '../supabase';
import Pagination from './Pagination';

type ProductFormData = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

const DEFAULT_IMAGE_URL = 'https://wypzvbfvnrqfoebrgxnx.supabase.co/storage/v1/object/public/products/product-images/0.11999595837407073.jpg';

const emptyProduct: ProductFormData = {
    name: '',
    barcode: '',
    size: '',
    price: 0,
    cost_price: 0,
    stock: 0,
    low_stock_threshold: 5,
    use_stock: false,
    is_active: true,
    image_url: DEFAULT_IMAGE_URL,
};

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Product | ProductFormData) => Promise<void>;
    productToEdit: Product | null;
    sizes: Size[];
    existingImages: string[];
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, productToEdit, sizes, existingImages }) => {
    const [product, setProduct] = useState<Product | ProductFormData>(emptyProduct);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (productToEdit) {
            setProduct(productToEdit);
        } else {
            setProduct({ ...emptyProduct, size: sizes[0]?.name || '' });
        }
        setShowImagePicker(false);
    }, [productToEdit, isOpen, sizes]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setProduct(prev => ({ ...prev, [name]: checked }));
        } else {
            setProduct(prev => ({ 
                ...prev, 
                [name]: (name === 'price' || name === 'cost_price' || name === 'stock' || name === 'low_stock_threshold') 
                    ? parseFloat(value) 
                    : value 
            }));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const publicUrl = await uploadProductImage(file);
        if (publicUrl) {
            setProduct(prev => ({ ...prev, image_url: publicUrl }));
        } else {
            alert('Gagal mengunggah gambar. Pastikan Supabase sudah dikonfigurasi.');
        }
        setIsUploading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(product);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-slate-950/75 backdrop-blur-xs flex justify-center items-center z-[115] p-4 font-sans animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-2xl w-full max-w-md p-5 overflow-hidden max-h-[92vh] flex flex-col transition-all duration-200">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 bg-white dark:bg-slate-900 shrink-0">
                    <div>
                        <h2 className="text-sm font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">{productToEdit ? 'Edit Data Produk' : 'Tambah Produk Baru'}</h2>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-tight">Lengkapi informasi katalog snack/olahan Anda</p>
                    </div>
                    <button onClick={onClose} className="p-1 px-[5px] py-[5px] rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer"><CloseIcon className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 -mr-1 flex-grow">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-2">Gambar Produk</label>
                        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-850/55 border border-slate-100/80 dark:border-slate-800/70 rounded-xl p-2.5">
                            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200/50 dark:border-slate-800 shrink-0">
                                {product.image_url ? (
                                    <img src={product.image_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <PackageIcon className="w-6 h-6 text-slate-350 dark:text-slate-600" />
                                )}
                            </div>
                            <div className="flex-grow">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden" 
                                    accept="image/*"
                                />
                                <div className="flex flex-wrap gap-1.5">
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors text-[10px] font-bold disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer shadow-sm"
                                    >
                                        <UploadIcon className="w-3 h-3Color" />
                                        <span>{isUploading ? 'Unggah...' : 'Upload'}</span>
                                    </button>
                                    
                                    {existingImages.length > 0 && (
                                        <button 
                                            type="button"
                                            onClick={() => setShowImagePicker(!showImagePicker)}
                                            className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-[10px] font-bold cursor-pointer"
                                        >
                                            <span>{showImagePicker ? 'Tutup' : 'Dari Galeri'}</span>
                                        </button>
                                    )}
                                    
                                    {product.image_url !== DEFAULT_IMAGE_URL && (
                                        <button 
                                            type="button"
                                            onClick={() => setProduct(prev => ({ ...prev, image_url: DEFAULT_IMAGE_URL }))}
                                            className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors text-[10px] font-bold cursor-pointer"
                                        >
                                            <span>Reset</span>
                                        </button>
                                    )}
                                </div>
                                <p className="text-[9px] text-slate-450 dark:text-slate-500 mt-1 font-medium">Format: JPG, PNG. Maksimal file: 2MB</p>
                            </div>
                        </div>

                        {showImagePicker && existingImages.length > 0 && (
                            <div className="mt-4 p-3 border border-slate-150 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-slate-850/50">
                                <p className="text-[10px] font-bold text-gray-600 dark:text-slate-400 mb-2">Pilih dari gambar yang sudah ada:</p>
                                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                                    {existingImages.map((url, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => {
                                                setProduct(prev => ({ ...prev, image_url: url }));
                                                setShowImagePicker(false);
                                            }}
                                            className={`aspect-square rounded-md overflow-hidden border-2 cursor-pointer hover:border-blue-500 transition-colors ${product.image_url === url ? 'border-blue-600 ring-2 ring-blue-200 dark:ring-blue-900/40' : 'border-transparent'}`}
                                        >
                                            <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Nama Produk</label>
                        <input type="text" name="name" value={product.name} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs text-slate-800 dark:text-slate-150 font-semibold focus:outline-none focus:border-slate-400 dark:focus:border-slate-600" placeholder="Contoh: Keripik Singkong Balado" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Ukuran Satuan</label>
                            <select name="size" value={product.size} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs text-slate-700 dark:text-slate-350 font-bold focus:outline-none focus:border-slate-400 dark:focus:border-slate-600">
                                {sizes.map(size => (
                                    <option key={size.id} value={size.name}>{size.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Barcode (Opsional)</label>
                            <input type="text" name="barcode" value={product.barcode || ''} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600" placeholder="Kode barcode" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Harga Modal (Rp)</label>
                            <input type="number" name="cost_price" value={product.cost_price} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-slate-400 dark:focus:border-slate-600" required min="0" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Harga Jual (Rp)</label>
                            <input type="number" name="price" value={product.price} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 font-extrabold focus:outline-none focus:border-slate-400 dark:focus:border-slate-600" required min="0" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Stok Tersedia</label>
                            <input 
                                type="number" 
                                name="stock" 
                                value={product.stock} 
                                onChange={handleChange} 
                                className={`w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-slate-450 dark:focus:border-slate-600 ${!product.use_stock ? 'bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-150/40 dark:border-slate-800' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-200'}`} 
                                required={product.use_stock} 
                                min="0" 
                                disabled={!product.use_stock}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Peringatan Batas Stok</label>
                            <input 
                                type="number" 
                                name="low_stock_threshold" 
                                value={product.low_stock_threshold} 
                                onChange={handleChange} 
                                className={`w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-slate-405 dark:focus:border-slate-600 ${!product.use_stock ? 'bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-150/40 dark:border-slate-800' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-755 text-slate-800 dark:text-slate-200'}`} 
                                required={product.use_stock} 
                                min="0" 
                                disabled={!product.use_stock}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-850/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/85">
                        <label className="flex items-center cursor-pointer select-none">
                            <input type="checkbox" name="is_active" checked={'is_active' in product ? product.is_active : true} onChange={handleChange} className="h-4 w-4 rounded-md border-slate-350 dark:border-slate-700 text-slate-900 focus:ring-slate-950" />
                            <span className="ml-2 text-[11px] font-bold text-slate-605 dark:text-slate-350">Produk Aktif</span>
                        </label>
                        <label className="flex items-center cursor-pointer select-none">
                            <input type="checkbox" name="use_stock" checked={product.use_stock} onChange={handleChange} className="h-4 w-4 rounded-md border-slate-350 dark:border-slate-700 text-slate-900 focus:ring-slate-955" />
                            <span className="ml-2 text-[11px] font-bold text-slate-605 dark:text-slate-350">Gunakan Stok</span>
                        </label>
                    </div>
                    <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer">Batal</button>
                        <button type="submit" disabled={isSaving} className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-200 disabled:bg-slate-200 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 shadow-sm cursor-pointer">
                            {isSaving ? 'Menyimpan...' : 'Simpan Detail'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ProductManagementViewProps {
  products: Product[];
  onSaveProduct: (productData: Product | ProductFormData) => Promise<boolean>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
  sizes: Size[];
  currentUser: User;
  onRefresh?: () => void;
}

const ProductManagementView: React.FC<ProductManagementViewProps> = ({ products, onSaveProduct, onDeleteProduct, sizes, currentUser, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;
  
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      p.size.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  const existingImages = useMemo(() => {
    const urls = products
        .map(p => p.image_url)
        .filter((url): url is string => !!url && url !== DEFAULT_IMAGE_URL);
    return Array.from(new Set(urls));
  }, [products]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);
  
  const isAdmin = currentUser.role?.toLowerCase() === 'admin';
  console.log('ProductManagementView: currentUser role:', currentUser.role, 'isAdmin:', isAdmin);

  const handleOpenModal = (product: Product | null = null) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProductToEdit(null);
  };

  const handleSaveProduct = async (productData: Product | ProductFormData) => {
    const success = await onSaveProduct(productData);
    if (success) {
      handleCloseModal();
    }
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if(window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        await onDeleteProduct(productId);
    }
  };

  return (
    <div className="p-0.5 space-y-4 font-sans animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-150/40 dark:border-slate-800 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">Inventaris & Stok Kelola</h2>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">Daftar Produk Toko</h1>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Kelola nama produk, stock limits, harga beli/jual secara efisien</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2.5 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
            <div className="relative w-full sm:w-56 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-9 pr-3 py-1.5 border border-slate-205 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 font-semibold"
                />
            </div>
            {isAdmin && (
                <button 
                  onClick={() => handleOpenModal()} 
                  className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-3.5 py-2 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all text-xs font-bold shadow-sm cursor-pointer shrink-0"
                >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Tambah Produk</span>
                </button>
            )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150/50 dark:border-slate-800/80 overflow-hidden shadow-[0_2px_12px_rgba(15,23,42,0.015)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
              <tr>
                <th className="px-5 py-3">Gambar</th>
                <th className="px-5 py-3">Nama Produk</th>
                <th className="px-5 py-3">Barcode</th>
                <th className="px-5 py-3">Ukuran</th>
                <th className="px-5 py-3 text-right">Stok</th>
                <th className="px-5 py-3 text-right">Harga Jual</th>
                <th className="px-5 py-3">Status</th>
                {isAdmin && <th className="px-5 py-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-350">
              {paginatedProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-2.5">
                      {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-9 h-9 object-cover rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm" referrerPolicy="no-referrer" />
                      ) : (
                          <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 border border-slate-100/60 dark:border-slate-750 rounded-lg flex items-center justify-center"><PackageIcon className="w-4 h-4 text-slate-350 dark:text-slate-500"/></div>
                      )}
                  </td>
                  <td className="px-5 py-2.5 font-bold text-slate-800 dark:text-slate-150 whitespace-nowrap">
                    {product.name}
                  </td>
                  <td className="px-5 py-2.5 font-mono text-slate-400 dark:text-slate-500">{product.barcode || '-'}</td>
                  <td className="px-5 py-2.5">
                    <span className="inline-block bg-slate-100 dark:bg-slate-800 border border-slate-150/40 dark:border-slate-700 text-slate-650 dark:text-slate-300 font-bold text-[10px] px-1.5 py-0.5 rounded">
                      {product.size}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                      {product.use_stock ? (
                          <div className="flex flex-col items-end">
                              <span className={`font-bold font-mono ${product.stock <= product.low_stock_threshold ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {product.stock}
                              </span>
                              {product.stock <= product.low_stock_threshold && (
                                  <span className="text-[8px] text-red-500 font-extrabold uppercase tracking-wider leading-none mt-0.5 animate-pulse">Menipis!</span>
                              )}
                          </div>
                      ) : (
                          <span className="text-slate-350 dark:text-slate-600 font-medium italic text-[10px]">Abaikan Stok</span>
                      )}
                  </td>
                  <td className="px-5 py-2.5 text-right font-black text-slate-800 dark:text-slate-100 font-mono">Rp{product.price.toLocaleString('id-ID')}</td>
                  <td className="px-5 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${product.is_active ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border border-rose-100/60 dark:border-rose-900/30'}`}>
                      {product.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  {isAdmin && (
                      <td className="px-5 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleOpenModal(product)} className="p-1 px-[5px] text-slate-500 hover:text-slate-805 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-transparent rounded-lg transition-colors cursor-pointer" title="Edit"><EditIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-1 px-[5px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/35 border border-transparent rounded-lg transition-colors cursor-pointer" title="Hapus"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      </td>
                  )}
                </tr>
              ))}
              {paginatedProducts.length === 0 && (
                  <tr>
                      <td colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-slate-400 dark:text-slate-600 font-semibold">Produk tidak ditemukan.</td>
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
      </div>
      
      <ProductFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        sizes={sizes}
        existingImages={existingImages}
      />
    </div>
  );
};

export default ProductManagementView;
