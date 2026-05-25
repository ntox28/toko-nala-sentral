import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../supabase';

interface LoginViewProps {
    onLoginSuccess: () => void;
    onLocalLogin: (user: User) => void;
    users: User[];
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            if (data.user) {
                onLoginSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Login gagal. Cek email dan password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col items-center justify-center p-4 font-sans selection:bg-slate-200 dark:selection:bg-slate-800 transition-colors duration-250">
            <div className="w-full max-w-sm mx-auto">
                <div className="mb-8 text-center">
                    <img src="https://wqgbkwujfxdwlywxrjup.supabase.co/storage/v1/object/public/publik/Nala%20Sentral.png" alt="Nala Sentral Logo" className="h-24 w-auto mx-auto mb-4 animate-fade-in" />
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-display">Toko Nala Sentral</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-wider">Aplikasi POS & Laporan Keuangan</p>
                </div>
                
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 shadow-xl shadow-slate-100/30 dark:shadow-none rounded-[2rem] p-7 mb-6 transition-colors duration-250">
                    <h1 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-6 text-center font-display uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-3">Masuk Sesi Kerja</h1>
                    
                    <div className="mb-4">
                        <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2" htmlFor="email">
                            Alamat Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="nama@tokonala.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl w-full py-3 px-4 text-slate-800 dark:text-slate-200 leading-tight focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-slate-400 dark:focus:border-slate-700 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-900 transition-all text-sm font-semibold"
                            required
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2" htmlFor="password">
                            Kata Sandi (Password)
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl w-full py-3 px-4 text-slate-800 dark:text-slate-200 leading-tight focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-slate-400 dark:focus:border-slate-700 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-900 transition-all text-sm font-semibold"
                            required
                        />
                         {error && (
                            <div className="bg-red-50/70 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs rounded-xl p-3.5 mt-4 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5"></span>
                                <span className="font-semibold leading-relaxed">{error}</span>
                            </div>
                         )}
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-extrabold py-3.5 px-4 rounded-xl focus:outline-none transition-all duration-200 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed shadow-md shadow-slate-900/10 active:scale-[0.98] text-xs uppercase tracking-wider cursor-pointer"
                    >
                        {loading ? 'Memproses Masuk...' : 'Masuk Utama'}
                    </button>
                </form>
                
                <p className="text-center text-slate-400 dark:text-slate-650 text-[8px] tracking-widest uppercase font-bold">
                    &copy; {new Date().getFullYear()} Toko Nala Sentral. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default LoginView;
