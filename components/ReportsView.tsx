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

const StatCard: React.FC<{ title: string; value: string | number; color?: string }> = ({ title, value, color = 'text-blue-900' }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#2F4B8B]">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
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
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 no-print">
        <h1 className="text-3xl font-bold text-blue-900">Laporan Keuangan</h1>
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
                <button onClick={() => setViewMode('daily')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'daily' ? 'bg-[#2F4B8B] text-white' : 'text-gray-600 hover:bg-blue-100'}`}>Harian</button>
                <button onClick={() => setViewMode('monthly')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'monthly' ? 'bg-[#2F4B8B] text-white' : 'text-gray-600 hover:bg-blue-100'}`}>Bulanan</button>
            </div>
            <button onClick={exportToExcel} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors">
                <DownloadIcon className="w-5 h-5" />
                <span>Excel</span>
            </button>
            <button onClick={handlePrint} className="flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-800 transition-colors">
                <PrintIcon className="w-5 h-5" />
                <span>Cetak A4</span>
            </button>
        </div>
      </div>
      
      <div className="mb-6 max-w-xs no-print">
      {viewMode === 'daily' ? (
          <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
      ) : (
          <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
      )}
      </div>

      <div className="print-only mb-8 text-center hidden">
          <h1 className="text-2xl font-bold text-blue-900">LAPORAN KEUANGAN NALA SENTRAL</h1>
          <p className="text-gray-600">Periode: {viewMode === 'daily' ? selectedDate : selectedMonth}</p>
          <div className="mt-4 border-t border-b py-4 grid grid-cols-3 gap-4">
              <div>
                  <p className="text-xs text-gray-500 uppercase">Total Omzet</p>
                  <p className="font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</p>
              </div>
              <div>
                  <p className="text-xs text-gray-500 uppercase">Laba Kotor</p>
                  <p className="font-bold text-green-600">Rp {grossProfit.toLocaleString('id-ID')}</p>
              </div>
              <div>
                  <p className="text-xs text-gray-500 uppercase">Laba Bersih</p>
                  <p className="font-bold text-blue-800">Rp {netProfit.toLocaleString('id-ID')}</p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-8 no-print">
        <StatCard title="Omzet" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} />
        <StatCard title="Modal" value={`Rp ${totalCOGS.toLocaleString('id-ID')}`} color="text-orange-600" />
        <StatCard title="Laba Kotor" value={`Rp ${grossProfit.toLocaleString('id-ID')}`} color="text-green-600" />
        <StatCard title="Pengeluaran" value={`Rp ${totalExpenses.toLocaleString('id-ID')}`} color="text-red-600" />
        <StatCard title="Laba Bersih" value={`Rp ${netProfit.toLocaleString('id-ID')}`} color={netProfit >= 0 ? 'text-green-700' : 'text-red-700'} />
        <StatCard title="Terjual" value={`${totalItemsSold} pcs`} color="text-blue-700" />
        <StatCard title="Nilai Stok" value={`Rp ${totalStockValue.toLocaleString('id-ID')}`} color="text-purple-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            {/* Chart Section */}
            <div className="bg-white p-6 rounded-xl shadow-md no-print">
                <h2 className="text-xl font-bold text-blue-900 mb-4">Grafik Pertumbuhan</h2>
                <div className="relative h-80">
                    <canvas ref={chartRef}></canvas>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-blue-900 mb-4">Produk Terlaris</h2>
                <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-2">Produk</th>
                                <th className="px-4 py-2 text-right">Terjual</th>
                                <th className="px-4 py-2 text-right">Omzet</th>
                                <th className="px-4 py-2 text-right">Modal</th>
                                <th className="px-4 py-2 text-right">Laba</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedBestSelling.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{item.name} <span className="text-xs text-gray-500">({item.size})</span></td>
                                    <td className="px-4 py-3 text-right font-bold text-blue-700">{item.quantity} pcs</td>
                                    <td className="px-4 py-3 text-right">Rp {item.revenue.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right text-orange-600">Rp {item.cost.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right text-green-600 font-semibold">Rp {item.profit.toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                            {paginatedBestSelling.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada data produk terjual</td>
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

        <div className="bg-white p-6 rounded-xl shadow-md h-fit">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Ringkasan Transaksi</h2>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">Jumlah Transaksi</span>
                    <span className="font-bold text-blue-900">{totalTransactions}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-600">Rata-rata Transaksi</span>
                    <span className="font-bold text-green-900">Rp {(totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Barang</span>
                    <span className="font-bold text-orange-900">{totalItemsSold} pcs</span>
                </div>
            </div>

            <div className="mt-8 mb-4">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Daftar Transaksi</h3>
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        value={transactionSearch}
                        onChange={(e) => { setTransactionSearch(e.target.value); setTransactionPage(1); }}
                        placeholder="Cari kode atau kasir..."
                        className="w-full pl-9 pr-4 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
            
            <div className="mb-4">
                {paginatedTransactions.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                    {paginatedTransactions.map(t => (
                        <li key={t.id} className="py-3">
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-800">{t.transaction_code}</span>
                                <div className="text-right">
                                    <span className="font-semibold text-gray-800">Rp {t.total.toLocaleString('id-ID')}</span>
                                    {t.discount_amount && t.discount_amount > 0 && (
                                        <p className="text-[10px] text-red-500 font-bold">Disc: -Rp {t.discount_amount.toLocaleString('id-ID')}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{new Date(t.date).toLocaleTimeString('id-ID')}</span>
                                <span>{t.cashier_name}</span>
                            </div>
                        </li>
                    ))}
                </ul>
                ) : (
                    <p className="text-gray-500 text-center py-4">Tidak ada data.</p>
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

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { padding: 0; margin: 0; background: white; color: black; }
            .p-6 { padding: 0 !important; }
            .shadow-md, .shadow-xl { box-shadow: none !important; border: 1px solid #eee; }
            .grid { display: block !important; }
            .lg\\:col-span-2, .h-fit { width: 100% !important; margin-bottom: 20px; }
            table { font-size: 10px; width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #eee; padding: 4px; }
            @page { size: A4; margin: 1.5cm; }
            h1, h2, h3 { color: #2F4B8B !important; }
        }
      `}} />
    </div>
  );
};

export default ReportsView;