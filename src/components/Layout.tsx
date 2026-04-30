import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, LogOut, LogIn, Coffee, Shield } from 'lucide-react';
import { useAppStore } from '../store';
import { signInWithGoogle, logOut } from '../firebase';
import CartPanel from './CartPanel';
import toast from 'react-hot-toast';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, cart } = useAppStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans">
      <header className="sticky top-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-amber-900">
            <Coffee className="w-6 h-6" />
            <span>TEA BAR</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin" className="hidden sm:flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-900">
                <Shield className="w-4 h-4" />
                <span>後台管理</span>
              </Link>
            )}
            
            {user && (
              <Link to="/orders" className="text-sm font-medium text-stone-600 hover:text-stone-900">
                我的訂單
              </Link>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-stone-600 hover:text-stone-900"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>

            {user ? (
              <button
                onClick={logOut}
                className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full hover:bg-stone-100 transition-colors"
              >
                <img src={user.photoURL || ''} alt="avatar" className="w-6 h-6 rounded-full" />
                <span className="hidden sm:inline">{user.displayName}</span>
              </button>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                  } catch (error: any) {
                    if (error.code !== 'auth/popup-closed-by-user') {
                      toast.error('登入失敗，請稍後再試');
                    }
                  }
                }}
                className="flex items-center gap-2 text-sm font-medium bg-amber-800 text-white px-4 py-2 rounded-full hover:bg-amber-900 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>登入</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>

      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
