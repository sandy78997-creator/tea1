import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MenuItem, OrderItem } from '../types';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/AuthContext';
import { Plus, X } from 'lucide-react';

const INITIAL_MENU = [
  { name: '八曜和風', category: '鮮乳定製', priceTeaMilk: 55, priceMilkTea: 65, badges: ['穀', '無咖啡因'] },
  { name: '牧場覺醒', category: '鮮乳定製', priceTeaMilk: 55, priceMilkTea: 65, badges: ['紅'] },
  { name: '牧場黑烏龍', category: '鮮乳定製', priceTeaMilk: 60, priceMilkTea: 70, badges: [] },
  { name: '牧場307', category: '鮮乳定製', priceTeaMilk: 65, priceMilkTea: 75, badges: ['烏'] },
  { name: '牧場308', category: '鮮乳定製', priceTeaMilk: 65, priceMilkTea: 75, badges: ['蕎', '無咖啡因'] },
  { name: '贅澤香焙歐蕾', category: '鮮乳定製', priceTeaMilk: 66, priceMilkTea: 76, badges: ['紅'] },
  { name: '茉妃牧場505', category: '鮮乳定製', priceTeaMilk: 65, priceMilkTea: 75, badges: ['綠'] },
];

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { addItem } = useCart();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'menuItems'),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MenuItem));
        setMenuItems(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'menuItems');
      }
    );
    return () => unsub();
  }, []);

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">鮮乳定製</h1>
        <p className="text-neutral-500 text-sm">※ 乳糖不耐症請斟酌飲用</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedItem(item)}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                {item.badges.map((badge, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 rounded-full border border-neutral-300 text-neutral-600 bg-neutral-50">
                    {badge}
                  </span>
                ))}
              </div>
              <p className="text-sm text-neutral-500 line-clamp-1">{item.category}</p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-sm text-neutral-500">茶乳</p>
                <p className="font-medium">${item.priceTeaMilk}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">乳茶</p>
                <p className="font-medium">${item.priceMilkTea}</p>
              </div>
              <button className="bg-neutral-900 text-white p-2 rounded-lg hover:bg-neutral-800 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12 text-neutral-400">
          <p className="mb-4">尚未有菜單資料。<br/>管理員請登入至後台新增菜單。</p>
          {isAdmin && (
            <button
              onClick={async () => {
                setIsInitializing(true);
                try {
                  for (const item of INITIAL_MENU) {
                    const ref = doc(collection(db, 'menuItems'));
                    await setDoc(ref, {
                      ...item,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp()
                    });
                  }
                } catch (error) {
                  console.error(error);
                } finally {
                  setIsInitializing(false);
                }
              }}
              disabled={isInitializing}
              className="bg-neutral-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {isInitializing ? '初始化中...' : '載入圖片預設菜單'}
            </button>
          )}
        </div>
      )}

      {selectedItem && (
        <OrderModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
          onAdd={(orderItem) => {
            addItem(orderItem);
            setSelectedItem(null);
          }} 
        />
      )}
    </div>
  );
}

function OrderModal({ item, onClose, onAdd }: { item: MenuItem; onClose: () => void; onAdd: (item: OrderItem) => void }) {
  const [variant, setVariant] = useState<'茶乳' | '乳茶'>('茶乳');
  const [ice, setIce] = useState('正常冰');
  const [sugar, setSugar] = useState('正常糖');
  const [quantity, setQuantity] = useState(1);

  const price = variant === '茶乳' ? item.priceTeaMilk : item.priceMilkTea;

  return (
    <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-900">
          <X className="w-5 h-5" />
        </button>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-1">{item.name}</h2>
          <div className="flex gap-2 mb-6">
            {item.badges.map((badge, idx) => (
              <span key={idx} className="text-xs px-2 py-0.5 rounded-full border border-neutral-300 text-neutral-600 bg-neutral-50">
                {badge}
              </span>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <p className="font-medium mb-2">飲品比例</p>
              <div className="flex gap-2">
                {['茶乳', '乳茶'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariant(v as any)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${variant === v ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}
                  >
                    {v === '茶乳' ? 'お茶多め (茶乳)' : '牛乳多め (乳茶)'}
                    <div className="text-xs opacity-70 mt-1">${v === '茶乳' ? item.priceTeaMilk : item.priceMilkTea}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">冰塊</p>
              <div className="flex flex-wrap gap-2">
                {['正常冰', '少冰', '微冰', '去冰', '溫', '熱'].map((i) => (
                  <button
                    key={i}
                    onClick={() => setIce(i)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${ice === i ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">甜度</p>
              <div className="flex flex-wrap gap-2">
                {['正常糖', '少糖', '半糖', '微糖', '無糖'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSugar(s)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${sugar === s ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
               <span className="font-medium">數量</span>
               <div className="flex items-center gap-4">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50">-</button>
                  <span className="w-6 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50">+</button>
               </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => onAdd({
                menuItemId: item.id!,
                name: item.name,
                variant,
                price,
                quantity,
                ice,
                sugar
              })}
              className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors flex justify-between px-6"
            >
              <span>加入購物車</span>
              <span>${price * quantity}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
