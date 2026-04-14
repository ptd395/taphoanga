import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function TaiKhoan() {
  const { updateUser } = useAuth();
  const [tab, setTab] = useState('info');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ tenht: '', sdt: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ matkhau_cu: '', matkhau_moi: '', xacnhan: '' });
  const [showPw, setShowPw] = useState({ cu: false, moi: false, xn: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  useEffect(() => {
    api.get('/taikhoan/me')
      .then(r => { setProfile(r.data); setEditForm({ tenht: r.data.TENHT || '', sdt: r.data.SDT || '' }); })
      .catch(() => toast.error('Lỗi tải thông tin'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await api.put('/taikhoan/me', editForm);
      setProfile(res.data);
      updateUser({ tenht: res.data.TENHT, sdt: res.data.SDT });
      toast.success('Cập nhật thông tin thành công');
      setShowEdit(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    setPwErrors({});
    setPwLoading(true);
    try {
      const res = await api.put('/taikhoan/me/password', pwForm);
      toast.success(res.data.message);
      setPwForm({ matkhau_cu: '', matkhau_moi: '', xacnhan: '' });
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || 'Có lỗi xảy ra, không thể đổi mật khẩu. Vui lòng thử lại.';
      if (data?.field) setPwErrors({ [data.field]: msg });
      else setPwErrors({ general: msg });
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>
  );

  return (
    <div className="flex gap-6" style={{ minHeight: 'calc(100vh - 120px)' }}>

      {/* Sidebar trái */}
      <div className="shrink-0 pt-1" style={{ width: 220 }}>
        <h1 className="text-2xl font-bold text-green-600 mb-5">Tài khoản</h1>
        <button onClick={() => setTab('info')}
          className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium mb-2 border transition
            ${tab === 'info' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          <UserCircleIcon className="w-4 h-4" />
          Thông tin tài khoản
        </button>
        <button onClick={() => setTab('password')}
          className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border transition
            ${tab === 'password' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Đổi mật khẩu
        </button>
      </div>

      {/* Vùng xanh phải - full */}
      <div className="flex-1 rounded-2xl" style={{ background: '#a5d6a7', padding: '32px 32px 32px 32px', position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {tab === 'info' && (
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {/* Avatar căn giữa */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10, marginBottom: -70 }}>
              <div style={{
                width: 150, height: 150, borderRadius: '50%',
                background: '#e8f5e9', border: '5px solid white',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <UserCircleIcon style={{ width: 120, height: 120, color: '#2e7d32' }} />
              </div>
            </div>

            {/* Card trắng */}
            <div style={{
              background: 'white', borderRadius: 20,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              padding: '32px 48px 36px 48px',
              maxWidth: 560, margin: '0 auto', width: '100%'
            }}>
              <p style={{ color: '#16a34a', fontWeight: 700, fontSize: 20, marginBottom: 20, marginTop: 48 }}>Thông tin chi tiết</p>

              <div style={{ display: 'grid', gridTemplateColumns: '160px 220px', gap: '16px 0', margin: '0 auto' }}> 
                {[
                  { label: 'Tên đăng nhập:', value: profile?.TENDN },
                  { label: 'Tên hiển thị:', value: profile?.TENHT || '—' },
                  { label: 'Số điện thoại:', value: profile?.SDT || '—' },
                ].map(({ label, value }) => (
                  <>
                    <span key={label + 'l'} style={{ fontWeight: 500, color: '#374151', fontSize: 14, display: 'flex', alignItems: 'center' }}>{label}</span>
                    <span key={label + 'v'} style={{ background: '#f3f4f6', borderRadius: 8, padding: '9px 16px', fontWeight: 600, color: '#1f2937', fontSize: 14 }}>{value}</span>
                  </>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
                <button onClick={() => setShowEdit(true)} style={{
                  background: '#22c55e', color: 'white', fontWeight: 700,
                  fontSize: 15, padding: '10px 72px', borderRadius: 10,
                  border: 'none', cursor: 'pointer'
                }}>
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'password' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24 }}>
            {/* Card trắng - chỉ chứa label + input */}
            <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '28px 40px 28px 40px', width: '100%', maxWidth: 580 }}>
              <p style={{ color: '#16a34a', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Đổi mật khẩu</p>
              <form id="pw-form" onSubmit={handleChangePw}>
                {[
                  { key: 'matkhau_cu', label: 'Mật khẩu cũ', showKey: 'cu', placeholder: 'Nhập mật khẩu' },
                  { key: 'matkhau_moi', label: 'Mật khẩu mới', showKey: 'moi', placeholder: 'Nhập mật khẩu' },
                  { key: 'xacnhan', label: 'Xác nhận', showKey: 'xn', placeholder: 'Nhập lại mật khẩu' },
                ].map(({ key, label, showKey, placeholder }) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: 160, fontWeight: 500, color: '#374151', flexShrink: 0, fontSize: 14 }}>{label}</span>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          type={showPw[showKey] ? 'text' : 'password'}
                          className="input-field pr-10"
                          placeholder={placeholder}
                          value={pwForm[key]}
                          onChange={e => { setPwForm(p => ({ ...p, [key]: e.target.value })); setPwErrors(p => ({ ...p, [key]: '' })); }}
                        />
                        <button type="button" onClick={() => setShowPw(p => ({ ...p, [showKey]: !p[showKey] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPw[showKey] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {pwErrors[key] && (
                      <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 160 }}>{pwErrors[key]}</p>
                    )}
                  </div>
                ))}
                {pwErrors.general && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{pwErrors.general}</p>}
              </form>
            </div>

            {/* Nút Lưu ngoài card, trong vùng xanh */}
            <button type="submit" form="pw-form" disabled={pwLoading} style={{
              marginTop: 28, background: '#22c55e', color: 'white',
              fontWeight: 700, fontSize: 16, padding: '12px 100px',
              borderRadius: 12, border: 'none', cursor: 'pointer',
              opacity: pwLoading ? 0.6 : 1
            }}>
              {pwLoading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        )}
      </div>

      {/* Modal chỉnh sửa */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end p-3 pb-0">
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="flex justify-center pb-2">
              <div className="w-28 h-28 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center">
                <UserCircleIcon className="w-20 h-20 text-green-600" />
              </div>
            </div>
            <form onSubmit={handleSaveProfile} className="px-8 pb-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                <div className="relative">
                  <input className="input-field bg-gray-100 text-gray-500 pr-10 cursor-not-allowed" value={profile?.TENDN} disabled />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2"/>
                    </svg>
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
                <input className="input-field" placeholder="Tên hiển thị"
                  value={editForm.tenht} onChange={e => setEditForm(p => ({ ...p, tenht: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input className="input-field" placeholder="Số điện thoại" type="tel"
                  value={editForm.sdt} onChange={e => setEditForm(p => ({ ...p, sdt: e.target.value }))} />
              </div>
              <button type="submit" disabled={editLoading}
                className="w-full py-3 rounded-xl text-white font-bold text-base transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#22c55e' }}>
                {editLoading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
