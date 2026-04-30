/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Toaster } from 'react-hot-toast';
import { auth, db } from './firebase';
import { useAppStore } from './store';

import Layout from './components/Layout';
import Home from './pages/Home';
import UserOrders from './pages/UserOrders';
import AdminDashboard from './pages/AdminDashboard';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin } = useAppStore();
  if (!user) return <Navigate to="/" />;
  if (!isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
};

export default function App() {
  const setUser = useAppStore((state) => state.setUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if admin
        let isAdmin = false;
        if (user.email === 'sandy78997@gmail.com') {
          isAdmin = true;
        } else {
          try {
            const roleDoc = await getDoc(doc(db, 'userRoles', user.uid));
            if (roleDoc.exists() && roleDoc.data()?.role === 'admin') {
              isAdmin = true;
            }
          } catch (e) {
            // Error fetching role, default to false
          }
        }
        setUser(user, isAdmin);
      } else {
        setUser(null, false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50">載入中...</div>;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/orders" element={<UserOrders />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </Layout>
      <Toaster position="top-center" />
    </Router>
  );
}
