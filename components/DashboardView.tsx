import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Expense, PaymentMethod } from '../types';
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
  X
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
}

const DashboardView: React.FC<DashboardViewProps> = ({ transactions, expenses }) => {
  const [initialCash, setInitialCash] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempInitialCash, setTempInitialCash] = useState<string>('0');

  const today = new Date().toISOString().split('T')[0];
  const storageKey = `initial_cash_${today}`;

  useEffect(() => {
    const fetchInitialCash = async () => {
      const saved = await getAppSetting(storageKey);
      if (saved) {
        setInitialCash(parseFloat(saved));
        setTempInitialCash(saved);
      }
    };
    fetchInitialCash();
  }, [storageKey]);

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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900">Dashboard Penjualan Harian</h1>
        <p className="text-gray-500">Ringkasan aktivitas penjualan Anda hari ini, {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pemasukan Hari Ini</p>
            <p className="text-2xl font-bold text-gray-900">Rp {todayStats.totalIncome.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Jumlah Transaksi</p>
            <p className="text-2xl font-bold text-gray-900">{todayStats.txCount} Transaksi</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <ArrowDownCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pengeluaran</p>
            <p className="text-2xl font-bold text-gray-900">Rp {todayStats.totalExpenses.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Kas Akhir</p>
            <p className="text-2xl font-bold text-gray-900">Rp {todayStats.finalCash.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Initial Cash Button */}
      <div className="mb-8">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-white border border-blue-200 text-blue-700 px-6 py-3 rounded-xl shadow-sm hover:bg-blue-50 transition-all font-semibold"
        >
          <Plus size={20} />
          <span>Atur Laci / Kas Awal</span>
          <span className="ml-2 px-2 py-0.5 bg-blue-100 rounded-lg text-xs">Rp {initialCash.toLocaleString('id-ID')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Grafik Penjualan Hari Ini</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => `Rp ${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [`Rp ${val.toLocaleString('id-ID')}`, 'Penjualan']}
                />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Flow */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Arus Keuangan</h3>
          <div className="space-y-6">
            {cashFlowData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900">Rp {item.value.toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div className="pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-bold">Total Kas Akhir</span>
                <span className="text-xl font-black text-indigo-600">Rp {todayStats.finalCash.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Aktivitas Pembayaran Terbaru Hari Ini</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm uppercase tracking-wider">
                  <th className="pb-4 font-medium">Waktu</th>
                  <th className="pb-4 font-medium">Kode</th>
                  <th className="pb-4 font-medium">Metode</th>
                  <th className="pb-4 font-medium">Kasir</th>
                  <th className="pb-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todayStats.recentTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Clock size={14} className="text-gray-400" />
                        <span>{new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="py-4 font-mono text-sm text-blue-600 font-medium">{tx.transaction_code}</td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        {tx.payment_method === PaymentMethod.TUNAI ? <Banknote size={16} className="text-emerald-500" /> : <CreditCard size={16} className="text-blue-500" />}
                        <span className="text-gray-700">{tx.payment_method}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-700">{tx.cashier_name}</td>
                    <td className="py-4 text-right font-bold text-gray-900">Rp {tx.total.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
                {todayStats.recentTxs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">Belum ada aktivitas transaksi hari ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Initial Cash Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-900 text-white">
              <h2 className="text-xl font-bold">Atur Kas Awal Harian</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Masukkan jumlah modal atau uang kembalian yang tersedia di laci pada awal hari. Nilai ini akan digunakan untuk perhitungan kas akhir hari ini.
                </p>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Kas Awal (Rp)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</div>
                  <input 
                    type="number" 
                    value={tempInitialCash}
                    onChange={(e) => setTempInitialCash(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all text-xl font-bold"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveInitialCash}
                  className="flex-1 py-4 bg-blue-900 text-white rounded-2xl font-bold hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all"
                >
                  Simpan
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
