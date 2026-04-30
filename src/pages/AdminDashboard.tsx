import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { ChefHat, CheckCircle2, Clock } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  items: any[];
  totalAmount: number;
  userId: string;
  createdAt: any;
}

const statusMap = {
  'pending': { label: '待確認', color: 'bg-amber-100 text-amber-800' },
  'preparing': { label: '製作中', color: 'bg-blue-100 text-blue-800' },
  'completed': { label: '已完成', color: 'bg-green-100 text-green-800' },
  'cancelled': { label: '已取消', color: 'bg-red-100 text-red-800' },
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: Admin reads all orders
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        
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
  }, []);

  const updateStatus = async (orderId: string, status: string, currentStatus: string) => {
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
        toast.error('無法更改已結案的訂單狀態');
        return;
    }

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: serverTimestamp()
      });
      toast.success('狀態已更新');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      toast.error('狀態更新失敗');
    }
  };

  const seedDatabase = async () => {
    const initialItems = [
      { name: '八曜和風', price: 55, milkTeaPrice: 65, category: '鮮乳定製', isAvailable: true, badges: ['穀', '無咖啡因'] },
      { name: '牧場覺醒', price: 55, milkTeaPrice: 65, category: '鮮乳定製', isAvailable: true, badges: ['紅'] },
      { name: '牧場黑烏龍', price: 60, milkTeaPrice: 70, category: '鮮乳定製', isAvailable: true },
      { name: '牧場307', price: 65, milkTeaPrice: 75, category: '鮮乳定製', isAvailable: true, badges: ['烏'] },
      { name: '牧場308', price: 65, milkTeaPrice: 75, category: '鮮乳定製', isAvailable: true, badges: ['蕎', '無咖啡因'] },
      { name: '贅澤香焙歐蕾', price: 66, milkTeaPrice: 76, category: '鮮乳定製', isAvailable: true, badges: ['紅'] },
      { name: '茉妃牧場505', price: 65, milkTeaPrice: 75, category: '鮮乳定製', isAvailable: true, badges: ['綠'] },
    ];

    try {
      const snap = await getDocs(collection(db, 'menuItems'));
      if (!snap.empty) {
        toast.error('菜單已有資料，不執行初始化');
        return;
      }

      const batch = writeBatch(db);
      initialItems.forEach(item => {
        const docRef = doc(collection(db, 'menuItems'));
        batch.set(docRef, item);
      });

      await batch.commit();
      toast.success('菜單初始化成功！');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'menuItems');
      toast.error('初始化失敗');
    }
  };

  if (loading) return <div>載入中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">後台管理</h1>
          <p className="text-stone-500">訂單即時看板</p>
        </div>
        <button 
          onClick={seedDatabase}
          className="bg-stone-200 text-stone-700 px-4 py-2 rounded-lg font-medium hover:bg-stone-300"
        >
          初始化菜單資料
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Orders */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
          <div className="flex items-center gap-2 mb-4 text-amber-700">
            <Clock className="w-5 h-5" />
            <h2 className="font-bold text-lg">待確認 ({orders.filter(o => o.status === 'pending').length})</h2>
          </div>
          <div className="space-y-4">
            {orders.filter(o => o.status === 'pending').map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
            ))}
          </div>
        </div>

        {/* Preparing Orders */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
          <div className="flex items-center gap-2 mb-4 text-blue-700">
            <ChefHat className="w-5 h-5" />
            <h2 className="font-bold text-lg">製作中 ({orders.filter(o => o.status === 'preparing').length})</h2>
          </div>
          <div className="space-y-4">
            {orders.filter(o => o.status === 'preparing').map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
            ))}
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
          <div className="flex items-center gap-2 mb-4 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <h2 className="font-bold text-lg">已出餐 ({orders.filter(o => o.status === 'completed').length})</h2>
          </div>
          <div className="space-y-4">
            {orders.filter(o => o.status === 'completed').slice(0, 10).map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const OrderCard: React.FC<{ order: Order, onUpdateStatus: (id: string, status: string, current: string) => Promise<void> | void }> = ({ order, onUpdateStatus }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-mono text-stone-400">#{order.id.slice(0,6)}</span>
        <span className="font-bold text-amber-900">${order.totalAmount}</span>
      </div>
      
      <div className="space-y-1 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="text-sm flex justify-between">
            <span className="text-stone-800">{item.name}</span>
            <span className="text-stone-500 font-medium">x{item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {order.status === 'pending' && (
          <>
            <button
              onClick={() => onUpdateStatus(order.id, 'preparing', order.status)}
              className="flex-1 bg-amber-800 text-white text-sm font-bold py-2 rounded-lg hover:bg-amber-900"
            >
              接單製作
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'cancelled', order.status)}
              className="bg-stone-100 text-stone-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-stone-200"
            >
              取消
            </button>
          </>
        )}
        
        {order.status === 'preparing' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'completed', order.status)}
            className="flex-1 bg-blue-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-blue-700"
          >
            完成出餐
          </button>
        )}
        
        {order.status === 'completed' && (
           <span className="text-sm font-medium text-green-600 w-full text-center block py-1 bg-green-50 rounded-lg">✅ 訂單已完成</span>
        )}
         {order.status === 'cancelled' && (
           <span className="text-sm font-medium text-red-600 w-full text-center block py-1 bg-red-50 rounded-lg">❌ 訂單已取消</span>
        )}
      </div>
    </div>
  );
}
