import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/AuthContext';
import { Trash2, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      alert('請先登入再進行結帳');
      return;
    }
    
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const orderRef = doc(collection(db, 'orders'));
      await setDoc(orderRef, {
        userId: user.uid,
        customerName: user.displayName || 'Unknown',
        status: 'pending',
        totalPrice: total,
        items: items,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      clearCart();
      navigate('/orders');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">購物車是空的</h2>
        <Link to="/" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="w-4 h-4" /> 返回菜單
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">購物車</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 mb-8">
        <ul className="space-y-6">
          {items.map((item, index) => (
            <li key={index} className="flex justify-between items-start pb-6 border-b border-neutral-100 last:border-0 last:pb-0">
              <div>
                <h3 className="font-semibold text-lg">{item.name} <span className="text-sm font-normal text-neutral-500">x{item.quantity}</span></h3>
                <p className="text-sm text-neutral-500 mt-1">{item.variant} • {item.ice} • {item.sugar}</p>
                <div className="mt-2 text-sm font-medium text-neutral-700">${item.price} /杯</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-semibold text-lg">${item.price * item.quantity}</span>
                <button 
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <span className="font-semibold text-lg">總計</span>
          <span className="font-bold text-2xl">${total}</span>
        </div>
        
        {!user && (
           <div className="mb-4 p-4 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200">
              請先登入才能進行結帳。
           </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={submitting || !user}
          className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '送出訂單中...' : '確認結帳'}
        </button>
      </div>
    </div>
  );
}
