import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Plus, Coffee } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAppStore } from '../store';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  badges?: string[];
}

export default function Home() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useAppStore(state => state.addToCart);

  useEffect(() => {
    const q = query(collection(db, 'menuItems'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MenuItem[];
        
        // Custom sort order matching the image
        const orderMap: Record<string, number> = {
          '八曜和風': 1,
          '牧場覺醒': 2,
          '牧場黑烏龍': 3,
          '牧場307': 4,
          '牧場308': 5,
          '贅澤香焙歐蕾': 6,
          '茉妃牧場505': 7
        };
        
        items.sort((a, b) => {
          const aOrder = orderMap[a.name] || 99;
          const bOrder = orderMap[b.name] || 99;
          return aOrder - bOrder;
        });

        setMenuItems(items);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'menuItems');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAdd = (item: MenuItem) => {
    addToCart({
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1
    });
    toast.success(`已加入 ${item.name}`);
  };

  if (loading) {
    return <div className="animate-pulse flex flex-col gap-6 max-w-2xl mx-auto py-8">
      {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-stone-200/50 rounded-lg"></div>)}
    </div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 lg:py-12">
      <div className="bg-[#FFFBF5] relative p-8 md:p-14 lg:p-16 rounded-3xl shadow-sm border border-[#F2EAE1] overflow-hidden">
        
        {/* Top Header */}
        <div className="flex justify-between items-end mb-12 pb-6 border-b border-[#E8DFD5]/60 pr-8">
          <div className="flex items-baseline gap-4">
            <h2 className="text-3xl md:text-4xl font-serif tracking-[0.15em] text-[#933A36]">MILK TEA</h2>
            <span className="text-xl md:text-2xl font-serif text-[#933A36]">奶茶</span>
          </div>
          <span className="text-lg font-medium text-[#4A4A4A]">L</span>
        </div>
        
        {/* Menu Items */}
        <div className="flex flex-col gap-8 md:gap-10">
          {menuItems.filter(i => i.isAvailable).map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between group cursor-pointer relative"
              onClick={() => handleAdd(item)}
            >
              <div className="flex items-center gap-3">
                {/* Red Circular Signature Badge */}
                {item.badges?.includes('招牌') && (
                  <div className="absolute -left-6 md:-left-10 w-6 h-6 rounded-full bg-[#A23533] flex items-center justify-center">
                    <span className="text-white text-[11px] font-bold tracking-widest pl-[1px]">桐</span>
                  </div>
                )}
                
                <h3 className="text-[22px] md:text-2xl font-medium text-[#4A4A4A] group-hover:text-[#A23533] transition-colors flex items-center gap-3">
                  {item.name}
                  {item.badges?.includes('無咖啡因') && (
                    <span className="text-[#C19A6B] text-[13px] md:text-sm font-bold tracking-wider relative top-[2px]">
                      無咖啡因
                    </span>
                  )}
                </h3>
              </div>
              
              <div className="flex items-center gap-6 pr-8 relative">
                <p className="text-[22px] md:text-2xl text-[#4A4A4A] font-light">{item.price}</p>
                
                {/* Add to Cart Hover Icon */}
                <div className="absolute right-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-300 w-8 h-8 flex items-center justify-center rounded-full bg-[#A23533] text-white shadow-md">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {menuItems.length === 0 && (
          <div className="text-center py-16 text-stone-400 flex flex-col items-center gap-4">
            <Coffee className="w-12 h-12 text-stone-300" />
            <p>管理員尚未建立菜單，請前往後台「初始化菜單資料」</p>
          </div>
        )}
      </div>
    </div>
  );
}
