import React from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Pencil, 
  X, 
  Printer, 
  Download, 
  Upload, 
  Coffee, 
  Package, 
  BarChart3, 
  RotateCcw, 
  Settings, 
  LogOut, 
  Menu, 
  Archive, 
  QrCode, 
  Calculator, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingCart, 
  Search 
} from 'lucide-react';

interface IconProps {
  className?: string;
}

export const PlusIcon: React.FC<IconProps> = ({ className }) => (
  <Plus className={className || "w-6 h-6"} strokeWidth={2} />
);

export const MinusIcon: React.FC<IconProps> = ({ className }) => (
  <Minus className={className || "w-6 h-6"} strokeWidth={2} />
);

export const TrashIcon: React.FC<IconProps> = ({ className }) => (
  <Trash2 className={className || "w-6 h-6"} strokeWidth={2} />
);

export const EditIcon: React.FC<IconProps> = ({ className }) => (
  <Pencil className={className || "w-6 h-6"} strokeWidth={2} />
);

export const CloseIcon: React.FC<IconProps> = ({ className }) => (
  <X className={className || "w-6 h-6"} strokeWidth={2} />
);

export const PrintIcon: React.FC<IconProps> = ({ className }) => (
  <Printer className={className || "w-6 h-6"} strokeWidth={2} />
);

export const DownloadIcon: React.FC<IconProps> = ({ className }) => (
  <Download className={className || "w-6 h-6"} strokeWidth={2} />
);

export const UploadIcon: React.FC<IconProps> = ({ className }) => (
  <Upload className={className || "w-6 h-6"} strokeWidth={2} />
);

export const TeaIcon: React.FC<IconProps> = ({ className }) => (
  <Coffee className={className || "w-6 h-6"} strokeWidth={2} />
);

export const PackageIcon: React.FC<IconProps> = ({ className }) => (
  <Package className={className || "w-6 h-6"} strokeWidth={2} />
);

export const ChartBarIcon: React.FC<IconProps> = ({ className }) => (
  <BarChart3 className={className || "w-6 h-6"} strokeWidth={2} />
);

export const ReceiptRefundIcon: React.FC<IconProps> = ({ className }) => (
  <RotateCcw className={className || "w-6 h-6"} strokeWidth={2} />
);

export const CogIcon: React.FC<IconProps> = ({ className }) => (
  <Settings className={className || "w-6 h-6"} strokeWidth={2} />
);

export const LogoutIcon: React.FC<IconProps> = ({ className }) => (
  <LogOut className={className || "w-6 h-6"} strokeWidth={2} />
);

export const MenuIcon: React.FC<IconProps> = ({ className }) => (
  <Menu className={className || "w-6 h-6"} strokeWidth={2} />
);

export const ArchiveBoxIcon: React.FC<IconProps> = ({ className }) => (
  <Archive className={className || "w-6 h-6"} strokeWidth={2} />
);

export const BarcodeIcon: React.FC<IconProps> = ({ className }) => (
  <QrCode className={className || "w-6 h-6"} strokeWidth={2} />
);

export const CalculatorIcon: React.FC<IconProps> = ({ className }) => (
  <Calculator className={className || "w-6 h-6"} strokeWidth={2} />
);

export const RefreshIcon: React.FC<IconProps> = ({ className }) => (
  <RefreshCw className={className || "w-6 h-6"} strokeWidth={2} />
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className }) => (
  <ChevronLeft className={className || "w-6 h-6"} strokeWidth={2} />
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className }) => (
  <ChevronRight className={className || "w-6 h-6"} strokeWidth={2} />
);

export const ShoppingCartIcon: React.FC<IconProps> = ({ className }) => (
  <ShoppingCart className={className || "w-6 h-6"} strokeWidth={2} />
);

export const SearchIcon: React.FC<IconProps> = ({ className }) => (
  <Search className={className || "w-6 h-6"} strokeWidth={2} />
);
