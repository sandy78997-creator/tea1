import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useAppStore } from '../store';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function CartPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart, user } = useAppStore();

  const handleCheckout = async () => {
    if (!user) {
      toast.error('請先登入');
      return;
    }

    if (cart.length === 0) return;

    try {
      const orderData = {
        userId: user.uid,
        status: 'pending',
        items: cart,
        totalAmount: cartTotal(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      onClose();
      toast.success('訂單建立成功！');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      toast.error('訂單建立失敗');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose} 
      />
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <h2 className="text-xl font-bold tracking-tight text-amber-900">購物車</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-400">
              <span className="text-lg font-medium">購物車是空的</span>
              <span className="text-sm">快去挑選喜歡的飲品吧！</span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.itemId} className="flex gap-4 p-3 border border-stone-100 rounded-xl bg-stone-50/50">
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-800">{item.name}</h3>
                  <div className="text-amber-800 font-medium">${item.price}</div>
                </div>
                
                <div className="flex flex-col items-end justify-between">
                  <button 
                    onClick={() => removeFromCart(item.itemId)}
                    className="text-stone-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-lg p-1">
                    <button 
                      onClick={() => updateQuantity(item.itemId, -1)}
                      className="text-stone-500 hover:text-stone-800"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.itemId, 1)}
                      className="text-stone-500 hover:text-stone-800"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-stone-100 bg-stone-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-stone-600 font-medium">總計</span>
              <span className="text-2xl font-bold text-amber-900">${cartTotal()}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-amber-800 text-white font-bold py-3 rounded-xl hover:bg-amber-900 active:scale-[0.98] transition-all"
            >
              結帳送出
            </button>
          </div>
        )}
      </div>
    </>
  );
}
