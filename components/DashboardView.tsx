import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Expense, PaymentMethod, UserRole } from '../types';
import { getAppSetting, saveAppSetting } from '../supabaseService';
import { 
  TrendingUp, 
  ShoppingCart, 
  ArrowDownCircle, 
  Wallet, 
  Clock, 
  CreditCard, 
  Banknote,
  Plus,
  X,
  Edit,
  Trash2,
  Printer,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface DashboardViewProps {
  transactions: Transaction[];
  expenses: Expense[];
  onDeleteTransaction: (id: string) => Promise<boolean>;
  onSaveTransaction: (transaction: Transaction) => Promise<boolean>;
  onDeleteExpense: (id: string) => Promise<boolean>;
  onSaveExpense: (expense: Expense) => Promise<boolean>;
  onPrintReceipt: (transaction: Transaction) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  transactions, 
  expenses,
  onDeleteTransaction,
  onSaveTransaction,
  onDeleteExpense,
  onSaveExpense,
  onPrintReceipt
}) => {
  const [initialCash, setInitialCash] = useState<number>(100000);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempInitialCash, setTempInitialCash] = useState<string>('100000');
  
  // Detail Modals State
  const [activeDetailModal, setActiveDetailModal] = useState<'income' | 'transactions' | 'expenses' | 'cash' | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const storageKey = 'initial_cash_global';

  useEffect(() => {
    const fetchInitialCash = async () => {
      const saved = await getAppSetting(storageKey);
      if (saved) {
        setInitialCash(parseFloat(saved));
        setTempInitialCash(saved);
      } else {
        // If no setting exists, save the default 100,000
        await saveAppSetting(storageKey, '100000');
      }
    };
    fetchInitialCash();
  }, []);

  const handleSaveInitialCash = async () => {
    const val = parseFloat(tempInitialCash) || 0;
    setInitialCash(val);
    try {
      await saveAppSetting(storageKey, val.toString());
      setIsModalOpen(false);
    } catch (error) {
      alert('Gagal menyimpan kas awal ke database.');
    }
  };

  const todayStats = useMemo(() => {
    const todayTxs = transactions.filter(t => t.date.startsWith(today));
    const todayExpenses = expenses.filter(e => e.date.startsWith(today));

    const totalIncome = todayTxs.reduce((sum, t) => sum + t.total, 0);
    const txCount = todayTxs.length;
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const finalCash = initialCash + totalIncome - totalExpenses;

    return {
      totalIncome,
      txCount,
      totalExpenses,
      finalCash,
      recentTxs: todayTxs.slice(0, 5)
    };
  }, [transactions, expenses, today, initialCash]);

  const chartData = useMemo(() => {
    // Hourly sales for today
    const hourlyData: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourlyData[i] = 0;

    transactions.filter(t => t.date.startsWith(today)).forEach(t => {
      const hour = new Date(t.date).getHours();
      hourlyData[hour] += t.total;
    });

    return Object.entries(hourlyData).map(([hour, total]) => ({
      hour: `${hour}:00`,
      total
    })).filter(d => d.total > 0 || (parseInt(d.hour) >= 8 && parseInt(d.hour) <= 22));
  }, [transactions, today]);

  const cashFlowData = useMemo(() => {
    const data = [
      { name: 'Kas Awal', value: initialCash, color: '#6366f1' },
      { name: 'Pemasukan', value: todayStats.totalIncome, color: '#10b981' },
      { name: 'Pengeluaran', value: todayStats.totalExpenses, color: '#ef4444' },
    ];
    return data;
  }, [initialCash, todayStats]);

  return (
    <div className="p-0.5 space-y-5 font-sans animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">Ringkasan Laporan Operasional</h2>
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight mt-0.5 font-display flex items-center gap-2">
          <span>Laporan Keuangan Hari Ini</span>
        </h1>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 uppercase tracking-wider">Terakhir disinkronkan untuk {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button 
          onClick={() => setActiveDetailModal('income')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between hover:shadow-lg dark:hover:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-105 transition-transform shrink-0">
              <TrendingUp size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-tight uppercase">Pemasukan</p>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono truncate mt-0.5">Rp{todayStats.totalIncome.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0" />
        </button>

        <button 
          onClick={() => setActiveDetailModal('transactions')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between hover:shadow-lg dark:hover:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-450 rounded-xl group-hover:scale-105 transition-transform shrink-0">
              <ShoppingCart size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-tight uppercase">Transaksi</p>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono truncate mt-0.5">{todayStats.txCount} Transaksi</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-sky-500 transition-colors shrink-0" />
        </button>

        <button 
          onClick={() => setActiveDetailModal('expenses')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between hover:shadow-lg dark:hover:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 rounded-xl group-hover:scale-105 transition-transform shrink-0">
              <ArrowDownCircle size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-tight uppercase">Pengeluaran</p>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono truncate mt-0.5">Rp{todayStats.totalExpenses.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-rose-500 transition-colors shrink-0" />
        </button>

        <button 
          onClick={() => setActiveDetailModal('cash')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between hover:shadow-lg dark:hover:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-105 transition-transform shrink-0">
              <Wallet size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-tight uppercase">Kas Akhir</p>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono truncate mt-0.5">Rp{todayStats.finalCash.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0" />
        </button>
      </div>

      {/* Initial Cash Button */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800 p-3 rounded-2xl transition-colors">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl shadow-xs hover:shadow-sm border border-slate-150/45 dark:border-slate-755 transition-all font-bold text-xs cursor-pointer"
        >
          <Plus size={14} />
          <span>Atur Kas & Laci Kasir</span>
          <span className="ml-2 px-2 py-0.5 bg-slate-100/85 dark:bg-slate-900 rounded-lg text-[10px] text-slate-600 dark:text-slate-400 font-mono">Rp {initialCash.toLocaleString('id-ID')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Financial Flow AND Cash Totals */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between shrink-0 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-50 dark:border-slate-850/60 mb-4">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">Arus Keuangan Hari Ini</h3>
              <span className="text-[9px] bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 dark:text-slate-500 font-extrabold tracking-wider uppercase">Real-time</span>
            </div>
            
            <div className="space-y-4">
              {cashFlowData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850/30 pb-3.5 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-850 dark:text-slate-200 font-mono">Rp {item.value.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 dark:text-slate-450 uppercase tracking-wide">Total Saldo Kasir</span>
              <span className="text-sm font-black text-slate-905 dark:text-white font-mono bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100/50 dark:border-emerald-900/40 px-3 py-1.5 rounded-xl">
                Rp{todayStats.finalCash.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity of payments - Spans 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden shrink-0 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-850/60 mb-4">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">Aktivitas Pembayaran Terbaru</h3>
            <span className="text-[10px] text-slate-400 font-extrabold px-2.5 py-0.5 bg-slate-50 dark:bg-slate-800 border-slate-100/40 dark:border-slate-800 border rounded-lg">{todayStats.recentTxs.length} Pembayaran</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="pb-3 text-left">Waktu</th>
                  <th className="pb-3 text-left">Transaksi ID</th>
                  <th className="pb-3 text-left">Metode</th>
                  <th className="pb-3 text-left">Kasir</th>
                  <th className="pb-3 text-right">Total</th>
                  <th className="pb-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/30">
                {todayStats.recentTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="inline-flex items-center gap-1.5 font-mono">
                        <Clock size={12} className="text-slate-400" />
                        {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-xs text-slate-600 dark:text-slate-350 font-bold">{tx.transaction_code}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-md px-1.5 py-0.5">
                        {tx.payment_method === PaymentMethod.TUNAI ? <Banknote size={11} className="text-emerald-500" /> : <CreditCard size={11} className="text-slate-500" />}
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-slate-600 dark:text-slate-300 font-bold truncate max-w-[120px]">{tx.cashier_name}</td>
                    <td className="py-2.5 text-right font-black text-xs text-slate-850 dark:text-slate-100 font-mono">Rp{tx.total.toLocaleString('id-ID')}</td>
                    <td className="py-2.5 text-center">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => setEditingTransaction(JSON.parse(JSON.stringify(tx)))}
                          className="p-1 px-[5px] text-slate-550 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => onPrintReceipt(tx)}
                          className="p-1 px-[5px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-transparent rounded-lg transition-colors cursor-pointer"
                          title="Cetak Ulang Struk"
                        >
                          <Printer size={12} />
                        </button>
                        <button 
                          onClick={() => window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?') && onDeleteTransaction(tx.id)}
                          className="p-1 px-[5px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent rounded-lg transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {todayStats.recentTxs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-slate-400 dark:text-slate-550 font-medium font-sans">Belum ada transaksi hari ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modals */}
      {activeDetailModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-[110] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div>
                <h2 className="text-sm font-extrabold text-slate-855 tracking-tight">
                  {activeDetailModal === 'income' && "Ringkasan Pembayaran Hari Ini"}
                  {activeDetailModal === 'transactions' && "Daftar Transaksi Hari Ini"}
                  {activeDetailModal === 'expenses' && "Daftar Pengeluaran Hari Ini"}
                  {activeDetailModal === 'cash' && "Rincian Kas Akhir"}
                </h2>
                <p className="text-[10px] text-slate-400 font-medium tracking-tight">Informasi laporan harian operasional & keuangan</p>
              </div>
              <button onClick={() => setActiveDetailModal(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto bg-slate-50/50">
              {activeDetailModal === 'cash' && (
                <div className="mb-6 text-center bg-white p-4 rounded-2xl border border-slate-100 max-w-xs mx-auto shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Kas Akhir</p>
                  <p className="text-2xl font-black text-slate-900 font-mono">Rp{todayStats.finalCash.toLocaleString('id-ID')}</p>
                </div>
              )}

              <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100/80">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-450 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                      {activeDetailModal === 'income' && (
                        <>
                          <th className="px-5 py-3">Waktu</th>
                          <th className="px-5 py-3">Kode</th>
                          <th className="px-5 py-3">Metode</th>
                          <th className="px-5 py-3 text-right">Nominal</th>
                          <th className="px-5 py-3 text-center">Aksi</th>
                        </>
                      )}
                      {activeDetailModal === 'transactions' && (
                        <>
                          <th className="px-5 py-3">Waktu</th>
                          <th className="px-5 py-3">Metode</th>
                          <th className="px-5 py-3">Kasir</th>
                          <th className="px-5 py-3 text-right">Nominal</th>
                          <th className="px-5 py-3 text-center">Aksi</th>
                        </>
                      )}
                      {activeDetailModal === 'expenses' && (
                        <>
                          <th className="px-5 py-3">Tanggal</th>
                          <th className="px-5 py-3">Deskripsi</th>
                          <th className="px-5 py-3 text-right">Jumlah</th>
                          <th className="px-5 py-3 text-center">Aksi</th>
                        </>
                      )}
                      {activeDetailModal === 'cash' && (
                        <>
                          <th className="px-5 py-3">Metode Pembayaran</th>
                          <th className="px-5 py-3 text-right">Total Nominal</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60 font-sans">
                    {(activeDetailModal === 'income' || activeDetailModal === 'transactions') && 
                      transactions.filter(t => t.date.startsWith(today)).map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-3 text-slate-500 font-mono">
                            {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          {activeDetailModal === 'income' && (
                            <td className="px-5 py-3 font-mono text-slate-650 font-bold">{tx.transaction_code}</td>
                          )}
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-650 bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5">
                              {tx.payment_method === PaymentMethod.TUNAI ? <Banknote size={12} className="text-emerald-500" /> : <CreditCard size={12} className="text-slate-500" />}
                              {tx.payment_method}
                            </span>
                          </td>
                          {activeDetailModal === 'transactions' && (
                            <td className="px-5 py-3 text-slate-650 font-medium">{tx.cashier_name}</td>
                          )}
                          <td className="px-5 py-3 text-right font-black text-slate-855 font-mono">Rp{tx.total.toLocaleString('id-ID')}</td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex justify-center gap-1">
                              <button 
                                onClick={() => setEditingTransaction(JSON.parse(JSON.stringify(tx)))}
                                className="p-1 px-[5px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                onClick={() => onPrintReceipt(tx)}
                                className="p-1 px-[5px] text-emerald-600 hover:bg-emerald-50 border border-transparent rounded-lg transition-colors cursor-pointer"
                                title="Print Ulang Struk"
                              >
                                <Printer size={12} />
                              </button>
                              <button 
                                onClick={() => window.confirm('Hapus transaksi ini?') && onDeleteTransaction(tx.id)}
                                className="p-1 px-[5px] text-red-500 hover:bg-red-50 border border-transparent rounded-lg transition-colors cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                    {activeDetailModal === 'expenses' && 
                      expenses.filter(e => e.date.startsWith(today)).map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-3 text-slate-500 font-mono">
                            {new Date(exp.date).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-5 py-3 text-slate-800 font-semibold">{exp.description}</td>
                          <td className="px-5 py-3 text-right font-black text-slate-855 font-mono">Rp{exp.amount.toLocaleString('id-ID')}</td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex justify-center gap-1">
                              <button 
                                onClick={() => setEditingExpense({...exp})}
                                className="p-1 px-[5px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                onClick={() => window.confirm('Hapus pengeluaran ini?') && onDeleteExpense(exp.id)}
                                className="p-1 px-[5px] text-red-500 hover:bg-red-50 border border-transparent rounded-lg transition-colors cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                    {activeDetailModal === 'cash' && (
                      <>
                        {Object.values(PaymentMethod).map(method => {
                          const total = transactions
                             .filter(t => t.date.startsWith(today) && t.payment_method === method)
                             .reduce((sum, t) => sum + t.total, 0);
                          return (
                            <tr key={method} className="hover:bg-slate-50/40 transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex items-center space-x-2">
                                  {method === PaymentMethod.TUNAI ? <Banknote size={13} className="text-emerald-500" /> : <CreditCard size={13} className="text-slate-500" />}
                                  <span className="text-slate-700 font-semibold">{method}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right font-black text-slate-800 font-mono">Rp {total.toLocaleString('id-ID')}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-50/50">
                          <td className="px-5 py-3 font-bold text-slate-800">Total Pemasukan</td>
                          <td className="px-5 py-3 text-right font-black text-slate-900 font-mono">Rp {todayStats.totalIncome.toLocaleString('id-ID')}</td>
                        </tr>
                        <tr>
                          <td className="px-5 py-3 font-semibold text-slate-500">Kas Awal (Laci)</td>
                          <td className="px-5 py-3 text-right font-bold text-slate-650 font-mono">Rp {initialCash.toLocaleString('id-ID')}</td>
                        </tr>
                        <tr>
                          <td className="px-5 py-3 font-semibold text-red-650">Total Pengeluaran</td>
                          <td className="px-5 py-3 text-right font-black text-red-650 font-mono">- Rp{todayStats.totalExpenses.toLocaleString('id-ID')}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Edit Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-[120] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-sm font-extrabold text-slate-855 tracking-tight">Edit Transaksi {editingTransaction.transaction_code}</h2>
                <p className="text-[10px] text-slate-400 font-medium tracking-tight">Kelola metode pembayaran atau porsi item</p>
              </div>
              <button onClick={() => setEditingTransaction(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Metode Pembayaran</label>
                  <select 
                    value={editingTransaction.payment_method}
                    onChange={(e) => setEditingTransaction({...editingTransaction, payment_method: e.target.value as PaymentMethod})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-slate-400"
                  >
                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total (Kalkulasi)</label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-800 font-mono">Rp {editingTransaction.total.toLocaleString('id-ID')}</div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Daftar Item Keranjang</h4>
                <div className="max-h-52 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                  {editingTransaction.details.map((det, idx) => (
                    <div key={det.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100/80 shadow-xs">
                      <div className="flex-grow">
                        <p className="font-bold text-xs text-slate-800">{det.product_name || `Produk ID: ${det.product_id}`}</p>
                        <p className="text-[10px] text-slate-400 font-semibold font-mono">Rp{det.unit_price.toLocaleString('id-ID')} x {det.quantity}</p>
                      </div>
                      <div className="flex items-center space-x-2.5">
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
                          className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center text-xs font-bold font-mono"
                          min="1"
                        />
                        <p className="font-bold text-slate-800 text-xs w-20 text-right font-mono">Rp {det.subtotal.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-50">
                <button 
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={async () => {
                    const success = await onSaveTransaction(editingTransaction);
                    if (success) setEditingTransaction(null);
                  }}
                  className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 shadow-sm shadow-slate-950/15 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-[120] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-sm font-extrabold text-slate-855 tracking-tight">Edit Detail Pengeluaran</h2>
                <p className="text-[10px] text-slate-400 font-medium tracking-tight">Perbarui jumlah nominal dan pembiayaan toko</p>
              </div>
              <button onClick={() => setEditingExpense(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deskripsi Kegiatan/Barang</label>
                <input 
                  type="text" 
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jumlah (Rp)</label>
                  <input 
                    type="number" 
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({...editingExpense, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 font-bold focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori</label>
                  <input 
                    type="text" 
                    value={editingExpense.category}
                    onChange={(e) => setEditingExpense({...editingExpense, category: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-slate-400 p-3"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-3 border-t border-slate-50">
                <button 
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={async () => {
                    const success = await onSaveExpense(editingExpense);
                    if (success) setEditingExpense(null);
                  }}
                  className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 shadow-sm shadow-slate-950/15 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Initial Cash Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-[110] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-sm font-extrabold text-slate-855 tracking-tight font-display">Atur Kas Awal Harian</h2>
                <p className="text-[10px] text-slate-400 font-medium tracking-tight">Atur nilai modal laci & kembalian hari ini</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-slate-500 text-[11px] font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                Masukkan jumlah modal atau uang kembalian yang tersedia di laci pada awal hari ini. Nilai ini akan digabungkan secara otomatis dalam perhitungan kas akhir toko.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Jumlah Kas Awal di Laci (Rp)</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-extrabold">Rp</div>
                  <input 
                    type="number" 
                    value={tempInitialCash}
                    onChange={(e) => setTempInitialCash(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-mono text-slate-800 font-bold"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-3 border-t border-slate-50">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveInitialCash}
                  className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 shadow-sm shadow-slate-950/15 cursor-pointer"
                >
                  Simpan Nilai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
