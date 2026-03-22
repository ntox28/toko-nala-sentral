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
import { LayoutDashboard } from 'lucide-react';
import * as db from './supabaseService';
import { supabase } from './supabase';


interface HeaderProps {
    currentView: View;
    setView: (view: View) => void;
    currentUser: User;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, currentUser }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const allNavItems = [
        { view: View.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard />, roles: [UserRole.ADMIN, UserRole.KASIR] },
        { view: View.POS, label: 'Kasir', icon: <PackageIcon />, roles: [UserRole.ADMIN, UserRole.KASIR] },
        { view: View.EXPENSES, label: 'Pengeluaran', icon: <ReceiptRefundIcon />, roles: [UserRole.ADMIN, UserRole.KASIR] },
        { view: View.PRODUCTS, label: 'Produk', icon: <PackageIcon />, roles: [UserRole.ADMIN, UserRole.KASIR] },
        { view: View.REPORTS, label: 'Laporan', icon: <ChartBarIcon />, roles: [UserRole.ADMIN] },
        { view: View.PRICING_CALCULATOR, label: 'Kalkulator Harga', icon: <CalculatorIcon />, roles: [UserRole.ADMIN] },
        { view: View.DATA_MANAGEMENT, label: 'Manajemen Data', icon: <ArchiveBoxIcon />, roles: [UserRole.ADMIN] },
        { view: View.SETTINGS, label: 'Pengaturan', icon: <CogIcon />, roles: [UserRole.ADMIN] },
    ];

    const navItems = useMemo(() => {
        if (!currentUser) return [];
        const allowedViews = currentUser.allowed_views || [];
        const userRole = currentUser.role?.toLowerCase();
        
        return allNavItems.filter(item => {
            // If explicit allowed_views exist, use them
            if (allowedViews.length > 0) {
                return allowedViews.includes(item.view);
            }
            
            // Otherwise fallback to role-based defaults
            if (userRole === 'admin') return true; // Admin sees everything if no specific views set
            if (userRole === 'kasir') {
                return [View.DASHBOARD, View.POS, View.EXPENSES, View.PRODUCTS].includes(item.view);
            }
            
            return false;
        });
    }, [currentUser]);

    const currentNavItem = useMemo(() => navItems.find(item => item.view === currentView), [navItems, currentView]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    return (
        <header className="bg-[#2F4B8B] text-white shadow-lg flex justify-between items-center px-6 h-20">
            <div className="flex items-center space-x-4">
                <img src="https://wqgbkwujfxdwlywxrjup.supabase.co/storage/v1/object/public/publik/Nala%20Sentral.png" alt="Nala Sentral Logo" className="h-12 w-auto" />
                <h1 className="text-2xl font-bold">Nala Sentral</h1>
            </div>
            
            {currentUser && <div className="relative flex items-center space-x-2" ref={dropdownRef}>
                <button 
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full transition-colors duration-200 bg-blue-900/50 hover:bg-blue-700/60"
                >
                    <span className="font-semibold">{currentNavItem?.label}</span>
                    <MenuIcon className="w-5 h-5" />
                </button>
                
                {isDropdownOpen && (
                     <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-[100] border border-gray-100">
                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                            {navItems.map(item => (
                                <button
                                    key={item.view}
                                    onClick={() => {
                                        setView(item.view);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`flex items-center w-full text-left px-4 py-2 text-sm transition-colors ${currentView === item.view ? 'bg-blue-100 text-[#2F4B8B]' : 'text-gray-700 hover:bg-gray-100'}`}
                                    role="menuitem"
                                >
                                    {React.cloneElement(item.icon, { className: 'w-5 h-5 mr-3' })}
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>}
        </header>
    );
};

const LoadingOverlay: React.FC = () => (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex flex-col justify-center items-center z-[999]">
         <img src="https://wqgbkwujfxdwlywxrjup.supabase.co/storage/v1/object/public/publik/Nala%20Sentral.png" alt="Nala Sentral Logo" className="h-20 w-auto animate-pulse" />
        <p className="text-[#2F4B8B] font-semibold mt-4">Memuat data...</p>
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

  const isFetchingRef = useRef(false);
  const isHandlingSessionRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

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
    <div className="min-h-screen flex flex-col">
      <Header currentView={view} setView={setView} currentUser={currentUser} />
      <main className="flex-grow">
        {renderView()}
      </main>
      <Footer currentUser={currentUser} onLogout={handleLogout} />
      <ReceiptModal 
        transaction={latestTransaction}
        products={products}
        onClose={() => setLatestTransaction(null)}
      />
    </div>
  );
};

export default App;
