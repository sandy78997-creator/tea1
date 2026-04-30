import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Clock, CheckCircle2, XCircle, ChefHat } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAppStore } from '../store';
import { Navigate } from 'react-router-dom';

interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  createdAt: any;
}

const statusMap = {
  'pending': { label: '待確認', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  'preparing': { label: '製作中', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: ChefHat },
  'completed': { label: '已完成', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2 },
  'cancelled': { label: '已取消', color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
};

export default function UserOrders() {
  const { user } = useAppStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Notice we don't orderBy timestamp because we don't have an index yet.
    // It's safer to query by userId and sort in memory if needed.
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        
        // Sort descending by createdAt
        fetchedOrders.sort((a, b) => {
          const tA = a.createdAt?.toMillis?.() || 0;
          const tB = b.createdAt?.toMillis?.() || 0;
          return tB - tA;
        });
        
        setOrders(fetchedOrders);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (!user) return <Navigate to="/" />;

  if (loading) {
    return <div className="text-center py-12 text-stone-500">載入中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold tracking-tight text-stone-800 mb-6">我的訂單</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-stone-500">
          目前沒有任何訂單紀錄
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const StatusIcon = statusMap[order.status].icon;
            
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                <div className={`p-4 border-b flex items-center justify-between ${statusMap[order.status].color.split(' ')[1]}`}>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 ${statusMap[order.status].color.split(' ')[0]}`} />
                    <span className={`font-bold ${statusMap[order.status].color.split(' ')[0]}`}>
                      {statusMap[order.status].label}
                    </span>
                  </div>
                  <div className="text-sm text-stone-500 font-medium">
                    {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleString('zh-TW', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : ''}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-xs">
                            {item.quantity}
                          </span>
                          <span className="font-medium text-stone-800">{item.name}</span>
                        </div>
                        <span className="text-stone-500">${item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                    <span className="text-stone-500 font-medium text-sm">總計</span>
                    <span className="font-black text-xl text-amber-900">${order.totalAmount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
