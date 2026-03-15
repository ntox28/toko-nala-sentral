import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, CartItem, PaymentMethod, Transaction, User, TransactionDetail } from '../types';
import { PlusIcon, MinusIcon, TrashIcon, PackageIcon, BarcodeIcon, RefreshIcon, ShoppingCartIcon, CloseIcon, SearchIcon } from './Icons';
import Pagination from './Pagination';

interface POSViewProps {
  products: Product[];
  onTransactionComplete: (transaction: Transaction) => void;
  currentUser: User;
  onRefresh?: () => void;
}

const ProductCard: React.FC<{ product: Product; onAddToCart: (product: Product) => void; }> = ({ product, onAddToCart }) => (
    <div 
        onClick={() => onAddToCart(product)}
        className="bg-white rounded-lg shadow-sm flex flex-col cursor-pointer hover:shadow-md hover:ring-1 hover:ring-blue-500 transition-all duration-200 overflow-hidden border border-gray-100"
    >
        <div className="w-full h-24 bg-gray-50 flex items-center justify-center">
             {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
             ) : (
                <PackageIcon className="w-10 h-10 text-gray-300" />
             )}
        </div>
        <div className="p-2 flex flex-col justify-between flex-grow">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-xs font-bold text-gray-800 truncate flex-grow leading-tight">{product.name}</h3>
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ml-1 whitespace-nowrap ${product.stock <= product.low_stock_threshold ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                        {product.stock}
                    </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">{product.size}</p>
            </div>
            <div className="flex justify-between items-center mt-1">
                {product.stock <= 0 ? (
                    <span className="text-[9px] text-red-600 font-bold uppercase">Habis</span>
                ) : <div />}
                <p className="text-sm font-bold text-blue-900">
                    Rp {product.price.toLocaleString('id-ID')}
                </p>
            </div>
        </div>
    </div>
);

const Cart: React.FC<{
    cart: CartItem[];
    updateQuantity: (productId: string, newQuantity: number) => void;
    removeFromCart: (productId:string) => void;
    total: number;
    onProceed: () => void;
}> = ({ cart, updateQuantity, removeFromCart, total, onProceed }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col lg:h-full">
            <h2 className="text-2xl font-bold text-blue-900 border-b pb-4 mb-4">Keranjang</h2>
            {cart.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-gray-500">
                    <p>Pilih produk untuk memulai</p>
                </div>
            ) : (
                <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                    {cart.map(item => (
                        <div key={item.productId} className="flex items-center mb-4">
                            <div className="flex-grow">
                                <p className="font-semibold text-gray-800">{item.name} <span className="text-sm font-normal text-gray-500">({item.size})</span></p>
                                <p className="text-sm text-gray-600">Rp {item.unitPrice.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><MinusIcon className="w-4 h-4" /></button>
                                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><PlusIcon className="w-4 h-4" /></button>
                            </div>
                            <div className="ml-4 text-right w-20 font-semibold">
                                Rp {item.subtotal.toLocaleString('id-ID')}
                            </div>
                            <button onClick={() => removeFromCart(item.productId)} className="ml-2 text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    ))}
                </div>
            )}
            <div className="border-t pt-4 mt-auto">
                <div className="flex justify-between text-xl font-bold mb-4">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString('id-ID')}</span>
                </div>
                
                <button
                    disabled={cart.length === 0}
                    onClick={onProceed}
                    className="w-full bg-[#2F4B8B] text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
                >
                    Lanjutkan
                </button>
            </div>
        </div>
    );
};

interface CheckoutConfirmationModalProps {
    cart: CartItem[];
    total: number;
    onClose: () => void;
    onConfirm: (paymentMethod: PaymentMethod, amountReceived: number, discountType: 'percent' | 'nominal', discountValue: number, discountAmount: number) => void;
    isProcessing: boolean;
}

const CheckoutConfirmationModal: React.FC<CheckoutConfirmationModalProps> = ({ cart, total, onClose, onConfirm, isProcessing }) => {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.TUNAI);
    const [amountReceived, setAmountReceived] = useState('');
    const [discountType, setDiscountType] = useState<'percent' | 'nominal'>('percent');
    const [discountValue, setDiscountValue] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const discountAmount = useMemo(() => {
        if (discountType === 'percent') {
            return (total * discountValue) / 100;
        }
        return discountValue;
    }, [total, discountType, discountValue]);

    const finalTotal = Math.max(0, total - discountAmount);

    const change = useMemo(() => {
        if (paymentMethod !== PaymentMethod.TUNAI) return 0;
        const received = parseFloat(amountReceived);
        if (isNaN(received) || received < finalTotal) return 0;
        return received - finalTotal;
    }, [amountReceived, finalTotal, paymentMethod]);

    const handleConfirm = () => {
        setError(null);
        let received = parseFloat(amountReceived);
        if (paymentMethod === PaymentMethod.TUNAI && (isNaN(received) || received < finalTotal)) {
            setError('Uang diterima tidak cukup.');
            return;
        }
        onConfirm(paymentMethod, received || 0, discountType, discountValue, discountAmount);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-blue-900">Konfirmasi Pembayaran</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    <div className="mb-6">
                        <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">Ringkasan Pesanan</h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            {cart.map(item => (
                                <div key={item.productId} className="flex justify-between text-sm">
                                    <span>{item.name} x {item.quantity}</span>
                                    <span className="font-medium">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                                </div>
                            ))}
                            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                <span>Subtotal</span>
                                <span>Rp {total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">Diskon</h4>
                        <div className="flex space-x-2 items-center">
                            <select 
                                value={discountType} 
                                onChange={(e) => setDiscountType(e.target.value as 'percent' | 'nominal')}
                                className="border rounded-md p-2 text-sm bg-white"
                            >
                                <option value="percent">%</option>
                                <option value="nominal">Rp</option>
                            </select>
                            <input 
                                type="number" 
                                value={discountValue || ''} 
                                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="border rounded-md p-2 text-sm flex-grow"
                            />
                            {discountValue > 0 && (
                                <button 
                                    onClick={() => setDiscountValue(0)}
                                    className="text-red-500 text-xs font-bold hover:underline"
                                >
                                    Hapus
                                </button>
                            )}
                        </div>
                        {discountAmount > 0 && (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                                Potongan: Rp {discountAmount.toLocaleString('id-ID')}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">Metode Pembayaran</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.values(PaymentMethod).map(method => (
                                    <button 
                                        key={method} 
                                        onClick={() => setPaymentMethod(method)}
                                        className={`p-2 rounded-md text-xs font-bold transition-colors border ${paymentMethod === method ? 'bg-[#2F4B8B] text-white border-[#2F4B8B]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">Pembayaran</h4>
                            {paymentMethod === PaymentMethod.TUNAI ? (
                                <div className="space-y-3">
                                    <input 
                                        type="number"
                                        value={amountReceived}
                                        onChange={(e) => setAmountReceived(e.target.value)}
                                        placeholder="Uang diterima..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Kembalian:</span>
                                        <span className="font-bold text-green-600 text-lg">Rp {change.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-blue-50 rounded-md text-blue-700 text-sm italic">
                                    Pembayaran non-tunai akan diproses sesuai total akhir.
                                </div>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm mt-4 font-medium">{error}</p>}
                </div>

                <div className="p-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-left w-full sm:w-auto">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Akhir</p>
                        <p className="text-2xl font-black text-blue-900">Rp {finalTotal.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex space-x-2 w-full sm:w-auto">
                        <button 
                            onClick={onClose}
                            className="flex-grow sm:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-bold transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            disabled={isProcessing}
                            onClick={handleConfirm}
                            className="flex-grow sm:flex-none px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-colors shadow-lg disabled:bg-gray-400"
                        >
                            {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// FIX: The POSView component was incomplete. It has been fully implemented, including state management, event handlers, a return statement, and a default export. This resolves all reported errors.
const POSView: React.FC<POSViewProps> = ({ products, onTransactionComplete, currentUser, onRefresh }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const activeProducts = useMemo(() => {
    const filtered = products.filter(p => p.is_active);
    let result = filtered;
    if (searchTerm) {
      result = filtered.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return result;
  }, [products, searchTerm]);

  const totalPages = Math.ceil(activeProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activeProducts.slice(start, start + itemsPerPage);
  }, [activeProducts, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  const handleAddToCart = useCallback((product: Product) => {
    if (product.stock <= 0) {
        alert('Stok produk habis!');
        return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            alert('Tidak dapat menambah lebih banyak. Stok terbatas.');
            return prevCart;
        }
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            name: product.name,
            size: product.size,
            quantity: 1,
            unitPrice: product.price,
            subtotal: product.price,
          },
        ];
      }
    });
  }, []);

  const handleUpdateQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.productId !== productId));
    } else {
      const product = products.find(p => p.id === productId);
      if (product && newQuantity > product.stock) {
          alert(`Stok tidak mencukupi. Maksimal stok: ${product.stock}`);
          return;
      }
      setCart(prevCart =>
        prevCart.map(item =>
          item.productId === productId
            ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
            : item
        )
      );
    }
  }, [products]);

  const handleRemoveFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  }, []);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);

  const handleCompleteTransaction = useCallback(async (
    paymentMethod: PaymentMethod, 
    amountReceived: number, 
    discountType: 'percent' | 'nominal', 
    discountValue: number, 
    discountAmount: number
  ): Promise<boolean> => {
    if (cart.length === 0 || !currentUser) return false;

    setIsProcessing(true);
    const transactionCode = `NALA-${Date.now()}`;
    const transactionDate = new Date().toISOString();
    const finalTotal = Math.max(0, total - discountAmount);
    
    const newTransaction: Transaction = {
        id: `trans-${Date.now()}`,
        transaction_code: transactionCode,
        date: transactionDate,
        cashier_id: currentUser.id,
        cashier_name: currentUser.name,
        total: finalTotal,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: discountAmount,
        payment_method: paymentMethod,
        amount_received: amountReceived,
        change: paymentMethod === PaymentMethod.TUNAI ? amountReceived - finalTotal : 0,
        details: cart.map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            return {
                id: `det-${Date.now()}-${index}`,
                transaction_id: `trans-${Date.now()}`,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                cost_price: product?.cost_price || 0,
                subtotal: item.subtotal
            };
        })
    };

    onTransactionComplete(newTransaction);
    setCart([]);
    setShowConfirmModal(false);
    setIsProcessing(false);
    return true;
  }, [cart, total, currentUser, onTransactionComplete, products]);

  return (
    <div className="flex flex-col h-full p-4 lg:p-6 space-y-6">
      <div className="flex-grow overflow-hidden flex flex-col">
        <div className="mb-6 flex space-x-2 items-center">
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
            </div>
            
            <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 bg-blue-100 text-[#2F4B8B] rounded-lg hover:bg-blue-200 transition-colors"
                title="Lihat Keranjang"
            >
                <ShoppingCartIcon className="w-6 h-6" />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                )}
            </button>

            <button 
                title="Scan Barcode"
                className="p-2 bg-blue-100 text-[#2F4B8B] rounded-lg hover:bg-blue-200 transition-colors"
                onClick={() => {
                    alert('Fitur Barcode Scanner akan segera hadir!');
                }}
            >
                <BarcodeIcon className="w-6 h-6" />
            </button>
            {onRefresh && (
                <button 
                    title="Segarkan Data"
                    className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                    onClick={onRefresh}
                >
                    <RefreshIcon className="w-6 h-6" />
                </button>
            )}
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
                {paginatedProducts.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
                {paginatedProducts.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center text-gray-500 h-64">
                        <PackageIcon className="w-16 h-16 mb-4"/>
                        <p>Tidak ada produk aktif yang tersedia.</p>
                    </div>
                )}
            </div>
        </div>
        
        <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={activeProducts.length}
            itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Cart Modal/Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-blue-900 text-white">
                    <div className="flex items-center space-x-2">
                        <ShoppingCartIcon className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Keranjang Belanja</h2>
                    </div>
                    <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-blue-800 rounded-full">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-hidden">
                    <Cart 
                        cart={cart}
                        updateQuantity={handleUpdateQuantity}
                        removeFromCart={handleRemoveFromCart}
                        total={total}
                        onProceed={() => {
                            setIsCartOpen(false);
                            setShowConfirmModal(true);
                        }}
                    />
                </div>
            </div>
        </div>
      )}

      {showConfirmModal && (
          <CheckoutConfirmationModal 
            cart={cart}
            total={total}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={handleCompleteTransaction}
            isProcessing={isProcessing}
          />
      )}
    </div>
  );
};

export default POSView;