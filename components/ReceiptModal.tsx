import React from 'react';
import { Transaction, Product } from '../types';
import { CloseIcon, PrintIcon } from './Icons';

interface ReceiptModalProps {
  transaction: Transaction | null;
  products: Product[];
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, products, onClose }) => {
  if (!transaction) return null;

  const getProductDetails = (productId: string) => {
    return products.find(p => p.id === productId) || { name: 'Unknown', size: '' };
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div id="receipt-print-area" className="p-6 font-mono text-xs text-black bg-white">
          <div className="text-center">
            <h2 className="text-lg font-bold">Nala Sentral</h2>
            <p>Pasar Leadeng - Gunungkusan</p>
            <p className="border-t border-b border-dashed border-gray-400 my-2 py-1">{transaction.transaction_code}</p>
          </div>
          <div className="my-2">
            <p>Kasir: {transaction.cashier_name}</p>
            <p>Tanggal: {new Date(transaction.date).toLocaleString('id-ID')}</p>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left font-normal">ITEM</th>
                <th className="text-right font-normal">TOTAL</th>
              </tr>
            </thead>
            <tbody className="border-t border-b border-dashed border-gray-400">
              {transaction.details.map(item => {
                const product = getProductDetails(item.product_id || '');
                const name = item.product_name || product.name;
                const size = item.product_size || product.size;
                return (
                  <tr key={item.id}>
                    <td className="py-1">
                      <div>{name} ({size})</div>
                      <div className="pl-2">{item.quantity} x {item.unit_price.toLocaleString('id-ID')}</div>
                    </td>
                    <td className="text-right align-bottom py-1">{item.subtotal.toLocaleString('id-ID')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-2">
            {transaction.discount_amount && transaction.discount_amount > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {(transaction.total + transaction.discount_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Diskon</span>
                  <span>-Rp {transaction.discount_amount.toLocaleString('id-ID')}</span>
                </div>
              </>
            )}
             <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>Rp {transaction.total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Metode</span>
              <span>{transaction.payment_method}</span>
            </div>
            {transaction.payment_method === 'Tunai' && (
              <>
                <div className="flex justify-between">
                  <span>Bayar</span>
                  <span>Rp {transaction.amount_received?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembali</span>
                  <span>Rp {transaction.change?.toLocaleString('id-ID')}</span>
                </div>
              </>
            )}
          </div>
          <div className="text-center mt-4 pt-2 border-t border-dashed border-gray-400">
            <p>Terima Kasih</p>
            <p>Jika anda puas beritahu teman</p>
            <p>Kalau  anda kecewa beritahu kami.</p>
            <p>Kritik & Saran 0822-2665-1635</p>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors flex items-center space-x-2">
            <CloseIcon className="w-5 h-5" />
            <span>Tutup</span>
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-[#2F4B8B] text-white rounded-md hover:bg-blue-800 transition-colors flex items-center space-x-2">
            <PrintIcon className="w-5 h-5" />
            <span>Cetak</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;