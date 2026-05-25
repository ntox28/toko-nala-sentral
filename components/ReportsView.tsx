import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, Product, Expense } from '../types';
import * as XLSX from 'xlsx';
import { DownloadIcon, PrintIcon, SearchIcon } from './Icons';
import Pagination from './Pagination';

// Let TypeScript know Chart exists globally
declare var Chart: any;

interface ReportsViewProps {
  transactions: Transaction[];
  products: Product[];
  expenses: Expense[];
}

const StatCard: React.FC<{ title: string; value: string | number; color?: string }> = ({ title, value, color = 'text-slate-800 dark:text-slate-100' }) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100/80 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,23,42,0.015)] transition-all hover:translate-y-[-2px] duration-200">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</span>
        <p className={`mt-2 text-base font-black tracking-tight leading-none ${color}`}>{value}</p>
    </div>
);

const ReportsView: React.FC<ReportsViewProps> = ({ transactions, products, expenses }) => {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [bestSellingPage, setBestSellingPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionSearch, setTransactionSearch] = useState('');
  const itemsPerPage = 10;

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null); // To hold the chart instance

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      if (viewMode === 'daily') {
        return transactionDate.toISOString().split('T')[0] === selectedDate;
      }
      if (viewMode === 'monthly') {
        return transactionDate.toISOString().slice(0, 7) === selectedMonth;
      }
      return false;
    });
  }, [transactions, viewMode, selectedDate, selectedMonth]);
  
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
        const expenseDate = new Date(e.date);
        if (viewMode === 'daily') {
            return expenseDate.toISOString().split('T')[0] === selectedDate;
        }
        if (viewMode === 'monthly') {
            return expenseDate.toISOString().slice(0, 7) === selectedMonth;
        }
        return false;
    });
  }, [expenses, viewMode, selectedDate, selectedMonth]);

  const totalRevenue = useMemo(() => 
    filteredTransactions.reduce((sum, t) => sum + t.total, 0),
  [filteredTransactions]);

  const totalCOGS = useMemo(() => 
    filteredTransactions.reduce((sum, t) => {
        return sum + t.details.reduce((dSum, d) => dSum + (d.cost_price * d.quantity), 0);
    }, 0),
  [filteredTransactions]);

  const grossProfit = totalRevenue - totalCOGS;

  const totalExpenses = useMemo(() =>
    filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
  [filteredExpenses]);

  const netProfit = grossProfit - totalExpenses;
  
  const totalItemsSold = useMemo(() => 
    filteredTransactions.reduce((sum, t) => 
        sum + t.details.reduce((dSum, d) => dSum + d.quantity, 0), 0),
  [filteredTransactions]);

  const totalTransactions = filteredTransactions.length;

  const totalStockValue = useMemo(() => 
    products.reduce((sum, p) => sum + (p.stock * (p.cost_price || 0)), 0),
  [products]);

  const bestSellingProducts = useMemo(() => {
    const productSales: { [key: string]: { name: string; size: string, quantity: number, revenue: number, cost: number, profit: number } } = {};
    
    filteredTransactions.forEach(t => {
        t.details.forEach(d => {
            if (!productSales[d.product_id]) {
                const productInfo = products.find(p => p.id === d.product_id);
                productSales[d.product_id] = { 
                    name: productInfo?.name || 'Unknown', 
                    size: productInfo?.size || '',
                    quantity: 0,
                    revenue: 0,
                    cost: 0,
                    profit: 0
                };
            }
            productSales[d.product_id].quantity += d.quantity;
            productSales[d.product_id].revenue += d.subtotal;
            productSales[d.product_id].cost += d.cost_price * d.quantity;
            productSales[d.product_id].profit += (d.unit_price - d.cost_price) * d.quantity;
        });
    });

    return Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity);

  }, [filteredTransactions, products]);

  const paginatedBestSelling = useMemo(() => {
    const start = (bestSellingPage - 1) * itemsPerPage;
    return bestSellingProducts.slice(start, start + itemsPerPage);
  }, [bestSellingProducts, bestSellingPage]);

  const totalBestSellingPages = Math.ceil(bestSellingProducts.length / itemsPerPage);

  const searchedTransactions = useMemo(() => {
    return filteredTransactions.filter(t => 
        t.transaction_code.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        (t.cashier_name && t.cashier_name.toLowerCase().includes(transactionSearch.toLowerCase()))
    );
  }, [filteredTransactions, transactionSearch]);

  const paginatedTransactions = useMemo(() => {
    const start = (transactionPage - 1) * itemsPerPage;
    return searchedTransactions.slice(start, start + itemsPerPage);
  }, [searchedTransactions, transactionPage]);

  const totalTransactionPages = Math.ceil(searchedTransactions.length / itemsPerPage);

  const exportToExcel = () => {
    const data = filteredTransactions.map(t => ({
        'Kode Transaksi': t.transaction_code,
        'Tanggal': new Date(t.date).toLocaleString('id-ID'),
        'Kasir': t.cashier_name || '-',
        'Metode Pembayaran': t.payment_method,
        'Total Omzet': t.total,
        'Diskon': t.discount_amount || 0,
        'Total Modal': t.details.reduce((sum, d) => sum + (d.cost_price * d.quantity), 0),
        'Laba Kotor': t.total - t.details.reduce((sum, d) => sum + (d.cost_price * d.quantity), 0)
    }));

    const summaryData = [
        { 'Kategori': 'Total Omzet', 'Nilai': totalRevenue },
        { 'Kategori': 'Total Modal', 'Nilai': totalCOGS },
        { 'Kategori': 'Laba Kotor', 'Nilai': grossProfit },
        { 'Kategori': 'Total Pengeluaran', 'Nilai': totalExpenses },
        { 'Kategori': 'Laba Bersih', 'Nilai': netProfit },
        { 'Kategori': 'Total Transaksi', 'Nilai': totalTransactions },
        { 'Kategori': 'Total Barang Terjual', 'Nilai': totalItemsSold }
    ];

    const wb = XLSX.utils.book_new();
    const wsTransactions = XLSX.utils.json_to_sheet(data);
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Detail Transaksi');
    
    const fileName = `Laporan_Nala_Sentral_${viewMode === 'daily' ? selectedDate : selectedMonth}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handlePrint = () => {
    window.print();
  };
  
  // Chart rendering effect
  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy previous chart instance
    if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    let labels: string[] = [];
    let salesData: number[] = [];
    let profitData: number[] = [];
    let expensesData: number[] = [];

    if (viewMode === 'daily') {
        labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        salesData = Array(24).fill(0);
        profitData = Array(24).fill(0);
        expensesData = Array(24).fill(0);

        filteredTransactions.forEach(t => {
            const hour = new Date(t.date).getHours();
            salesData[hour] += t.total;
            profitData[hour] += t.total - t.details.reduce((sum, d) => sum + (d.cost_price * d.quantity), 0);
        });
        filteredExpenses.forEach(e => {
            const hour = new Date(e.date).getHours();
            expensesData[hour] += e.amount;
        });
    } else { // monthly
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
        salesData = Array(daysInMonth).fill(0);
        profitData = Array(daysInMonth).fill(0);
        expensesData = Array(daysInMonth).fill(0);

        filteredTransactions.forEach(t => {
            const day = new Date(t.date).getDate();
            salesData[day - 1] += t.total;
            profitData[day - 1] += t.total - t.details.reduce((sum, d) => sum + (d.cost_price * d.quantity), 0);
        });
        filteredExpenses.forEach(e => {
            const day = new Date(e.date).getDate();
            expensesData[day - 1] += e.amount;
        });
    }

    chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Omzet',
                    data: salesData,
                    borderColor: 'rgb(47, 75, 139)',
                    backgroundColor: 'rgba(47, 75, 139, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Laba Kotor',
                    data: profitData,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Pengeluaran',
                    data: expensesData,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value: any) => 'Rp ' + value.toLocaleString('id-ID')
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => {
                           let label = context.dataset.label || '';
                           if (label) {
                               label += ': ';
                           }
                           if (context.parsed.y !== null) {
                               label += 'Rp ' + context.parsed.y.toLocaleString('id-ID');
                           }
                           return label;
                        }
                    }
                }
            }
        }
    });

    // Cleanup on component unmount
    return () => {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }
    };
  }, [viewMode, filteredTransactions, filteredExpenses, selectedMonth]);

  return (
    <div className="p-0.5 space-y-4 font-sans animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-150/40 dark:border-slate-800/80 space-y-4 md:space-y-0 no-print">
        <div>
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">Analisis & Transaksi</h2>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">Laporan Keuangan Toko</h1>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Pantau omzet, laba kotor, laba bersih, serta tren performa barang</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-750">
                <button onClick={() => setViewMode('daily')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'daily' ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350'}`}>Harian</button>
                <button onClick={() => setViewMode('monthly')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350'}`}>Bulanan</button>
            </div>
            <button onClick={exportToExcel} className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors">
                <DownloadIcon className="w-4 h-4" />
                <span>Unduh Excel</span>
            </button>
            <button onClick={handlePrint} className="flex items-center space-x-1.5 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-850 dark:hover:bg-slate-200 cursor-pointer transition-all">
                <PrintIcon className="w-4 h-4" />
                <span>Cetak POS</span>
            </button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="w-full sm:max-w-xs">
          {viewMode === 'daily' ? (
              <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 rounded-xl font-bold focus:outline-none focus:border-slate-450 dark:focus:border-slate-655 shadow-xs"
              />
          ) : (
              <input 
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 rounded-xl font-bold focus:outline-none focus:border-slate-450 dark:focus:border-slate-655 shadow-xs"
              />
          )}
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          Filter: <span className="text-slate-700 dark:text-slate-350">{viewMode === 'daily' ? selectedDate : selectedMonth}</span>
        </p>
      </div>

      <div className="print-only mb-8 text-center hidden">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">LAPORAN KEUANGAN TOKO NALA SENTRAL</h1>
          <p className="text-gray-500">Periode: {viewMode === 'daily' ? selectedDate : selectedMonth}</p>
          <div className="mt-4 border-t border-b border-slate-100 dark:border-slate-800 py-4 grid grid-cols-3 gap-4">
              <div>
                  <p className="text-xs text-gray-400 uppercase">Total Omzet</p>
                  <p className="font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</p>
              </div>
              <div>
                  <p className="text-xs text-gray-400 uppercase">Laba Kotor</p>
                  <p className="font-bold text-green-600">Rp {grossProfit.toLocaleString('id-ID')}</p>
              </div>
              <div>
                  <p className="text-xs text-gray-400 uppercase">Laba Bersih</p>
                  <p className="font-bold text-blue-600">Rp {netProfit.toLocaleString('id-ID')}</p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4 no-print">
        <StatCard title="Omzet" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} />
        <StatCard title="Modal" value={`Rp ${totalCOGS.toLocaleString('id-ID')}`} color="text-orange-600 dark:text-orange-400" />
        <StatCard title="Laba Kotor" value={`Rp ${grossProfit.toLocaleString('id-ID')}`} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Beban Biya" value={`Rp ${totalExpenses.toLocaleString('id-ID')}`} color="text-rose-600 dark:text-rose-400" />
        <StatCard title="Laba Bersih" value={`Rp ${netProfit.toLocaleString('id-ID')}`} color={netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'} />
        <StatCard title="Terjual" value={`${totalItemsSold} pcs`} color="text-indigo-600 dark:text-indigo-400" />
        <StatCard title="Aset/Stok" value={`Rp ${totalStockValue.toLocaleString('id-ID')}`} color="text-purple-600 dark:text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4.5">
        <div className="lg:col-span-2 space-y-4">
            {/* Chart Section */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150/50 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,23,42,0.015)] no-print">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xs font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider">Grafik Pertumbuhan</h2>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Terupdate otomatis</span>
                </div>
                <div className="relative h-72">
                    <canvas ref={chartRef}></canvas>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150/50 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,23,42,0.015)]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xs font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider">Produk Terlaris</h2>
                    <span className="text-[10px] text-slate-400 dark:text-slate-555 font-bold">{bestSellingProducts.length} produk</span>
                </div>
                <div className="overflow-x-auto mb-3">
                    <table className="w-full text-left font-sans">
                        <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-2.5">Nama Produk</th>
                                <th className="px-4 py-2.5 text-right">Terjual</th>
                                <th className="px-4 py-2.5 text-right">Omzet</th>
                                <th className="px-4 py-2.5 text-right">Biaya Modal</th>
                                <th className="px-4 py-2.5 text-right">Laba</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-705 dark:text-slate-350">
                            {paginatedBestSelling.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-150 whitespace-nowrap">
                                        {item.name} <span className="text-[10px] text-slate-400 dark:text-slate-550 font-medium">({item.size})</span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400 font-mono">{item.quantity} pcs</td>
                                    <td className="px-4 py-3 text-right font-mono">Rp{item.revenue.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400 font-mono">Rp{item.cost.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-455 font-black font-mono">Rp{item.profit.toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                            {paginatedBestSelling.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-650">Tidak ada data produk terjual</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination 
                    currentPage={bestSellingPage}
                    totalPages={totalBestSellingPages}
                    onPageChange={setBestSellingPage}
                    totalItems={bestSellingProducts.length}
                    itemsPerPage={itemsPerPage}
                />
            </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150/50 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,23,42,0.015)] h-fit space-y-5">
            <div>
                <h2 className="text-xs font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-3">Ringkasan Sesi</h2>
                <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-855 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <span className="text-xs text-slate-550 dark:text-slate-400 font-medium font-sans">Banyak Transaksi</span>
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 font-mono">{totalTransactions} kali</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-855 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <span className="text-xs text-slate-550 dark:text-slate-400 font-medium font-sans">Rata-rata Keranjang</span>
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 font-mono">Rp{(totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-855 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <span className="text-xs text-slate-550 dark:text-slate-400 font-medium font-sans">Banyak Barang Laku</span>
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 font-mono">{totalItemsSold} pcs</span>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/65 pt-4">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-3">Daftar Transaksi</h3>
                <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="text-slate-400 w-3.5 h-3.5" />
                    </div>
                    <input 
                        type="text" 
                        value={transactionSearch}
                        onChange={(e) => { setTransactionSearch(e.target.value); setTransactionPage(1); }}
                        placeholder="Cari kode atau kasir..."
                        className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 rounded-xl font-semibold focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-xs"
                    />
                </div>
                
                <div className="mb-3 max-h-72 overflow-y-auto pr-0.5 whitespace-nowrap">
                    {paginatedTransactions.length > 0 ? (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                        {paginatedTransactions.map(t => (
                            <li key={t.id} className="py-2.5 hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                                <div className="flex justify-between">
                                    <span className="font-bold text-slate-800 dark:text-slate-150 font-mono">{t.transaction_code}</span>
                                    <div className="text-right">
                                        <span className="font-extrabold text-slate-850 dark:text-slate-100">Rp{t.total.toLocaleString('id-ID')}</span>
                                        {t.discount_amount && t.discount_amount > 0 && (
                                            <p className="text-[10px] text-red-500 dark:text-red-400 font-bold leading-none mt-0.5">Disc: -Rp{t.discount_amount.toLocaleString('id-ID')}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                    <span>{new Date(t.date).toLocaleTimeString('id-ID')}</span>
                                    <span className="font-bold">{t.cashier_name}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                    ) : (
                        <p className="text-slate-450 dark:text-slate-600 text-center py-4 font-semibold">Tidak ada data.</p>
                    )}
                </div>

                <Pagination 
                    currentPage={transactionPage}
                    totalPages={totalTransactionPages}
                    onPageChange={setTransactionPage}
                    totalItems={searchedTransactions.length}
                    itemsPerPage={itemsPerPage}
                />
            </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { padding: 0; margin: 0; background: white; color: black; }
            .p-0.5 { padding: 0 !important; }
            .shadow-md, .shadow-2xl { box-shadow: none !important; border: 1px solid #eee; }
            .grid { display: block !important; }
            .lg\\:col-span-2, .h-fit { width: 100% !important; margin-bottom: 20px; }
            table { font-size: 10px; width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #eee; padding: 4px; }
            @page { size: A4; margin: 1.5cm; }
        }
      `}} />
    </div>
  );
};

export default ReportsView;