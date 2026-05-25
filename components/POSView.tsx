import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, CartItem, PaymentMethod, Transaction, User, TransactionDetail } from '../types';
import { PlusIcon, MinusIcon, TrashIcon, PackageIcon, BarcodeIcon, ShoppingCartIcon, CloseIcon, SearchIcon } from './Icons';
import Pagination from './Pagination';

interface POSViewProps {
  products: Product[];
  onTransactionComplete: (transaction: Transaction) => void;
  onSaveProduct: (product: any) => Promise<Product | null>;
  currentUser: User;
  onRefresh?: () => void;
}

const ProductCard: React.FC<{ product: Product; onAddToCart: (product: Product) => void; }> = ({ product, onAddToCart }) => (
    <div 
        onClick={() => onAddToCart(product)}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100/80 dark:border-slate-800/85 flex flex-col cursor-pointer hover:shadow-lg dark:hover:shadow-none hover:border-slate-350 dark:hover:border-slate-700 hover:scale-[1.01] transition-all duration-200 overflow-hidden"
    >
        <div className="w-full h-24 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-center overflow-hidden relative">
             {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform hover:scale-110" />
             ) : (
                <PackageIcon className="w-8 h-8 text-slate-300 dark:text-slate-700" />
             )}
             <span className={`absolute top-2 right-2 text-[8px] font-black tracking-wider px-2 py-0.5 rounded-full uppercase ${product.use_stock && product.stock <= product.low_stock_threshold ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-100/50 dark:border-red-900/45' : 'bg-slate-100/80 dark:bg-slate-900 text-slate-600 dark:text-slate-450 border border-slate-200/40 dark:border-slate-800/80'}`}>
                 {product.use_stock ? `${product.stock} pcs` : '∞'}
             </span>
        </div>
        <div className="p-3 flex flex-col justify-between flex-grow">
            <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-250 truncate leading-tight tracking-tight">{product.name}</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{product.size}</p>
            </div>
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50 dark:border-slate-850/50">
                {product.use_stock && product.stock <= 0 ? (
                    <span className="text-[8px] text-red-600 dark:text-red-400 font-extrabold uppercase tracking-widest bg-red-50/70 dark:bg-red-950/40 px-1.5 py-0.5 rounded">Habis</span>
                ) : <div />}
                <p className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono">
                    Rp{product.price.toLocaleString('id-ID')}
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 flex flex-col h-full transition-colors">
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 border-b border-slate-55 dark:border-slate-800 pb-3 mb-4 tracking-wider uppercase">Keranjang Belanja</h2>
            {cart.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs py-16">
                    <PackageIcon className="w-10 h-10 text-slate-200 dark:text-slate-800 mb-2.5" />
                    <p className="font-extrabold text-slate-600 dark:text-slate-400">Keranjang masih kosong</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Ketuk produk di galeri untuk menambah</p>
                </div>
            ) : (
                <div className="flex-grow overflow-y-auto pr-1 -mr-1 space-y-3 max-h-[55vh]">
                    {cart.map(item => (
                        <div key={item.productId} className="flex items-center gap-3 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-100/50 dark:hover:bg-slate-950 border border-slate-100/40 dark:border-slate-800/80 p-2.5 rounded-xl transition-colors">
                            <div className="flex-grow min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate leading-none mb-1">
                                    {item.name} 
                                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-1">({item.size})</span>
                                </p>
                                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold font-mono">Rp {item.unitPrice.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-lg p-0.5">
                                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"><MinusIcon className="w-2.5 h-2.5" /></button>
                                <span className="w-6 text-center text-xs font-extrabold font-mono text-slate-800 dark:text-slate-200">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"><PlusIcon className="w-2.5 h-2.5" /></button>
                            </div>
                            <div className="text-right w-16 font-black text-xs text-slate-800 dark:text-slate-200 font-mono shrink-0">
                                Rp{item.subtotal.toLocaleString('id-ID')}
                            </div>
                            <button onClick={() => removeFromCart(item.productId)} className="text-slate-400 hover:text-red-500 p-1 transition-all" title="Hapus"><TrashIcon className="w-3.5 h-3.5" /></button>
                        </div>
                    ))}
                </div>
            )}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto">
                <div className="flex justify-between items-baseline mb-4">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">TOTAL BELANJA</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono select-all">Rp {total.toLocaleString('id-ID')}</span>
                </div>
                
                <button
                    disabled={cart.length === 0}
                    onClick={onProceed}
                    className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-extrabold py-3.5 px-4 rounded-xl transition-all duration-200 disabled:bg-slate-150 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed shadow-md text-xs tracking-widest uppercase active:scale-[0.98] cursor-pointer"
                >
                    Konfirmasi Checkout
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
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-xs flex justify-center items-center z-[110] p-4 font-sans animate-fade-in transition-colors">
            <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] border border-slate-150/20 dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden transition-colors">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight font-display">Toko Nala Checkout</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">Selesaikan Pembayaran & Atur Diskon</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-grow space-y-5">
                    
                    {/* Timeline Checkout Modern */}
                    <div className="flex items-center justify-between max-w-xs mx-auto mb-5 relative select-none">
                      {/* Step 1 */}
                      <div className="flex flex-col items-center z-10">
                        <div className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center text-[9px] font-black font-mono">1</div>
                        <span className="text-[8px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mt-1.5">Keranjang</span>
                      </div>
                      {/* Connecting Line */}
                      <div className="flex-1 h-[1.5px] bg-emerald-500 dark:bg-emerald-600 mx-2 -mt-4"></div>
                      {/* Step 2 */}
                      <div className="flex flex-col items-center z-10">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black font-mono animate-pulse">2</div>
                        <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1.5">Bayar</span>
                      </div>
                      {/* Connecting Line */}
                      <div className="flex-1 h-[1.5px] bg-slate-100 dark:bg-slate-800 mx-2 -mt-4"></div>
                      {/* Step 3 */}
                      <div className="flex flex-col items-center z-10 opacity-30">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-850 text-slate-500 flex items-center justify-center text-[9px] font-black font-mono">3</div>
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest mt-1.5">Selesai</span>
                      </div>
                    </div>

                    <div>
                        <h4 className="font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-wider mb-2">Ringkasan Pesanan</h4>
                        <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl p-3.5 space-y-1.5 font-mono text-xs">
                            {cart.map(item => (
                                <div key={item.productId} className="flex justify-between text-slate-600 dark:text-slate-350 text-[11px]">
                                    <span className="truncate max-w-[250px]">{item.name} <span className="text-[9px] text-slate-400 dark:text-slate-500">({item.size})</span> x{item.quantity}</span>
                                    <span className="font-extrabold text-slate-705 dark:text-slate-100">Rp{item.subtotal.toLocaleString('id-ID')}</span>
                                </div>
                            ))}
                            <div className="border-t border-slate-200/50 dark:border-slate-800 pt-2 mt-2 flex justify-between text-slate-800 dark:text-slate-105 font-black">
                                <span>Subtotal Belanja</span>
                                <span>Rp{total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-wider mb-2">Diskon Transaksi</h4>
                        <div className="flex gap-2 items-center">
                            <select 
                                value={discountType} 
                                onChange={(e) => setDiscountType(e.target.value as 'percent' | 'nominal')}
                                className="border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 font-sans"
                            >
                                <option value="percent">% Persen</option>
                                <option value="nominal">Rp Nominal</option>
                            </select>
                            <input 
                                type="number" 
                                value={discountValue || ''} 
                                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                placeholder="Ketikan nilai diskon..."
                                className="border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 text-xs flex-grow font-mono text-slate-800 dark:text-slate-105 bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 font-bold"
                            />
                            {discountValue > 0 && (
                                <button 
                                    onClick={() => setDiscountValue(0)}
                                    className="text-red-500 dark:text-red-400 text-[10px] font-black tracking-widest uppercase hover:underline shrink-0 px-2 cursor-pointer"
                                >
                                    Hapus
                                </button>
                            )}
                        </div>
                        {discountAmount > 0 && (
                            <p className="text-[10px] text-emerald-650 dark:text-emerald-400 mt-1.5 font-extrabold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Potongan Terhitung: Rp{discountAmount.toLocaleString('id-ID')}</span>
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div>
                            <h4 className="font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-wider mb-2">Metode Pembayaran</h4>
                            <div className="grid grid-cols-3 gap-1.5">
                                {Object.values(PaymentMethod).map(method => (
                                    <button 
                                        key={method} 
                                        onClick={() => setPaymentMethod(method)}
                                        className={`py-2 px-1 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border cursor-pointer ${paymentMethod === method ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-md' : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => {
                                    setPaymentMethod(PaymentMethod.TUNAI);
                                    setAmountReceived(finalTotal.toString());
                                }}
                                className="mt-2 w-full py-2 bg-slate-55 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-150/40 dark:border-slate-750 rounded-xl text-[10px] font-black hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                            >
                                Uang Pas (Rp{finalTotal.toLocaleString('id-ID')})
                            </button>
                        </div>

                        <div>
                            <h4 className="font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-wider mb-2">Kas Diterima</h4>
                            {paymentMethod === PaymentMethod.TUNAI ? (
                                <div className="space-y-2">
                                    <input 
                                        type="number"
                                        value={amountReceived}
                                        onChange={(e) => setAmountReceived(e.target.value)}
                                        placeholder="Jumlah Uang..."
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl font-mono text-xs text-slate-905 dark:text-slate-100 font-bold focus:outline-none focus:border-slate-400 dark:focus:border-slate-700"
                                    />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">KEMBALIAN:</span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">Rp{change.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-500 dark:text-slate-450 text-[10px] font-bold leading-relaxed">
                                    Non-tunai akan langsung diproses sesuai total akhir tagihan.
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900 text-red-650 dark:text-red-400 rounded-xl text-[11px] font-bold">
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                <div className="px-5 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-left w-full sm:w-auto">
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">TOTAL AKHIR</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white font-mono">Rp{finalTotal.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex space-x-2 w-full sm:w-auto">
                        <button 
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 font-black text-xs transition-all tracking-wider uppercase cursor-pointer"
                        >
                            Batal
                        </button>
                        <button 
                            disabled={isProcessing}
                            onClick={handleConfirm}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-900 font-black text-xs transition-all rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-450 shadow-md shadow-emerald-650/10 disabled:bg-slate-200 dark:disabled:bg-slate-800 cursor-pointer tracking-wider uppercase"
                        >
                            {isProcessing ? 'Memproses...' : 'PROSES BAYAR'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// FIX: The POSView component was incomplete. It has been fully implemented, including state management, event handlers, a return statement, and a default export. This resolves all reported errors.
const POSView: React.FC<POSViewProps> = ({ products, onTransactionComplete, onSaveProduct, currentUser, onRefresh }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
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
    if (product.use_stock && product.stock <= 0) {
        alert('Stok produk habis!');
        return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        if (product.use_stock && existingItem.quantity >= product.stock) {
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
      if (product && product.use_stock && newQuantity > product.stock) {
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

  const handleManualAdd = useCallback(async () => {
    if (!manualName.trim() || !manualPrice || isNaN(Number(manualPrice))) {
      alert('Mohon isi nama produk dan harga yang valid.');
      return;
    }

    const price = Number(manualPrice);
    const manualSize = '(Manual)';

    // Check if product already exists in local list
    let product = products.find(p => 
      p.name.toLowerCase() === manualName.trim().toLowerCase() && 
      p.size === manualSize
    );

    if (!product) {
      // Create new product automatically
      const newProductData = {
        name: manualName.trim(),
        size: manualSize,
        price: price,
        cost_price: 0,
        stock: 0,
        low_stock_threshold: 0,
        use_stock: false,
        is_active: true
      };
      
      const savedProduct = await onSaveProduct(newProductData);
      if (savedProduct) {
        product = savedProduct;
      }
    }

    if (product) {
      handleAddToCart(product);
    } else {
      // Fallback if saving fails (though it shouldn't)
      const newItem: CartItem = {
        productId: `manual-${Date.now()}`,
        name: manualName.trim(),
        size: manualSize,
        quantity: 1,
        unitPrice: price,
        subtotal: price,
      };
      setCart(prevCart => [...prevCart, newItem]);
    }

    setManualName('');
    setManualPrice('');
    setIsManualModalOpen(false);
    setIsCartOpen(true);
  }, [manualName, manualPrice, products, onSaveProduct, handleAddToCart]);

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
                product_name: item.name,
                product_size: item.size,
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
    <div className="flex flex-col h-full p-4 lg:p-6 space-y-6 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="flex-grow overflow-hidden flex flex-col">
        <div className="mb-6 flex space-x-2 items-center">
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                    type="text"
                    placeholder="Cari camilan atau produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl leading-5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-800 focus:border-slate-400 transition-all text-sm font-semibold"
                />
            </div>
            
            <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
                title="Lihat Keranjang"
            >
                <ShoppingCartIcon className="w-5 h-5" />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-bounce">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                )}
            </button>

            <button 
                onClick={() => setIsManualModalOpen(true)}
                className="p-2.5 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 rounded-xl hover:bg-cyan-100 transition-colors flex items-center space-x-1 font-bold text-xs cursor-pointer"
                title="Tambah Manual"
            >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden md:inline">Manual</span>
            </button>

            <button 
                title="Scan Barcode"
                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                onClick={() => {
                    alert('Sistem Barcode scanner aktif! Gunakan kamera tablet atau hubungkan kabel scanner USB Anda.');
                }}
            >
                <BarcodeIcon className="w-5 h-5" />
            </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
                {paginatedProducts.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
                {paginatedProducts.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center text-gray-500 h-64">
                        <PackageIcon className="w-12 h-12 text-slate-350 mb-3"/>
                        <p className="text-xs font-bold text-slate-400">Tidak ada produk aktif yang tersedia.</p>
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

      {/* Manual Add Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-55 flex justify-center items-center p-4">
            <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-xs" onClick={() => setIsManualModalOpen(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-colors">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-cyan-600 dark:bg-cyan-750 text-white">
                    <div className="flex items-center space-x-2">
                        <PlusIcon className="w-5 h-5" />
                        <h2 className="text-sm font-black uppercase tracking-wider font-display">Tambah Item Manual</h2>
                    </div>
                    <button onClick={() => setIsManualModalOpen(false)} className="p-1 hover:bg-cyan-700 dark:hover:bg-cyan-800 rounded-full cursor-pointer">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Nama Camilan / Produk</label>
                        <input 
                            type="text"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            placeholder="Contoh: Snack Box Spesial Nala"
                            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-semibold"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Harga Jual (Rp)</label>
                        <input 
                            type="number"
                            value={manualPrice}
                            onChange={(e) => setManualPrice(e.target.value)}
                            placeholder="Contoh: 15000"
                            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-semibold"
                        />
                    </div>
                    
                    <button 
                        onClick={handleManualAdd}
                        className="w-full bg-cyan-600 dark:bg-cyan-700 text-white font-extrabold py-3.5 rounded-xl hover:bg-cyan-700 transition-colors mt-4 text-xs tracking-wider uppercase cursor-pointer"
                    >
                        Masukan ke keranjang
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Cart Modal/Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-55 flex justify-end">
            <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-xs" onClick={() => setIsCartOpen(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col transition-colors">
                <div className="p-4 border-b border-slate-150/40 dark:border-slate-800 flex justify-between items-center bg-slate-900 dark:bg-slate-950 text-white">
                    <div className="flex items-center space-x-2">
                        <ShoppingCartIcon className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-sm font-black uppercase tracking-wider font-display">Tinjau Pesanan</h2>
                    </div>
                    <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-slate-800 dark:hover:bg-slate-900 rounded-full cursor-pointer">
                        <CloseIcon className="w-5 h-5 text-slate-300" />
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