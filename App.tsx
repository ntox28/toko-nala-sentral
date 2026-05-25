import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, Transaction, View, Expense, User, UserRole, TransactionDetail, ProductSize, Size } from './types';
import POSView from './components/POSView';
import DashboardView from './components/DashboardView';
import ProductManagementView from './components/ProductManagementView';
import ExpensesView from './components/ExpensesView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import DataManagementView from './components/DataManagementView';
import PricingCalculatorView from './components/PricingCalculatorView';
import LoginView from './components/LoginView';
import ReceiptModal from './components/ReceiptModal';
import Footer from './components/Footer';
import { TeaIcon, PackageIcon, ChartBarIcon, ReceiptRefundIcon, CogIcon, MenuIcon, ArchiveBoxIcon, CalculatorIcon } from './components/Icons';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Receipt, 
  Package, 
  BarChart3, 
  Calculator, 
  Database, 
  Settings, 
  LogOut, 
  X, 
  ChevronRight, 
  Smartphone, 
  Tablet, 
  Monitor,
  RefreshCw,
  User as UserIcon,
  Menu as LucidMenu,
  Sun,
  Moon
} from 'lucide-react';
import * as db from './supabaseService';
import { supabase } from './supabase';


interface HeaderProps {
    currentView: View;
    setView: (view: View) => void;
    currentUser: User;
    onRefresh: () => void;
    isRefreshing: boolean;
    onLogout: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, currentUser, onRefresh, isRefreshing, onLogout, isDarkMode, onToggleDarkMode }) => {
    const initials = currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'NS';
    
    return (
        <header className="bg-white dark:bg-slate-900 border-b border-slate-150/40 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm transition-colors duration-250">
            <div className="flex items-center space-x-3">
                <img src="https://wqgbkwujfxdwlywxrjup.supabase.co/storage/v1/object/public/publik/Nala%20Sentral.png" alt="Nala Sentral Logo" className="h-8 w-auto hover:scale-105 transition-transform" />
                <div>
                    <h1 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none font-display">Nala Sentral</h1>
                    <span className="text-[10px] text-slate-400 dark:text-slate-450 font-bold tracking-wide uppercase mt-1.5 inline-block">{currentView}</span>
                </div>
            </div>
            
            <div className="flex items-center space-x-2.5">
                {/* Dark Mode Toggle */}
                <button 
                    onClick={onToggleDarkMode} 
                    title={isDarkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-100 border border-slate-100/55 dark:border-slate-750 transition-all flex items-center justify-center cursor-pointer"
                >
                    {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
                </button>

                {/* Refresh Trigger Button */}
                <button 
                    onClick={onRefresh} 
                    title="Segarkan Data"
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 border border-slate-100/50 dark:border-slate-700 transition-all flex items-center justify-center cursor-pointer"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-slate-900 dark:text-slate-100' : ''}`} />
                </button>
            
                {/* Profile Circle Details */}
                <div className="flex items-center bg-slate-50/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750 p-1.5 pr-3.5 rounded-full">
                    <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-[10px] font-black mr-2 shadow-xs shadow-slate-950/20">
                        {initials}
                    </div>
                    <div className="hidden xs:block text-left">
                        <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 leading-none truncate max-w-[80px]">{currentUser.name}</p>
                        <p className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 leading-none mt-1 uppercase tracking-widest">{currentUser.role}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

const LoadingOverlay: React.FC = () => (
    <div className="fixed inset-0 bg-slate-50 bg-opacity-95 flex flex-col justify-center items-center z-[999] select-none font-sans">
        <div className="relative">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 animate-ping opacity-75"></div>
            <img src="https://wqgbkwujfxdwlywxrjup.supabase.co/storage/v1/object/public/publik/Nala%20Sentral.png" alt="Nala Sentral Logo" className="h-[72px] w-auto relative z-10 hover:scale-110 transition-transform" />
        </div>
        <p className="text-slate-800 font-bold text-sm tracking-wide mt-6">Sinkronisasi Database...</p>
        <p className="text-slate-400 text-xs font-medium mt-1">Mengambil data penjualan real-time</p>
    </div>
);


const App: React.FC = () => {
  const [view, setView] = useState<View>(View.DASHBOARD);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [latestTransaction, setLatestTransaction] = useState<Transaction | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  
  // Custom Minimalist Mobile/Tablet Redesign states
  const [viewportMode, setViewportMode] = useState<'smartphone' | 'tablet' | 'full'>('tablet');
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isFetchingRef = useRef(false);
  const isHandlingSessionRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData(false);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 850);
  };

  const allowedNavItems = useMemo(() => {
    if (!currentUser) return [];
    const allowedViews = currentUser.allowed_views || [];
    const userRole = currentUser.role?.toLowerCase();
    
    const allNavItems = [
      { view: View.POS, label: 'Kasir', icon: <ShoppingCart className="w-4.5 h-4.5" /> },
      { view: View.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
      { view: View.EXPENSES, label: 'Pengeluaran', icon: <Receipt className="w-4.5 h-4.5" /> },
      { view: View.PRODUCTS, label: 'Produk', icon: <Package className="w-4.5 h-4.5" /> },
      { view: View.REPORTS, label: 'Laporan', icon: <BarChart3 className="w-4.5 h-4.5" /> },
      { view: View.PRICING_CALCULATOR, label: 'Kalkulator', icon: <Calculator className="w-4.5 h-4.5" /> },
      { view: View.DATA_MANAGEMENT, label: 'Data', icon: <Database className="w-4.5 h-4.5" /> },
      { view: View.SETTINGS, label: 'Pengaturan', icon: <Settings className="w-4.5 h-4.5" /> },
    ];

    return allNavItems.filter(item => {
      if (allowedViews.length > 0) {
        return allowedViews.includes(item.view);
      }
      if (userRole === 'admin') return true;
      if (userRole === 'kasir') {
        return [View.DASHBOARD, View.POS, View.EXPENSES, View.PRODUCTS].includes(item.view);
      }
      return false;
    });
  }, [currentUser]);

  const fetchData = async (isBackground = false) => {
    // Prevent too frequent background fetches (e.g., within 30 seconds)
    const now = Date.now();
    if (isBackground && now - lastFetchTimeRef.current < 30000) {
      console.log('fetchData: background fetch skipped (too soon)');
      return;
    }

    if (isFetchingRef.current) {
      console.log('fetchData: already fetching, skipping');
      return;
    }
    
    console.log(`fetchData: starting (background: ${isBackground})...`);
    // Only show loading overlay if we don't have essential data yet
    if (!isBackground && products.length === 0) setLoading(true);
    isFetchingRef.current = true;

    // Safety timeout for this specific fetch
    const fetchTimeout = setTimeout(() => {
      if (isFetchingRef.current) {
        console.warn('fetchData: safety timeout reached, forcing loading false');
        setLoading(false);
        isFetchingRef.current = false;
      }
    }, 15000);

    try {
      console.log('fetchData: calling db functions...');
      const [p, t, e, s, u] = await Promise.all([
        db.getProducts(),
        db.getTransactions(),
        db.getExpenses(),
        db.getSizes(),
        db.getProfiles()
      ]);
      
      console.log(`fetchData: success! Fetched: ${p.length} products, ${t.length} transactions, ${e.length} expenses, ${s.length} sizes, ${u.length} profiles`);
      
      setProducts(p);
      setTransactions(t);
      setExpenses(e);
      setSizes(s);
      setUsers(u);
    } catch (error: any) {
      console.error('fetchData: error fetching data:', error);
      // Only alert if it's not a background fetch to avoid annoying the user
      if (!isBackground) {
        alert('Gagal mengambil data: ' + (error.message || 'Terjadi kesalahan jaringan'));
      }
    } finally {
      clearTimeout(fetchTimeout);
      setLoading(false);
      isFetchingRef.current = false;
      lastFetchTimeRef.current = Date.now();
      console.log('fetchData: finished');
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: any;

    const handleSession = async (session: any) => {
      if (!session?.user) {
        console.log('handleSession: no session, setting user null');
        if (mounted) {
          setCurrentUser(null);
          setLoading(false);
        }
        return;
      }

      if (isHandlingSessionRef.current) {
        console.log('handleSession: already handling session, skipping');
        return;
      }

      console.log('handleSession: starting for user:', session.user.id);
      isHandlingSessionRef.current = true;
      
      // ONLY set global loading if we don't have a user AND no products (initial cold start)
      const isInitialLoad = !currentUser && products.length === 0;
      if (isInitialLoad) {
        setLoading(true);
      }

      try {
        console.log('handleSession: fetching profile...');
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (mounted) {
          if (profile) {
            console.log('handleSession: profile found:', profile);
            setCurrentUser(profile as User);
            // Fetch data in background if we already had a user
            // Add a cooldown of 30 seconds for background fetches to prevent "refresh loops"
            const now = Date.now();
            const lastFetch = lastFetchTimeRef.current;
            if (!isInitialLoad && (now - lastFetch < 30000)) {
              console.log('handleSession: background fetch skipped (cooldown)');
              setLoading(false);
            } else {
              await fetchData(!isInitialLoad);
            }
          } else {
            console.error('handleSession: profile not found for user:', session.user.id);
            if (error && error.code === 'PGRST116') {
              // Profile might not exist yet, but we shouldn't alert on every background check
              if (isInitialLoad) alert('Profil pengguna tidak ditemukan di database. Silakan hubungi admin.');
            }
            setCurrentUser(null);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('handleSession: unexpected error:', err);
        if (mounted) {
          setCurrentUser(null);
          setLoading(false);
        }
      } finally {
        if (mounted) {
          isHandlingSessionRef.current = false;
          console.log('handleSession: finished');
        }
      }
    };

    // Safety timeout: if still loading after 15 seconds, force stop loading
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Loading timeout reached, forcing stop loading');
        setLoading(false);
      }
    }, 15000);

    // 1. Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        handleSession(session);
      }
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (mounted) {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          handleSession(session);
        }
      }
    });

    // 3. Logout on tab close
    const handleBeforeUnload = () => {
      // We use a synchronous-ish approach if possible, but signOut is async.
      // Most browsers will allow the request to start.
      supabase.auth.signOut();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser, products.length]);

  const handleTransactionComplete = async (transaction: Transaction) => {
    try {
      const newTx = await db.createTransaction(transaction);
      setTransactions(prev => [newTx, ...prev]);
      setLatestTransaction(newTx);
      
      // Refresh products to get updated stock
      const updatedProducts = await db.getProducts();
      setProducts(updatedProducts);
    } catch (error: any) {
      console.error('Error completing transaction:', error);
      const message = error?.message || 'Gagal menyimpan transaksi.';
      alert(`Gagal menyimpan transaksi: ${message}`);
    }
  };

  const handleSaveProduct = async (productData: Product | Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> => {
    try {
      const saved = await db.saveProduct(productData);
      const updated = await db.getProducts();
      setProducts(updated);
      return saved;
    } catch (error) {
      console.error('Error saving product:', error);
      return null;
    }
  };
  
  const handleDeleteProduct = async (productId: string): Promise<boolean> => {
    try {
      await db.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  };
  
  const handleDeleteTransaction = async (transactionId: string): Promise<boolean> => {
    try {
      await db.deleteTransaction(transactionId);
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  };

  const handleSaveExpense = async (expenseData: Expense | Omit<Expense, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      await db.saveExpense(expenseData);
      const updated = await db.getExpenses();
      setExpenses(updated);
      return true;
    } catch (error) {
      console.error('Error saving expense:', error);
      return false;
    }
  };

  const handleDeleteExpense = async (expenseId: string): Promise<boolean> => {
    try {
      await db.deleteExpense(expenseId);
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  };

  const handleLogin = (user: User) => {
      setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setCurrentUser(null);
      setView(View.POS);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (userData: User | Omit<User, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      await db.saveProfile(userData);
      const updated = await db.getProfiles();
      setUsers(updated);
      if (currentUser && 'id' in userData && currentUser.id === userData.id) {
        const updatedProfile = updated.find(u => u.id === userData.id);
        if (updatedProfile) setCurrentUser(updatedProfile);
      }
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      return false;
    }
  };

  const handleDeleteUser = async (userId: string): Promise<boolean> => {
    if (currentUser && currentUser.id === userId) {
        alert('Tidak dapat menghapus pengguna yang sedang aktif.');
        return false;
    }
    // Note: Deleting from profiles doesn't delete from auth.users automatically
    // This usually requires a service role or edge function
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== userId));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-400 via-rose-350 to-blue-600 flex flex-col justify-center items-center z-[9999] select-none text-white p-6 font-sans">
        <div className="text-center space-y-6 flex flex-col items-center max-w-sm animate-fade-in">
          <div className="relative p-3 bg-white/20 backdrop-blur-md rounded-[2.2rem] shadow-2xl border border-white/20">
            <img 
              src="https://wqgbkwujfxdwlywxrjup.supabase.co/storage/v1/object/public/publik/Nala%20Sentral.png" 
              alt="Nala Sentral Logo" 
              className="h-28 w-auto relative z-10 transition-transform scale-105" 
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
              Toko Nala Sentral
            </h1>
            <p className="text-[10px] font-black text-cyan-100 tracking-widest uppercase drop-shadow-sm font-sans">
              PLATFORM POS PREMIUM
            </p>
          </div>
          <p className="text-xs font-bold text-slate-800 bg-white/90 hover:scale-[1.02] transition-transform px-5 py-3 rounded-2xl shadow-lg border border-slate-100">
            “Order sekarang lebih mudah lewat Toko Nala”
          </p>
          <div className="flex space-x-2.5 pt-6">
            <span className="w-2 h-2 rounded-full bg-white opacity-40 animate-bounce duration-300"></span>
            <span className="w-2 h-2 rounded-full bg-white opacity-60 animate-bounce [animation-delay:150ms]"></span>
            <span className="w-2 h-2 rounded-full bg-white opacity-80 animate-bounce [animation-delay:300ms]"></span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
      return <LoadingOverlay />;
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={fetchData} onLocalLogin={() => {}} users={users} />;
  }

  const handleSaveTransaction = async (transaction: Transaction): Promise<boolean> => {
    try {
      // For now, we don't have a specific updateTransaction in service, 
      // but we can add it if needed. Transactions are usually immutable.
      const { error } = await supabase.from('transactions').update({
        payment_method: transaction.payment_method
      }).eq('id', transaction.id);
      
      if (error) throw error;
      
      setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
      return true;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return false;
    }
  };

  const renderView = () => {
    const allowedViews = currentUser?.allowed_views || [];
    const userRole = currentUser?.role?.toLowerCase();
    
    const isAllowed = (v: View) => {
        // If explicit allowed_views exist, use them
        if (allowedViews.length > 0) {
            return allowedViews.includes(v);
        }
        
        // Admin has access to everything if allowed_views is empty
        if (userRole === 'admin') return true;
        
        // Default access for Kasir if allowed_views is empty
        if (userRole === 'kasir') {
            return [View.DASHBOARD, View.POS, View.EXPENSES, View.PRODUCTS].includes(v);
        }
        
        return false;
    };

    if (!isAllowed(view)) {
        return (
            <div className="p-12 text-center flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-red-50 p-8 rounded-2xl border border-red-100 shadow-sm max-w-md">
                    <PackageIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Akses Terbatas</h2>
                    <p className="text-gray-600 mb-6">Anda tidak memiliki akses ke menu <strong>{view}</strong>. Silakan hubungi Administrator untuk memperbarui hak akses Anda.</p>
                    <button 
                        onClick={() => setView(View.POS)}
                        className="px-6 py-2 bg-[#2F4B8B] text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold"
                    >
                        Kembali ke Kasir
                    </button>
                </div>
            </div>
        );
    }

    switch (view) {
      case View.DASHBOARD:
        return (
          <DashboardView 
            transactions={transactions} 
            expenses={expenses} 
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
            onPrintReceipt={(tx) => setLatestTransaction(tx)}
          />
        );
      case View.POS:
        return <POSView products={products} onTransactionComplete={handleTransactionComplete} onSaveProduct={handleSaveProduct} currentUser={currentUser} onRefresh={fetchData}/>;
      case View.EXPENSES:
        return <ExpensesView 
            expenses={expenses} 
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
            onRefresh={fetchData}
        />;
      case View.PRODUCTS:
        return <ProductManagementView 
            products={products} 
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            sizes={sizes}
            currentUser={currentUser}
            onRefresh={fetchData}
        />;
      case View.REPORTS:
        return <ReportsView transactions={transactions} products={products} expenses={expenses} onRefresh={fetchData} />;
      case View.PRICING_CALCULATOR:
        return <PricingCalculatorView />;
      case View.DATA_MANAGEMENT:
        return <DataManagementView 
            transactions={transactions} 
            products={products}
            expenses={expenses}
            sizes={sizes}
            onDeleteTransaction={handleDeleteTransaction}
            onSaveTransaction={handleSaveTransaction}
            onDeleteProduct={handleDeleteProduct}
            onSaveProduct={handleSaveProduct}
            onDeleteExpense={handleDeleteExpense}
            onSaveExpense={handleSaveExpense}
            onSaveSize={async (size) => {
                try {
                  await db.saveSize(size);
                  const updated = await db.getSizes();
                  setSizes(updated);
                  return true;
                } catch (error) {
                  console.error('Error saving size:', error);
                  return false;
                }
            }}
            onDeleteSize={async (id) => {
                try {
                  await db.deleteSize(id);
                  setSizes(prev => prev.filter(s => s.id !== id));
                  return true;
                } catch (error) {
                  console.error('Error deleting size:', error);
                  return false;
                }
            }}
            onRefresh={fetchData}
        />;
      case View.SETTINGS:
        return <SettingsView 
            users={users}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            onRefresh={fetchData}
        />;
      default:
        return <POSView products={products} onTransactionComplete={handleTransactionComplete} currentUser={currentUser} onRefresh={fetchData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-slate-50/75 to-slate-100 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950 flex flex-col justify-start items-center p-0 md:p-6 transition-all duration-300 font-sans selection:bg-slate-200 dark:selection:bg-slate-800">
      
      {/* Device Preset Switcher for Desktop Viewports */}
      {currentUser && (
        <div className="hidden md:flex items-center space-x-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200/60 dark:border-slate-800/80 p-1 rounded-full shadow-sm shadow-slate-100/50 dark:shadow-none mb-4 scale-95 origin-center transition-colors">
          <button 
            onClick={() => setViewportMode('smartphone')} 
            className={`flex items-center space-x-1.5 px-4.5 py-2 rounded-full text-xs font-bold tracking-tight transition-all cursor-pointer ${viewportMode === 'smartphone' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm shadow-slate-950/15' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Smartphone size={13} />
            <span>Smartphone</span>
          </button>
          
          <button 
            onClick={() => setViewportMode('tablet')} 
            className={`flex items-center space-x-1.5 px-4.5 py-2 rounded-full text-xs font-bold tracking-tight transition-all cursor-pointer ${viewportMode === 'tablet' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm shadow-slate-950/15' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Tablet size={13} />
            <span>Tablet View</span>
          </button>
          
          <button 
            onClick={() => setViewportMode('full')} 
            className={`flex items-center space-x-1.5 px-4.5 py-2 rounded-full text-xs font-bold tracking-tight transition-all cursor-pointer ${viewportMode === 'full' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm shadow-slate-950/15' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Monitor size={13} />
            <span>Responsive / Full</span>
          </button>
        </div>
      )}

      {/* Main Responsive Viewport Container */}
      <div 
        className={`w-full bg-white dark:bg-slate-900 flex flex-col relative transition-all duration-350 select-none ${
          viewportMode === 'smartphone' 
            ? 'md:max-w-[420px] md:h-[860px] md:rounded-[2.2rem] md:shadow-2xl md:border md:border-slate-200/80 dark:border-slate-800/80 md:my-auto md:overflow-hidden md:ring-8 md:ring-slate-900/5 dark:ring-slate-950/20' 
            : viewportMode === 'tablet' 
            ? 'md:max-w-[980px] md:h-[840px] md:rounded-[1.8rem] md:shadow-2xl md:border md:border-slate-200/80 dark:border-slate-800/80 md:my-auto md:overflow-hidden md:ring-8 md:ring-slate-900/5 dark:ring-slate-950/20' 
            : 'w-full min-h-screen'
        }`}
      >
        {/* Top Status Title Bar */}
        <Header 
          currentView={view} 
          setView={setView} 
          currentUser={currentUser} 
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
        
        {/* Main Viewport Content Surface */}
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 bg-slate-50/50 dark:bg-slate-950/40">
          {renderView()}
        </main>

        {/* Persistent Bottom Tabbed Menu Bar */}
        <nav className="bg-white dark:bg-slate-900 border-t border-slate-100/80 dark:border-slate-800/80 px-2.5 py-2.5 flex justify-around items-center shrink-0 shadow-[0_-4px_25px_rgba(15,23,42,0.03)] dark:shadow-none relative z-40 transition-colors duration-250">
          {allowedNavItems.slice(0, allowedNavItems.length <= 5 ? allowedNavItems.length : 4).map(item => {
            const isActive = view === item.view && !isMoreDrawerOpen;
            
            // Dynamic modern color assignment
            let buttonStyle = 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-slate-800/30';
            let iconStyle = 'text-slate-400 dark:text-slate-500';
            
            if (isActive) {
              switch (item.view) {
                case View.POS:
                  buttonStyle = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-100/50 dark:border-emerald-800/50 font-extrabold shadow-sm shadow-emerald-500/5 ring-1 ring-emerald-500/10';
                  iconStyle = 'text-emerald-600 dark:text-emerald-400';
                  break;
                case View.DASHBOARD:
                  buttonStyle = 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 border-blue-100/50 dark:border-blue-800/50 font-extrabold shadow-sm shadow-blue-500/5 ring-1 ring-blue-500/10';
                  iconStyle = 'text-blue-600 dark:text-blue-400';
                  break;
                case View.EXPENSES:
                  buttonStyle = 'text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border-rose-100/50 dark:border-rose-800/50 font-extrabold shadow-sm shadow-rose-500/5 ring-1 ring-rose-500/10';
                  iconStyle = 'text-rose-600 dark:text-rose-400';
                  break;
                case View.PRODUCTS:
                  buttonStyle = 'text-violet-600 dark:text-violet-400 bg-violet-50/80 dark:bg-violet-950/40 border-violet-100/50 dark:border-violet-800/50 font-extrabold shadow-sm shadow-violet-500/5 ring-1 ring-violet-500/10';
                  iconStyle = 'text-violet-600 dark:text-violet-400';
                  break;
                case View.REPORTS:
                  buttonStyle = 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-100/50 dark:border-indigo-800/50 font-extrabold shadow-sm shadow-indigo-500/5 ring-1 ring-indigo-500/10';
                  iconStyle = 'text-indigo-600 dark:text-indigo-400';
                  break;
                case View.PRICING_CALCULATOR:
                  buttonStyle = 'text-cyan-600 dark:text-cyan-400 bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-100/50 dark:border-cyan-800/50 font-extrabold shadow-sm shadow-cyan-500/5 ring-1 ring-cyan-500/10';
                  iconStyle = 'text-cyan-600 dark:text-cyan-400';
                  break;
                case View.DATA_MANAGEMENT:
                  buttonStyle = 'text-teal-600 dark:text-teal-400 bg-teal-50/80 dark:bg-teal-950/40 border-teal-100/50 dark:border-teal-800/50 font-extrabold shadow-sm shadow-teal-500/5 ring-1 ring-teal-500/10';
                  iconStyle = 'text-teal-600 dark:text-teal-400';
                  break;
                default:
                  buttonStyle = 'text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 font-extrabold';
                  iconStyle = 'text-slate-900 dark:text-white';
              }
            }

            return (
              <button
                key={item.view}
                onClick={() => {
                  setView(item.view);
                  setIsMoreDrawerOpen(false);
                }}
                className={`flex flex-col items-center justify-center space-y-1 py-1.5 px-3.5 rounded-xl border border-transparent transition-all duration-200 cursor-pointer ${buttonStyle}`}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'} ${iconStyle}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
              </button>
            );
          })}
          
          {/* Menu Drawer Toggle button */}
          {allowedNavItems.length > 5 && (
            <button
              onClick={() => setIsMoreDrawerOpen(prev => !prev)}
              className={`flex flex-col items-center justify-center space-y-1 py-1.5 px-3.5 rounded-xl border border-transparent transition-all duration-200 cursor-pointer ${
                isMoreDrawerOpen 
                  ? 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 font-extrabold shadow-sm' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
              }`}
            >
              <LucidMenu className="w-4.5 h-4.5 text-current" />
              <span className="text-[10px] font-bold tracking-tight">Lainnya</span>
            </button>
          )}
        </nav>

        {/* Slide-Up Bottom Drawer Menu Panel (Perfectly Bound Within the active Viewport) */}
        {isMoreDrawerOpen && (
          <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-xs z-[100] flex flex-col justify-end transition-all duration-300 animate-fade-in">
            <div className="absolute inset-0" onClick={() => setIsMoreDrawerOpen(false)} />
            <div className="bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl relative z-10 p-6 flex flex-col max-h-[85%] border-t border-slate-100/30 dark:border-slate-800/80 animate-slide-up transition-colors duration-250">
              {/* Top Handle Drag-line */}
              <div 
                className="w-10 h-1 bg-slate-200 dark:bg-slate-700/80 rounded-full mx-auto mb-5 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" 
                onClick={() => setIsMoreDrawerOpen(false)} 
              />
              
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-150 text-sm tracking-tight font-display">Fitur Lainnya</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">Akses menu administrasi dan kelola toko</p>
                </div>
                <button 
                  onClick={() => setIsMoreDrawerOpen(false)} 
                  className="p-1 px-[7px] py-[7px] rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Navigation Grid inside the popover drawer */}
              <div className="grid grid-cols-2 gap-2.5 overflow-y-auto pb-4 pr-0.5">
                {allowedNavItems.slice(4).map(item => {
                  const isActive = view === item.view;
                  
                  // Specific colorful classes for active drawer options
                  let drawerItemColors = 'bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-705';
                  let iconColor = 'text-slate-400 dark:text-slate-500';

                  if (isActive) {
                    switch (item.view) {
                      case View.EXPENSES:
                        drawerItemColors = 'bg-rose-50 border-rose-150/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 dark:border-rose-900/40 shadow-sm ring-1 ring-rose-500/10';
                        iconColor = 'text-rose-600 dark:text-rose-400';
                        break;
                      case View.PRODUCTS:
                        drawerItemColors = 'bg-violet-50 border-violet-150/60 dark:bg-violet-950/30 text-violet-600 dark:text-violet-450 dark:border-violet-900/40 shadow-sm ring-1 ring-violet-500/10';
                        iconColor = 'text-violet-600 dark:text-violet-400';
                        break;
                      case View.REPORTS:
                        drawerItemColors = 'bg-indigo-50 border-indigo-150/60 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-450 dark:border-indigo-900/40 shadow-sm ring-1 ring-indigo-500/10';
                        iconColor = 'text-indigo-600 dark:text-indigo-400';
                        break;
                      case View.PRICING_CALCULATOR:
                        drawerItemColors = 'bg-cyan-50 border-cyan-150/60 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-450 dark:border-cyan-900/40 shadow-sm ring-1 ring-cyan-500/10';
                        iconColor = 'text-cyan-600 dark:text-cyan-400';
                        break;
                      case View.DATA_MANAGEMENT:
                        drawerItemColors = 'bg-teal-50 border-teal-150/60 dark:bg-teal-950/30 text-teal-600 dark:text-teal-450 dark:border-teal-900/40 shadow-sm ring-1 ring-teal-500/10';
                        iconColor = 'text-teal-600 dark:text-teal-400';
                        break;
                      case View.SETTINGS:
                        drawerItemColors = 'bg-slate-100 border-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 dark:border-slate-700 shadow-sm';
                        iconColor = 'text-slate-800 dark:text-slate-200';
                        break;
                      default:
                        drawerItemColors = 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-md';
                        iconColor = 'text-white dark:text-slate-900';
                    }
                  }

                  return (
                    <button
                      key={item.view}
                      onClick={() => {
                        setView(item.view);
                        setIsMoreDrawerOpen(false);
                      }}
                      className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${drawerItemColors}`}
                    >
                      <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'} ${iconColor}`}>
                        {item.icon}
                      </div>
                      <span className="text-[11px] font-bold tracking-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Profile Card and dynamic signout button */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4.5 mt-auto flex flex-col space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center text-[10px] font-extrabold shadow-sm border border-slate-200/40 dark:border-slate-750">
                      {currentUser?.name ? currentUser.name[0].toUpperCase() : 'N'}
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 leading-none">{currentUser.name}</p>
                      <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold leading-none mt-1.5 uppercase tracking-widest">{currentUser.role}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIsMoreDrawerOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[10px] font-extrabold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/45 hover:text-red-700 hover:border-red-100 dark:hover:border-red-900/60 border border-transparent transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Sesi</span>
                  </button>
                </div>
                
                <p className="text-center text-slate-405 dark:text-slate-550 text-[8px] tracking-wider uppercase">
                  &copy; {new Date().getFullYear()} Toko Nala Snack. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Popups & Dialogs Renderings */}
      <ReceiptModal 
        transaction={latestTransaction}
        products={products}
        onClose={() => setLatestTransaction(null)}
      />
    </div>
  );
};

export default App;
