import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useCart } from '../lib/CartContext';
import { signInWithGoogle, signOut } from '../lib/firebase';
import { Coffee, ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const { items } = useCart();
  
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <Coffee className="w-6 h-6 text-neutral-800" />
          <span>八曜茶飲</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium hover:text-neutral-600 transition-colors">
            菜單
          </Link>
          <Link to="/cart" className="text-sm font-medium hover:text-neutral-600 transition-colors flex items-center gap-1">
            <ShoppingCart className="w-4 h-4" /> 購物車 {cartItemCount > 0 && <span className="bg-neutral-900 text-white text-[10px] px-1.5 py-0.5 rounded-full">{cartItemCount}</span>}
          </Link>
          {user && (
            <Link to="/orders" className="text-sm font-medium hover:text-neutral-600 transition-colors">
              我的訂單
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1">
              <LayoutDashboard className="w-4 h-4" /> 後台
            </Link>
          )}
          
          <div className="h-6 w-px bg-neutral-200 mx-2"></div>
          
          {user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <img src={user.photoURL || ''} alt="avatar" className="w-6 h-6 rounded-full" />
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors"
            >
              <User className="w-4 h-4" />
              登入
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
