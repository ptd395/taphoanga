import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { PhoneIcon } from '@heroicons/react/24/outline';

const Squiggle = ({ color, style, rotate = 0 }) => (
  <svg viewBox="0 0 80 30" style={{ ...style, transform: `rotate(${rotate}deg)` }} className="absolute pointer-events-none">
    <path d="M5 15 Q20 0 35 15 Q50 30 65 15 Q72 8 75 15"
      stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
  </svg>
);

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ tendn: '', matkhau: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotData, setForgotData] = useState({ sdt: '', otp: '', otp_demo: '', matkhau_moi: '', xacnhan: '' });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetErrors, setResetErrors] = useState({});
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);

  const startCountdown = () => {
    setCountdown(60);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(countdownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!form.tendn || !form.matkhau) return toast.error('Vui lòng nhập đầy đủ thông tin');
    const result = await login(form.tendn, form.matkhau);
    if (result.success) {
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } else {
      setErrorMsg('Tên đăng nhập/Mật khẩu không chính xác');
    }
  };

  const handleForgotPhone = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { sdt: forgotData.sdt });
      setForgotData(d => ({ ...d, otp_demo: res.data.otp_demo, otp: '' }));
      setForgotStep(2);
      startCountdown();
      toast.success('Mã OTP đã được gửi' + (res.data.otp_demo ? ' (demo: ' + res.data.otp_demo + ')' : ''));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { sdt: forgotData.sdt });
      setForgotData(d => ({ ...d, otp_demo: res.data.otp_demo, otp: '' }));
      startCountdown();
      toast.success('Đã gửi lại OTP' + (res.data.otp_demo ? ' (demo: ' + res.data.otp_demo + ')' : ''));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await api.post('/auth/verify-otp', { sdt: forgotData.sdt, otp: forgotData.otp });
      setForgotStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xác thực OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetErrors({});
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        sdt: forgotData.sdt,
        matkhau_moi: forgotData.matkhau_moi,
        xacnhan: forgotData.xacnhan
      });
      toast.success(res.data.message);
      closeForgot();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      if (data?.field) setResetErrors({ [data.field]: msg });
      else setResetErrors({ general: msg });
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    clearInterval(countdownRef.current);
    setShowForgot(false);
    setForgotStep(1);
    setForgotData({ sdt: '', otp: '', otp_demo: '', matkhau_moi: '', xacnhan: '' });
    setCountdown(0);
    setResetErrors({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f0f4e8 0%, #fdf0f0 50%, #f0f4e8 100%)' }}>

      <Squiggle color="#d4f0a0" style={{ width: 90, top: '6%', left: '3%' }} rotate={-20} />
      <Squiggle color="#ffe066" style={{ width: 70, top: '14%', left: '6%' }} rotate={10} />
      <Squiggle color="#a8e6f0" style={{ width: 80, top: '4%', left: '22%' }} rotate={5} />
      <Squiggle color="#f0a8c8" style={{ width: 100, top: '3%', right: '8%' }} rotate={-15} />
      <Squiggle color="#f0c8d8" style={{ width: 80, top: '18%', right: '2%' }} rotate={30} />
      <Squiggle color="#a8d8f0" style={{ width: 110, bottom: '8%', left: '2%' }} rotate={-10} />
      <Squiggle color="#c8f0e8" style={{ width: 90, bottom: '4%', left: '18%' }} rotate={15} />
      <Squiggle color="#f0d0a8" style={{ width: 75, bottom: '12%', right: '5%' }} rotate={-25} />
      <Squiggle color="#d0c8f8" style={{ width: 85, bottom: '3%', right: '20%' }} rotate={20} />

      {/* Main card */}
      <div className="relative z-10 bg-white rounded-3xl shadow-xl flex overflow-hidden"
        style={{ width: 960, minHeight: 500 }}>
        <div className="flex items-center justify-center rounded-2xl m-5 overflow-hidden"
          style={{ background: '#f5c8c8', width: 400, minHeight: 440, flexShrink: 0 }}>
          <img src="/cart.png" alt="shopping cart"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="flex flex-col justify-center px-10 py-10 flex-1">
          <h1 className="mb-6" style={{
            fontFamily: "'Caveat', cursive", fontSize: 52,
            fontWeight: 700, color: '#1a1a1a', letterSpacing: 1
          }}>Welcome!</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Tên đăng nhập"
              value={form.tendn}
              onChange={e => setForm(f => ({ ...f, tendn: e.target.value }))}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-gray-700 placeholder-gray-400 focus:border-green-400 transition"
              style={{ fontSize: 15 }} />
            <input type="password" placeholder="Mật khẩu"
              value={form.matkhau}
              onChange={e => setForm(f => ({ ...f, matkhau: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-gray-700 placeholder-gray-400 focus:border-green-400 transition"
              style={{ fontSize: 15 }} />
            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setShowForgot(true)}
                className="text-sm text-red-500 hover:text-red-700">
                Quên mật khẩu ?
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#22c55e' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" />
                </svg>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet" />

      {/* Forgot modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeForgot}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {forgotStep === 1 ? 'Quên mật khẩu' : forgotStep === 2 ? 'Xác thực OTP' : 'Đặt mật khẩu mới'}
            </h3>

            {forgotStep === 1 && (
              <form onSubmit={handleForgotPhone} className="space-y-4">
                <p className="text-sm text-gray-500">Nhập số điện thoại đã đăng ký để nhận mã OTP.</p>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" className="input-field pl-9" placeholder="Nhập số điện thoại"
                    value={forgotData.sdt}
                    onChange={e => setForgotData(d => ({ ...d, sdt: e.target.value }))} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={closeForgot} className="btn-secondary flex-1 justify-center">Hủy</button>
                  <button type="submit" disabled={forgotLoading} className="btn-primary flex-1 justify-center">
                    {forgotLoading ? 'Đang gửi...' : 'Nhận OTP'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-sm text-gray-500">Mã OTP đã được gửi đến <strong>{forgotData.sdt}</strong></p>
                {forgotData.otp_demo && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    <strong>Demo OTP:</strong> {forgotData.otp_demo}
                  </div>
                )}
                <input type="text" className="input-field" placeholder="Nhập mã OTP 6 số"
                  value={forgotData.otp}
                  onChange={e => setForgotData(d => ({ ...d, otp: e.target.value }))}
                  maxLength={6} />
                <div className="flex items-center justify-between text-sm">
                  {countdown > 0
                    ? <span className="text-gray-400">Gửi lại sau <span className="font-semibold text-green-600">{countdown}s</span></span>
                    : <span className="text-gray-400">Không nhận được mã?</span>}
                  <button type="button" onClick={handleResendOtp}
                    disabled={countdown > 0 || forgotLoading}
                    className={`font-medium ${countdown > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-green-600 hover:text-green-700'}`}>
                    Gửi lại OTP
                  </button>
                </div>
                <div className="flex gap-3">
                  <button type="button"
                    onClick={() => { setForgotStep(1); clearInterval(countdownRef.current); setCountdown(0); }}
                    className="btn-secondary flex-1 justify-center">Quay lại</button>
                  <button type="submit" disabled={forgotLoading} className="btn-primary flex-1 justify-center">
                    {forgotLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-sm text-gray-500">Nhập mật khẩu mới cho tài khoản của bạn.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                  <input type="password" className="input-field" placeholder="Nhập mật khẩu mới"
                    value={forgotData.matkhau_moi}
                    onChange={e => { setForgotData(d => ({ ...d, matkhau_moi: e.target.value })); setResetErrors(p => ({ ...p, matkhau_moi: '' })); }} />
                  {resetErrors.matkhau_moi && <p className="text-red-500 text-xs mt-1">{resetErrors.matkhau_moi}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu</label>
                  <input type="password" className="input-field" placeholder="Nhập lại mật khẩu mới"
                    value={forgotData.xacnhan}
                    onChange={e => { setForgotData(d => ({ ...d, xacnhan: e.target.value })); setResetErrors(p => ({ ...p, xacnhan: '' })); }} />
                  {resetErrors.xacnhan && <p className="text-red-500 text-xs mt-1">{resetErrors.xacnhan}</p>}
                </div>
                {resetErrors.general && <p className="text-red-500 text-sm">{resetErrors.general}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForgotStep(2)}
                    className="btn-secondary flex-1 justify-center">Quay lại</button>
                  <button type="submit" disabled={forgotLoading} className="btn-primary flex-1 justify-center">
                    {forgotLoading ? 'Đang lưu...' : 'Xác nhận'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
