import React, { useState, useEffect } from 'react';
import { CalculatorIcon } from './Icons';

const PricingCalculatorView: React.FC = () => {
    const [costPrice, setCostPrice] = useState<number>(0);
    const [electricity, setElectricity] = useState<number>(0);
    const [internet, setInternet] = useState<number>(0);
    const [salary, setSalary] = useState<number>(0);
    const [accommodation, setAccommodation] = useState<number>(0);
    const [taxPercent, setTaxPercent] = useState<number>(0);
    const [profitType, setProfitType] = useState<'percent' | 'amount'>('percent');
    const [profitValue, setProfitValue] = useState<number>(0);
    const [sellingPrice, setSellingPrice] = useState<number>(0);

    const totalBaseCost = costPrice + electricity + internet + salary + accommodation;

    useEffect(() => {
        let profit = 0;
        if (profitType === 'percent') {
            profit = totalBaseCost * (profitValue / 100);
        } else {
            profit = profitValue;
        }

        const subtotal = totalBaseCost + profit;
        const tax = subtotal * (taxPercent / 100);
        setSellingPrice(subtotal + tax);
    }, [totalBaseCost, profitType, profitValue, taxPercent]);

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center space-x-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 shadow-xs">
                    <CalculatorIcon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Kalkulator Harga Jual</h1>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-0.5">Analisis instan margin profit & kelayakan harga</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inputs */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-805/70 shadow-sm space-y-5 text-slate-800 dark:text-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1.5 leading-none">Harga Modal Pokok (Rp)</label>
                            <input 
                                type="number" 
                                value={costPrice || ''} 
                                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-all font-mono font-bold text-sm"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1.5 leading-none">Biaya Listrik & Operasional (Rp)</label>
                            <input 
                                type="number" 
                                value={electricity || ''} 
                                onChange={(e) => setElectricity(parseFloat(e.target.value) || 0)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-all font-mono"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1.5 leading-none">Beban Internet & Pulsa (Rp)</label>
                            <input 
                                type="number" 
                                value={internet || ''} 
                                onChange={(e) => setInternet(parseFloat(e.target.value) || 0)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-all font-mono"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1.5 leading-none">Gaji Karyawan & Staf (Rp)</label>
                            <input 
                                type="number" 
                                value={salary || ''} 
                                onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-all font-mono"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1.5 leading-none">Akomodasi & Transportasi (Rp)</label>
                            <input 
                                type="number" 
                                value={accommodation || ''} 
                                onChange={(e) => setAccommodation(parseFloat(e.target.value) || 0)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-all font-mono"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1.5 leading-none">Pajak & Ops Lain (%)</label>
                            <input 
                                type="number" 
                                value={taxPercent || ''} 
                                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-all font-mono"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1.5 leading-none">Jenis Margin Target</label>
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850">
                                <button 
                                    onClick={() => setProfitType('percent')}
                                    className={`flex-1 py-1.5 text-[10px] font-black tracking-tight rounded-lg transition-all cursor-pointer ${profitType === 'percent' ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-xs' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                                >
                                    Persentase (%)
                                </button>
                                <button 
                                    onClick={() => setProfitType('amount')}
                                    className={`flex-1 py-1.5 text-[10px] font-black tracking-tight rounded-lg transition-all cursor-pointer ${profitType === 'amount' ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-xs' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                                >
                                    Nominal (Rp)
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1.5 leading-none">
                                {profitType === 'percent' ? 'Target Keuntungan (%)' : 'Target Keuntungan (Rp)'}
                            </label>
                            <input 
                                type="number" 
                                value={profitValue || ''} 
                                onChange={(e) => setProfitValue(parseFloat(e.target.value) || 0)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-all font-mono font-bold text-sm"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Results Card */}
                <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden border border-slate-850 shadow-xl h-fit">
                    <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-505/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-rose-505/10 rounded-full blur-2xl"></div>

                    <div className="relative z-10 space-y-1">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Rekomendasi Harga Jual</p>
                        <h2 className="text-3xl font-black text-white font-mono tracking-tight">Rp{Math.round(sellingPrice).toLocaleString('id-ID')}</h2>
                    </div>

                    <div className="relative z-10 space-y-3 pt-4 border-t border-slate-800/60 text-xs font-semibold">
                        <div className="flex justify-between items-center text-slate-400">
                            <span>Sektor Modal & Beban</span>
                            <span className="font-bold text-slate-200 font-mono">Rp {totalBaseCost.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                            <span>Proyeksi Laba Bersih</span>
                            <span className="font-bold text-emerald-400 font-mono">Rp {(Math.round(sellingPrice) - totalBaseCost).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                            <span>Margin Keuntungan</span>
                            <span className="font-bold text-indigo-400 font-mono">
                                {sellingPrice > 0 ? (((sellingPrice - totalBaseCost) / sellingPrice) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                    </div>

                    <div className="relative z-10 bg-slate-900/60 p-4 rounded-xl text-[10px] text-slate-400 leading-relaxed italic border border-slate-850/60">
                        * Gunakan penarifan ini sebagai standar acuan. Harap tetap selaraskan kondisi pasar dan kompetisi harga kompetitor di sekitar Anda.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingCalculatorView;
