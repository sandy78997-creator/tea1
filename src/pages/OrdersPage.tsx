import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order } from '../types';
import { useAuth } from '../lib/AuthContext';
import { format } from 'date-fns';

const STATUS_MAP = {
  pending: { label: '待處理', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  preparing: { label: '製作中', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800 border-red-200' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );
    return () => unsub();
  }, [user]);

  if (!user) {
    return <div className="text-center py-20">請先登入以查看訂單</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">我的訂單</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          目前沒有訂單紀錄。
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
              <div className="flex justify-between items-center mb-4 border-b border-neutral-100 pb-4">
                <div>
                  <p className="text-sm font-mono text-neutral-500">#{order.id}</p>
                  <p className="text-sm text-neutral-500">
                    {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'yyyy/MM/dd HH:mm') : '處理中...'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_MAP[order.status]?.color}`}>
                  {STATUS_MAP[order.status]?.label}
                </div>
              </div>
              
              <ul className="space-y-3 mb-4">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm">
                    <span>{item.name} ({item.variant}, {item.ice}, {item.sugar}) x{item.quantity}</span>
                    <span className="font-medium">${item.price * item.quantity}</span>
                  </li>
                ))}
              </ul>
              
              <div className="text-right font-bold text-lg border-t border-neutral-100 pt-4">
                總計: ${order.totalPrice}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
