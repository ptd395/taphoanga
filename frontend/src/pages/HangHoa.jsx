import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, TrashIcon
} from '@heroicons/react/24/outline';

const fmtDate = (s) => s ? new Date(s).toLocaleString('vi-VN') : '';

const EMPTY_FORM = { TENSP: '', DVT: 'Cái', GIABAN: '', GIANHAP: '', SL_TON: '', DMUC_TON_MIN: '', TRANGTHAI_SP: 'Đang bán' };

function ProductModal({ mode, product, onClose, onSaved }) {
    const [form, setForm] = useState(mode === 'edit' ? { ...product } : { ...EMPTY_FORM });
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(mode === 'edit' && product.HINHANH ? product.HINHANH : null);
  
    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
      }
    };
  
    const f = (k) => ({
      value: form[k] ?? '',
      onChange: (e) => {
        let val = e.target.value;
        setForm((p) => {
          const next = { ...p, [k]: val };
          if (k === 'GIANHAP') {
            const cost = parseFloat(val) || 0;
            next.GIABAN = cost * 1.3;
          }
          return next;
        });
      },
    });
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!form.TENSP) return toast.error('Tên sản phẩm không được để trống');
      if (parseFloat(form.GIANHAP) <= 0) return toast.error('Giá vốn phải là số dương');
      if (parseInt(form.SL_TON) < 0) return toast.error('Tồn kho phải là số không âm');
      if (parseInt(form.DMUC_TON_MIN) < 0) return toast.error('Định mức tồn kho tối thiểu phải là số không âm');
  
      setLoading(true);
      try {
        const formData = new FormData();
        Object.keys(form).forEach(k => {
          if (k !== 'HINHANH') formData.append(k, form[k]);
        });
        if (imageFile) formData.append('hinhanh', imageFile);
  
        if (mode === 'edit') {
          await api.put(`/hanghoa/${product.MASP}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          toast.success('Cập nhật thành công');
        } else {
          await api.post('/hanghoa', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          toast.success('Hàng hóa đã được tạo thành công');
        }
        onSaved();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Thêm mới hàng hóa thất bại');
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-green-100">
            <h3 className="font-bold text-xl text-gray-800">{mode === 'edit' ? 'Cập nhật hàng hóa' : 'Tạo hàng hóa'}</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex flex-col md:flex-row gap-8 mb-6">
              {/* Cột trái: Thông tin */}
              <div className="flex-1 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Mã hàng</label>
                    <input className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded px-3 py-2 text-sm cursor-not-allowed focus:outline-none" 
                      value={mode === 'edit' ? form.MASP : 'Hệ thống tự động sinh'} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">DVT</label>
                    <input className="input-field border-gray-300 py-2" placeholder="Ví dụ: Cái, Hộp..." {...f('DVT')} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Tên hàng</label>
                  <input className="input-field border-gray-300 py-2" placeholder="Nhập tên sản phẩm" {...f('TENSP')} required />
                </div>
              </div>
  
              {/* Cột phải: Ảnh */}
              <div className="w-40 flex flex-col items-center justify-start shrink-0">
                <div className="w-40 h-40 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center overflow-hidden mb-3 relative">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" />
                    </svg>
                  )}
                </div>
                <label className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors flex items-center gap-1">
                  <PlusIcon className="w-4 h-4" /> Thêm ảnh
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>
  
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Giá bán</label>
                <input type="number" className="w-full border border-gray-200 bg-gray-50 text-gray-700 rounded px-3 py-2 text-sm cursor-not-allowed focus:outline-none" 
                  value={form.GIABAN} disabled placeholder="Tự động tính từ giá nhập (* 1.3)" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Giá nhập</label>
                <input type="number" className="input-field border-gray-300 py-2" placeholder="0" {...f('GIANHAP')} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Số lượng tồn</label>
                <input type="number" className="input-field border-gray-300 py-2" placeholder="0" {...f('SL_TON')} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Định mức tồn tối thiểu</label>
                <input type="number" className="input-field border-gray-300 py-2" placeholder="0" {...f('DMUC_TON_MIN')} />
              </div>
            </div>
  
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-5 py-2 rounded text-gray-700 font-medium border border-gray-300 hover:bg-gray-50 bg-white transition-colors">
                Bỏ qua
              </button>
              <button type="submit" disabled={loading} className="px-5 py-2 rounded text-white font-medium bg-green-500 hover:bg-green-600 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

function DeleteModal({ product, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/hanghoa/${product.MASP}`);
      toast.success(`${product.MASP} xóa thành công.`);
      onDeleted();
    } catch (err) {
      toast.error(err.response?.data?.message || `Xóa hàng hóa ${product.MASP} thất bại.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[480px] p-8 relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-1 text-black hover:text-gray-600 transition-colors">
          <XMarkIcon className="w-7 h-7" strokeWidth={2} />
        </button>
        
        <h3 className="font-bold text-2xl text-black mb-5">Xóa hàng hóa</h3>
        
        <p className="text-black text-lg leading-relaxed mb-10 w-11/12">
          {product.MASP} sẽ bị ngừng hoạt động. Bạn chắc chắn muốn xóa không?
        </p>
        
        <div className="flex justify-evenly">
          <button onClick={onClose} disabled={loading} className="px-10 py-2.5 rounded-[14px] text-blue-500 text-lg border border-blue-500 hover:bg-blue-50 transition-colors">
            Bỏ qua
          </button>
          <button onClick={handleDelete} disabled={loading} className="px-10 py-2.5 rounded-[14px] text-blue-500 text-lg border border-blue-500 hover:bg-blue-50 transition-colors">
            {loading ? 'Đang...' : 'Đồng ý'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HangHoa() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState({ 'Đang bán': true, 'Ngừng bán': false });
  const [filterTonkho, setFilterTonkho] = useState('');
  const [modal, setModal] = useState(null); // {type: 'create'|'edit'|'delete', product?}

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statuses = Object.entries(filterStatus).filter(([, v]) => v).map(([k]) => k).join(',');
      const res = await api.get('/hanghoa', {
        params: { page, limit: 15, search, trangthai: statuses, tonkho: filterTonkho }
      });
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (e) {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterTonkho]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const toggleStatus = (k) => { setFilterStatus(p => ({ ...p, [k]: !p[k] })); setPage(1); };

  return (
    <div className="space-y-4">
      {/* Header aligned as per mock */}
      <div className="flex items-center justify-between pb-2">
        <h1 className="text-2xl font-bold text-gray-800">Hàng hóa</h1>
        <div className="flex items-center gap-4 w-1/2 justify-end">
          <div className="relative w-full max-w-lg">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              className="w-full border border-gray-100 bg-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-200" 
              placeholder="Tìm kiếm theo mã, tên hàng"
              value={search} 
              onChange={handleSearch} 
            />
          </div>
          <button onClick={() => setModal({ type: 'create' })} className="border border-green-500 text-green-600 bg-white hover:bg-green-50 px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors whitespace-nowrap">
            <PlusIcon className="w-5 h-5" /> Tạo mới
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <div className="w-64 shrink-0">
          <div className="bg-white p-5 rounded-md min-h-[400px]">
            <p className="text-sm border-gray-300 font-semibold text-gray-800 mb-4 tracking-wide">Trạng thái hàng hóa</p>
            <div className="space-y-4 mb-8">
              {Object.keys(filterStatus).map(k => (
                <label key={k} className="flex items-center gap-3 text-sm cursor-pointer text-gray-700">
                  <input type="checkbox" checked={filterStatus[k]} onChange={() => toggleStatus(k)}
                    className="w-4 h-4 rounded border-gray-400 text-green-500 focus:ring-green-500 cursor-pointer" />
                  {k === 'Ngừng bán' ? 'Ngừng kinh doanh' : k}
                </label>
              ))}
            </div>
            
            <p className="text-sm border-gray-300 font-semibold text-gray-800 mb-4 tracking-wide">Tồn kho</p>
            <select className="input-field text-sm border-gray-200" value={filterTonkho} onChange={e => { setFilterTonkho(e.target.value); setPage(1); }}>
              <option value="">Chọn tồn kho</option>
              <option value="du">Đủ hàng</option>
              <option value="thap">Sắp hết</option>
              <option value="het">Hết hàng</option>
            </select>
          </div>
        </div>

        {/* Main content table */}
        <div className="flex-1">
          <div className="bg-white rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-green-100/50">
                    <th className="py-3 px-4 font-semibold text-gray-800">Mã sản phẩm</th>
                    <th className="py-3 px-4 font-semibold text-gray-800">Tên sản phẩm</th>
                    <th className="py-3 px-4 font-semibold text-gray-800 text-center">Giá bán</th>
                    <th className="py-3 px-4 font-semibold text-gray-800 text-center">Giá nhập</th>
                    <th className="py-3 px-4 font-semibold text-gray-800 text-center">Tồn kho</th>
                    <th className="py-3 px-4 font-semibold text-gray-800 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">Không có dữ liệu</td></tr>
                  ) : items.map((item, idx) => (
                    <tr key={item.MASP} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 text-gray-600">{item.MASP}</td>
                      <td className="py-3.5 px-4 text-gray-700">{item.TENSP}</td>
                      <td className="py-3.5 px-4 text-center text-gray-700">{item.GIABAN}</td>
                      <td className="py-3.5 px-4 text-center text-gray-700">{item.GIANHAP}</td>
                      <td className="py-3.5 px-4 text-center text-gray-700">{item.SL_TON}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button onClick={() => setModal({ type: 'delete', product: item })} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors" title="Xóa">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">Tổng: {total} sản phẩm</p>
                <div className="flex gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50">‹</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1 rounded border text-sm ${page === p ? 'bg-green-600 text-white border-green-600' : 'hover:bg-gray-50'}`}>{p}</button>
                  ))}
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50">›</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {modal?.type === 'create' && <ProductModal mode="create" onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.type === 'edit' && <ProductModal mode="edit" product={modal.product} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.type === 'delete' && <DeleteModal product={modal.product} onClose={() => setModal(null)} onDeleted={() => { setModal(null); load(); }} />}
    </div>
  );
}

