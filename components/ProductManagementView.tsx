import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, Size, User, UserRole } from '../types';
import { PlusIcon, EditIcon, TrashIcon, CloseIcon, PackageIcon, UploadIcon, RefreshIcon } from './Icons';
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-blue-900">{productToEdit ? 'Edit Produk' : 'Tambah Produk'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500 hover:text-gray-800" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Produk</label>
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                                {product.image_url ? (
                                    <img src={product.image_url} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <PackageIcon className="w-8 h-8 text-gray-400" />
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
                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        <UploadIcon className="w-4 h-4" />
                                        <span>{isUploading ? 'Mengunggah...' : 'Upload Baru'}</span>
                                    </button>
                                    
                                    {existingImages.length > 0 && (
                                        <button 
                                            type="button"
                                            onClick={() => setShowImagePicker(!showImagePicker)}
                                            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                                        >
                                            <span>{showImagePicker ? 'Tutup Galeri' : 'Pilih dari Galeri'}</span>
                                        </button>
                                    )}
                                    
                                    {product.image_url !== DEFAULT_IMAGE_URL && (
                                        <button 
                                            type="button"
                                            onClick={() => setProduct(prev => ({ ...prev, image_url: DEFAULT_IMAGE_URL }))}
                                            className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                                        >
                                            <span>Reset Default</span>
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Format: JPG, PNG. Maks: 2MB</p>
                            </div>
                        </div>

                        {showImagePicker && existingImages.length > 0 && (
                            <div className="mt-4 p-3 border rounded-lg bg-gray-50">
                                <p className="text-xs font-bold text-gray-600 mb-2">Pilih dari gambar yang sudah ada:</p>
                                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                                    {existingImages.map((url, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => {
                                                setProduct(prev => ({ ...prev, image_url: url }));
                                                setShowImagePicker(false);
                                            }}
                                            className={`aspect-square rounded-md overflow-hidden border-2 cursor-pointer hover:border-blue-500 transition-colors ${product.image_url === url ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent'}`}
                                        >
                                            <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Nama Produk</label>
                        <input type="text" name="name" value={product.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ukuran</label>
                            <select name="size" value={product.size} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                {sizes.map(size => (
                                    <option key={size.id} value={size.name}>{size.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Barcode (Opsional)</label>
                            <input type="text" name="barcode" value={product.barcode || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Harga Jual (Rp)</label>
                            <input type="number" name="price" value={product.price} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required min="0" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stok Saat Ini</label>
                            <input type="number" name="stock" value={product.stock} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required min="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Batas Stok Menipis</label>
                            <input type="number" name="low_stock_threshold" value={product.low_stock_threshold} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required min="0" />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="flex items-center">
                            <input type="checkbox" name="is_active" checked={'is_active' in product ? product.is_active : true} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-700">Produk Aktif</span>
                        </label>
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
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(products.length / itemsPerPage);
  
  const existingImages = useMemo(() => {
    const urls = products
        .map(p => p.image_url)
        .filter((url): url is string => !!url && url !== DEFAULT_IMAGE_URL);
    return Array.from(new Set(urls));
  }, [products]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage]);
  
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Daftar Produk</h1>
        <div className="flex items-center space-x-2">
            {onRefresh && (
                <button 
                    onClick={onRefresh}
                    className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                    title="Segarkan Data"
                >
                    <RefreshIcon className="w-5 h-5" />
                </button>
            )}
            {isAdmin && (
                <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-[#2F4B8B] text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-800 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    <span>Tambah Produk</span>
                </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3">Gambar</th>
              <th scope="col" className="px-6 py-3">Nama Produk</th>
              <th scope="col" className="px-6 py-3">Barcode</th>
              <th scope="col" className="px-6 py-3">Ukuran</th>
              <th scope="col" className="px-6 py-3 text-right">Stok</th>
              <th scope="col" className="px-6 py-3 text-right">Harga Jual</th>
              <th scope="col" className="px-6 py-3">Status</th>
              {isAdmin && <th scope="col" className="px-6 py-3 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map(product => (
              <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded-md shadow" />
                    ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center"><PackageIcon className="w-6 h-6 text-gray-400"/></div>
                    )}
                </td>
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {product.name}
                </th>
                <td className="px-6 py-4 font-mono text-xs">{product.barcode || '-'}</td>
                <td className="px-6 py-4">{product.size}</td>
                <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${product.stock <= product.low_stock_threshold ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock}
                    </span>
                    {product.stock <= product.low_stock_threshold && (
                        <div className="text-[10px] text-red-500 font-bold uppercase">Menipis!</div>
                    )}
                </td>
                <td className="px-6 py-4 text-right">Rp {product.price.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                {isAdmin && (
                    <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenModal(product)} className="text-blue-600 hover:text-blue-800 mr-4"><EditIcon className="w-5 h-5" /></button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                    </td>
                )}
              </tr>
            ))}
            {paginatedProducts.length === 0 && (
                <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-gray-500">Belum ada produk.</td>
                </tr>
             )}
          </tbody>
        </table>
        
        <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={products.length}
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
