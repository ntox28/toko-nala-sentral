import React from 'react';
import { User } from '../types';
import { LogOut } from 'lucide-react';

interface FooterProps {
    currentUser: User;
    onLogout: () => void;
}

const Footer: React.FC<FooterProps> = ({ currentUser, onLogout }) => {
  return (
    <footer className="bg-white border-t border-slate-100 text-slate-400 flex justify-between items-center p-4 text-xs font-sans">
      <p className="text-slate-400">
        &copy; {new Date().getFullYear()} Toko Nala Snack. All Rights Reserved.
      </p>
      <div className="flex items-center space-x-3">
        <span className="font-medium text-slate-600">Terhubung: {currentUser.name} ({currentUser.role})</span>
        <button 
          onClick={onLogout} 
          title="Logout" 
          className="p-1 px-2.5 rounded-lg border border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-slate-500 transition-all flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>
    </footer>
  );
};

export default Footer;