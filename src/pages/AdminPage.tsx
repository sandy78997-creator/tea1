import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, MenuItem } from '../types';
import { useAuth } from '../lib/AuthContext';
import { format } from 'date-fns';
import { Settings, ListOrdered, Coffee } from 'lucide-react';

const STATUS_MAP = {
  pending: { label: '待處理', color: 'bg-amber-100 text-amber-800' },
  preparing: { label: '製作中', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
};

export default function AdminPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <div className="text-center py-20 text-red-500 font-medium">您沒有權限訪問此頁面</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4 sticky top-24">
          <h2 className="font-bold text-lg mb-4 px-2 flex items-center gap-2">
            <Settings className="w-5 h-5" /> 後台管理
          </h2>
          <nav className="flex flex-col gap-1">
            <Link to="/admin" className="px-4 py-2 rounded-lg hover:bg-neutral-50 flex items-center gap-2 text-neutral-700">
              <ListOrdered className="w-4 h-4" /> 訂單管理
            </Link>
            <Link to="/admin/menu" className="px-4 py-2 rounded-lg hover:bg-neutral-50 flex items-center gap-2 text-neutral-700">
              <Coffee className="w-4 h-4" /> 菜單管理
            </Link>
          </nav>
        </div>
      </div>
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<AdminOrders />} />
          <Route path="/menu" element={<AdminMenu />} />
        </Routes>
      </div>
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
    );
    return () => unsub();
  }, []);

  const updateStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status, 
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">訂單管理</h2>
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-100 text-neutral-500">
            <tr>
              <th className="p-4 font-medium">訂單編號 / 時間</th>
              <th className="p-4 font-medium">顧客</th>
              <th className="p-4 font-medium">內容</th>
              <th className="p-4 font-medium">狀態</th>
              <th className="p-4 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-neutral-50/50">
                <td className="p-4 align-top">
                  <div className="font-mono text-xs text-neutral-500 mb-1">{order.id}</div>
                  <div>{order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MM/dd HH:mm') : ''}</div>
                </td>
                <td className="p-4 align-top font-medium">{order.customerName}</td>
                <td className="p-4 align-top">
                  <ul className="space-y-1">
                    {order.items.map((item, i) => (
                      <li key={i} className="text-xs">
                        {item.name} ({item.variant}) x{item.quantity}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 font-medium">${order.totalPrice}</div>
                </td>
                <td className="p-4 align-top">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id!, e.target.value as Order['status'])}
                    className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer ${STATUS_MAP[order.status].color}`}
                  >
                    <option value="pending">待處理</option>
                    <option value="preparing">製作中</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </td>
                <td className="p-4 align-top text-right">
                  {/* Actions logic if needed */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'menuItems'),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MenuItem));
        setMenuItems(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'menuItems')
    );
    return () => unsub();
  }, []);

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const { id, ...itemData } = editingItem;
      if (id) {
        // Only update data, omitting ID
        await updateDoc(doc(db, 'menuItems', id), {
          name: itemData.name,
          category: itemData.category,
          priceTeaMilk: itemData.priceTeaMilk,
          priceMilkTea: itemData.priceMilkTea,
          badges: itemData.badges,
          updatedAt: serverTimestamp(),
        });
      } else {
        const ref = doc(collection(db, 'menuItems'));
        await setDoc(ref, {
          ...itemData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setEditingItem(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'menuItems');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('確定要刪除此品項嗎？')) return;
    try {
      await deleteDoc(doc(db, 'menuItems', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `menuItems/${id}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">菜單管理</h2>
        <button
          onClick={() => setEditingItem({ name: '', category: '鮮乳定製', priceTeaMilk: 55, priceMilkTea: 65, badges: [] })}
          className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          新增品項
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {menuItems.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-xl border border-neutral-200">
            <h3 className="font-bold">{item.name}</h3>
            <p className="text-sm text-neutral-500 mb-2">{item.category}</p>
            <div className="flex gap-4 text-sm mb-4">
              <span>茶乳: ${item.priceTeaMilk}</span>
              <span>乳茶: ${item.priceMilkTea}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setEditingItem(item)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                編輯
              </button>
              <button 
                onClick={() => deleteItem(item.id!)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={saveItem} className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editingItem.id ? '編輯品項' : '新增品項'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名稱</label>
                <input required type="text" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full border border-neutral-300 rounded-lg p-2" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">分類</label>
                <input required type="text" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full border border-neutral-300 rounded-lg p-2" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">茶乳價格</label>
                  <input required type="number" min="0" value={editingItem.priceTeaMilk} onChange={e => setEditingItem({...editingItem, priceTeaMilk: parseInt(e.target.value)})} className="w-full border border-neutral-300 rounded-lg p-2" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">乳茶價格</label>
                  <input required type="number" min="0" value={editingItem.priceMilkTea} onChange={e => setEditingItem({...editingItem, priceMilkTea: parseInt(e.target.value)})} className="w-full border border-neutral-300 rounded-lg p-2" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">標籤 (逗號分隔)</label>
                <input type="text" value={editingItem.badges.join(',')} onChange={e => setEditingItem({...editingItem, badges: e.target.value.split(',').map(b=>b.trim()).filter(Boolean)})} className="w-full border border-neutral-300 rounded-lg p-2" placeholder="穀,紅,無咖啡因" />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg">取消</button>
              <button type="submit" className="px-4 py-2 bg-neutral-900 text-white rounded-lg">儲存</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
