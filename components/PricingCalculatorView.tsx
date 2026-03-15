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
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-blue-100 rounded-xl text-[#2F4B8B]">
                    <CalculatorIcon className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold text-blue-900">Kalkulator Harga Jual</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inputs */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8 border border-blue-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Harga Modal (Rp)</label>
                            <input 
                                type="number" 
                                value={costPrice || ''} 
                                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-bold"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Beban Listrik (Rp)</label>
                            <input 
                                type="number" 
                                value={electricity || ''} 
                                onChange={(e) => setElectricity(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-bold"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Beban Internet (Rp)</label>
                            <input 
                                type="number" 
                                value={internet || ''} 
                                onChange={(e) => setInternet(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-bold"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Gaji Karyawan (Rp)</label>
                            <input 
                                type="number" 
                                value={salary || ''} 
                                onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-bold"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Akomodasi (Rp)</label>
                            <input 
                                type="number" 
                                value={accommodation || ''} 
                                onChange={(e) => setAccommodation(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-bold"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Pajak / Biaya Lain (%)</label>
                            <input 
                                type="number" 
                                value={taxPercent || ''} 
                                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-bold"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Tipe Keuntungan</label>
                            <div className="flex p-1 bg-gray-100 rounded-xl">
                                <button 
                                    onClick={() => setProfitType('percent')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${profitType === 'percent' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Persentase (%)
                                </button>
                                <button 
                                    onClick={() => setProfitType('amount')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${profitType === 'amount' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Nominal (Rp)
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                {profitType === 'percent' ? 'Keuntungan (%)' : 'Keuntungan (Rp)'}
                            </label>
                            <input 
                                type="number" 
                                value={profitValue || ''} 
                                onChange={(e) => setProfitValue(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-bold"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="bg-[#2F4B8B] rounded-2xl shadow-xl p-8 text-white flex flex-col justify-center space-y-6 relative overflow-hidden h-fit lg:sticky lg:top-6">
                    {/* Decorative circles */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-2">Rekomendasi Harga Jual</p>
                        <h2 className="text-5xl font-black">Rp {Math.round(sellingPrice).toLocaleString('id-ID')}</h2>
                    </div>

                    <div className="relative z-10 space-y-4 pt-6 border-t border-white/10">
                        <div className="flex justify-between items-center text-blue-100">
                            <span className="text-sm font-medium">Total Modal + Beban</span>
                            <span className="font-bold">Rp {totalBaseCost.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-blue-100">
                            <span className="text-sm font-medium">Total Keuntungan Bersih</span>
                            <span className="font-bold">Rp {(Math.round(sellingPrice) - totalBaseCost).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-blue-100">
                            <span className="text-sm font-medium">Margin Keuntungan</span>
                            <span className="font-bold">
                                {sellingPrice > 0 ? (((sellingPrice - totalBaseCost) / sellingPrice) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                    </div>

                    <div className="relative z-10 bg-white/10 p-4 rounded-xl text-xs text-blue-100 leading-relaxed italic">
                        * Gunakan harga ini sebagai referensi. Pertimbangkan juga harga pasar dan kompetitor di sekitar Anda.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingCalculatorView;
