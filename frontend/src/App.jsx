import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HangHoa from './pages/HangHoa';
import BanHang from './pages/BanHang';
import HoaDonBan from './pages/HoaDonBan';
import BaoCao from './pages/BaoCao';
import TaiKhoan from './pages/TaiKhoan';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      {/* Trang Bán hàng - Toàn màn hình (không có Layout) */}
      <Route path="/ban-hang" element={<ProtectedRoute><BanHang /></ProtectedRoute>} />
      
      {/* Các trang khác - Có Layout */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="hang-hoa" element={<HangHoa />} />
        <Route path="hoa-don" element={<HoaDonBan />} />
        <Route path="bao-cao" element={<BaoCao />} />
        <Route path="tai-khoan" element={<TaiKhoan />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
