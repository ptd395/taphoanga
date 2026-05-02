import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, TrashIcon, PencilSquareIcon, PrinterIcon, 
  ArrowPathIcon, CheckIcon, ArchiveBoxArrowDownIcon
} from '@heroicons/react/24/outline';

const fmtDate = (s) => s ? new Date(String(s).replace(' ', 'T')).toLocaleString('vi-VN') : '';

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
        toast.error(err.response?.data?.message || 'Thao tác thất bại');
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-green-100">
            <h3 className="font-bold text-xl text-gray-800">{mode === 'edit' ? 'Chỉnh sửa hàng hóa' : 'Tạo hàng hóa'}</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8">
            <div className="flex gap-10 mb-8">
              {/* Cột trái: Form fields */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-2">Mã hàng</label>
                    <input className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-4 py-2 text-sm cursor-not-allowed focus:outline-none shadow-inner" 
                      value={mode === 'edit' ? form.MASP : 'Hệ thống tự động sinh'} disabled />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-2">DVT</label>
                    <input className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-green-100 outline-none" placeholder="Ví dụ: Cái, Hộp..." {...f('DVT')} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-base font-bold text-gray-800 mb-2">Tên hàng</label>
                  <input className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-green-100 outline-none" placeholder="Nhập tên sản phẩm" {...f('TENSP')} required />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-2">Giá bán</label>
                    <input type="number" className="w-full border border-gray-100 bg-gray-50 text-gray-700 rounded-lg px-4 py-2 text-sm cursor-not-allowed focus:outline-none" 
                      value={form.GIABAN} disabled placeholder="Tự động tính (* 1.3)" />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-2">Giá nhập</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-green-100 outline-none" placeholder="0" {...f('GIANHAP')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-2">Số lượng tồn</label>
                    {mode === 'edit' ? (
                      <input type="number" className="w-full border border-gray-100 bg-gray-50 text-gray-700 rounded-lg px-4 py-2 text-sm cursor-not-allowed focus:outline-none" 
                        value={form.SL_TON} disabled placeholder="0" />
                    ) : (
                      <input type="number" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-green-100 outline-none" 
                        placeholder="0" {...f('SL_TON')} />
                    )}
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-2">Định mức tồn tối thiểu</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-green-100 outline-none" placeholder="0" {...f('DMUC_TON_MIN')} />
                  </div>
                </div>
              </div>

              {/* Cột phải: Ảnh minh họa */}
              <div className="w-48 flex flex-col items-center">
                <div className="w-40 h-48 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center overflow-hidden mb-4 shadow-sm relative pt-4">
                  {preview ? (
                    <img src={preview} alt="Product" className="max-w-[90%] max-h-[90%] object-contain" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-300">
                       <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                      </svg>
                    </div>
                  )}
                </div>
                <label className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
                  <PencilSquareIcon className="w-4 h-4" /> Thay đổi ảnh
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>
  
            <div className="flex items-center justify-end gap-3 pt-6">
              <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-gray-700 font-bold border border-gray-300 hover:bg-gray-50 bg-white transition-colors">
                Bỏ qua
              </button>
              <button type="submit" disabled={loading} className="px-6 py-2 rounded-lg text-white font-bold bg-green-500 hover:bg-green-600 transition-colors flex items-center gap-2 shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

function BarcodeModal({ product, onClose }) {
  const [loading, setLoading] = useState(false);
  const handlePrint = () => {
    setLoading(true);
    setTimeout(() => {
      toast.error('Xảy ra lỗi. Không thể in hóa đơn');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl overflow-hidden flex h-[580px]" onClick={e => e.stopPropagation()}>
        {/* Left: Preview */}
        <div className="flex-1 bg-gray-400 flex items-center justify-center p-12">
          <div className="bg-white w-[350px] h-[180px] shadow-lg flex flex-col items-center justify-center p-6 text-center space-y-3">
            <p className="text-gray-800 font-semibold text-lg leading-tight">{product.TENSP}</p>
            <p className="text-gray-600 text-sm tracking-widest">{product.MASP}</p>
            {/* Mock barcode lines */}
            <div className="w-full flex justify-center h-10 gap-0.5">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="bg-black" style={{ width: i % 3 === 0 ? '1px' : i % 5 === 0 ? '3px' : '2px', height: '100%' }}></div>
              ))}
            </div>
            <p className="text-gray-900 font-bold text-xl">{product.GIABAN?.toLocaleString()} VND</p>
          </div>
        </div>

        {/* Right: Settings */}
        <div className="w-96 p-8 flex flex-col relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-6">In</h2>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Máy in</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-gray-50/50 outline-none" disabled>
                <option>Chọn máy in</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Khổ giấy</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-gray-50/50 outline-none" disabled>
                <option>Chọn khổ giấy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Số lượng in</label>
              <input type="number" defaultValue={1} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none" placeholder="Chọn số trang" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Màu</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-gray-50/50 outline-none" disabled>
                <option>Màu</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6">
            <button onClick={onClose} className="px-8 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button 
              onClick={handlePrint} 
              disabled={loading}
              className="px-10 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors shadow-md disabled:bg-gray-300"
            >
              {loading ? 'Đang...' : 'In'}
            </button>
          </div>
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
  const [filterStatus, setFilterStatus] = useState({ 'Đang bán': true, 'Ngừng kinh doanh': false });
  const [filterTonkho, setFilterTonkho] = useState('');
  const [modal, setModal] = useState(null); // {type: 'create'|'edit'|'delete', product?}
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'stock'
  const [stockHistory, setStockHistory] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);

  const loadStockHistory = async (masp) => {
    setLoadingStock(true);
    try {
      const res = await api.get(`/hanghoa/${masp}/tonkho`);
      setStockHistory(res.data);
    } catch (e) {
      toast.error('Không thể tải chi tiết tồn kho');
    } finally {
      setLoadingStock(false);
    }
  };

  useEffect(() => {
    if (expandedId && activeTab === 'stock') {
      loadStockHistory(expandedId);
    }
  }, [expandedId, activeTab]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close if click is outside the table or detail area
      if (expandedId && !e.target.closest('tr')) {
        setExpandedId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedId]);

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
      toast.error('Xảy ra lỗi. Không thể lọc danh sách');
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
          <button onClick={() => setModal({ type: 'create' })} className="border border-green-500 text-green-600 bg-white hover:bg-green-50 px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors whitespace-nowrap shadow-sm">
            <PlusIcon className="w-5 h-5" /> Tạo mới
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <div className="w-64 shrink-0">
          <div className="bg-white p-5 rounded-md min-h-[400px] shadow-sm border border-gray-100">
            <p className="text-[13px] font-bold text-gray-800 mb-5 uppercase tracking-wider">Trạng thái kinh doanh</p>
            <div className="space-y-4 mb-10">
              <label className="flex items-center gap-3 text-sm cursor-pointer text-gray-600 hover:text-gray-900 transition-colors">
                <input type="checkbox" checked={filterStatus['Đang bán']} onChange={() => toggleStatus('Đang bán')}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer" />
                Đang bán
              </label>
              <label className="flex items-center gap-3 text-sm cursor-pointer text-gray-600 hover:text-gray-900 transition-colors">
                <input type="checkbox" checked={filterStatus['Ngừng kinh doanh']} onChange={() => toggleStatus('Ngừng kinh doanh')}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer" />
                Ngừng kinh doanh
              </label>
            </div>
            
            <p className="text-[13px] font-bold text-gray-800 mb-4 uppercase tracking-wider">Tồn kho</p>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:ring-1 focus:ring-green-100 outline-none" 
              value={filterTonkho} onChange={e => { setFilterTonkho(e.target.value); setPage(1); }}>
              <option value="">Tất cả</option>
              <option value="du">Đủ hàng</option>
              <option value="thap">Sắp hết hàng</option>
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
                    <th className="py-3 px-4 font-semibold text-gray-800 text-center">Thời gian tạo</th>
                    <th className="py-3 px-4 font-semibold text-gray-800 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">Không tìm thấy hàng hóa nào phù hợp</td></tr>
                  ) : items.map((item, idx) => (
                    <React.Fragment key={item.MASP}>
                      <tr 
                        onClick={() => {
                          const isClosing = expandedId === item.MASP;
                          setExpandedId(isClosing ? null : item.MASP);
                          if (!isClosing) setActiveTab('info');
                        }}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${expandedId === item.MASP ? 'bg-green-50/50' : ''}`}
                      >
                        <td className="py-3.5 px-4 text-gray-600 font-medium">{item.MASP}</td>
                        <td className="py-3.5 px-4 text-gray-700">{item.TENSP}</td>
                        <td className="py-3.5 px-4 text-center text-gray-700 font-medium">{item.GIABAN?.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-center text-gray-700">{item.GIANHAP?.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-center text-gray-700">{item.SL_TON}</td>
                        <td className="py-3.5 px-4 text-center text-gray-700">{fmtDate(item.NGAYTAO)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setModal({ type: 'delete', product: item }); }} 
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors" title="Xóa"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      {expandedId === item.MASP && (
                        <tr className="bg-white border-b border-gray-100" onClick={(e) => e.stopPropagation()}>
                          <td colSpan={7} className="p-0">
                            <div className="p-6 bg-white shadow-inner animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="flex gap-4 border-b border-gray-200 mb-6 pb-px">
                                <button 
                                  onClick={() => setActiveTab('info')}
                                  className={`px-4 py-2 border-b-2 text-sm tracking-wide transition-all ${activeTab === 'info' ? 'border-green-500 text-green-600 font-bold' : 'border-transparent text-gray-500 font-semibold hover:text-gray-700'}`}
                                >
                                  Thông tin
                                </button>
                                <button 
                                  onClick={() => setActiveTab('stock')}
                                  className={`px-4 py-2 border-b-2 text-sm tracking-wide transition-all ${activeTab === 'stock' ? 'border-green-500 text-green-600 font-bold' : 'border-transparent text-gray-500 font-semibold hover:text-gray-700'}`}
                                >
                                  Chi tiết tồn kho
                                </button>
                              </div>

                              {activeTab === 'info' ? (
                                <div className="flex flex-col md:flex-row gap-8">
                                  {/* Left: Info group */}
                                  <div className="flex-1">
                                    <div className="flex items-start gap-4 mb-6">
                                      <div className="w-24 h-24 bg-gray-100 rounded border border-gray-200 overflow-hidden shrink-0 font-sm">
                                        {item.HINHANH ? (
                                          <img src={item.HINHANH} alt={item.TENSP} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-300 italic text-xs">Không ảnh</div>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{item.TENSP}</h3>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${item.TRANGTHAI_SP === 'Đang bán' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                          {item.TRANGTHAI_SP}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-12">
                                      <div className="detail-item">
                                        <label className="block text-xs uppercase font-bold text-gray-400 mb-1 tracking-wider">Mã hàng</label>
                                        <div className="text-sm font-medium text-gray-700 pb-1 border-b border-gray-300">{item.MASP}</div>
                                      </div>
                                      <div className="detail-item">
                                        <label className="block text-xs uppercase font-bold text-gray-400 mb-1 tracking-wider">DVT</label>
                                        <div className="text-sm font-medium text-gray-700 pb-1 border-b border-gray-300">{item.DVT}</div>
                                      </div>
                                      <div className="detail-item">
                                        <label className="block text-xs uppercase font-bold text-gray-400 mb-1 tracking-wider">Số lượng tồn</label>
                                        <div className="text-sm font-medium text-gray-700 pb-1 border-b border-gray-300">{item.SL_TON}</div>
                                      </div>
                                      <div className="detail-item">
                                        <label className="block text-xs uppercase font-bold text-gray-400 mb-1 tracking-wider">Định mức tồn tối thiểu</label>
                                        <div className="text-sm font-medium text-gray-700 pb-1 border-b border-gray-300">{item.DMUC_TON_MIN}</div>
                                      </div>
                                      <div className="detail-item">
                                        <label className="block text-xs uppercase font-bold text-gray-400 mb-1 tracking-wider">Giá bán</label>
                                        <div className="text-sm font-medium text-gray-700 pb-1 border-b border-gray-300">{item.GIABAN?.toLocaleString()}</div>
                                      </div>
                                      <div className="detail-item">
                                        <label className="block text-xs uppercase font-bold text-gray-400 mb-1 tracking-wider">Giá nhập</label>
                                        <div className="text-sm font-medium text-gray-700 pb-1 border-b border-gray-300">{item.GIANHAP?.toLocaleString()}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="animate-in fade-in duration-300">
                                  <table className="w-full text-sm border border-gray-100">
                                    <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold">
                                      <tr>
                                        <th className="py-2.5 px-4 text-left border-b">Số chứng từ</th>
                                        <th className="py-2.5 px-4 text-left border-b">Thời gian</th>
                                        <th className="py-2.5 px-4 text-left border-b">Loại giao dịch</th>
                                        <th className="py-2.5 px-4 text-right border-b">Giá giao dịch</th>
                                        <th className="py-2.5 px-4 text-right border-b">Giá vốn</th>
                                        <th className="py-2.5 px-4 text-center border-b">Số lượng</th>
                                        <th className="py-2.5 px-4 text-center border-b">Tồn thực tế</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {loadingStock ? (
                                        <tr><td colSpan={7} className="text-center py-8 text-gray-400">Đang tải lịch sử...</td></tr>
                                      ) : stockHistory.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-8 text-gray-400">Chưa có giao dịch phát sinh</td></tr>
                                      ) : (
                                        (() => {
                                          let runningStock = item.SL_TON;
                                          return [...stockHistory].reverse().map((h, i) => {
                                            const change = h.TRANGTHAI_HDB === 'Hoàn thành' ? -h.SOLUONG : h.SOLUONG;
                                            const stockBefore = runningStock;
                                            runningStock -= change;
                                            return (
                                              <tr key={h.MAHDB} className="hover:bg-gray-50">
                                                <td className="py-2.5 px-4 border-b text-blue-600 font-medium">{h.MAHDB}</td>
                                                <td className="py-2.5 px-4 border-b text-gray-600">{fmtDate(h.NGAYBAN)}</td>
                                                <td className="py-2.5 px-4 border-b">
                                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.TRANGTHAI_HDB === 'Hoàn thành' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                                    {h.TRANGTHAI_HDB === 'Hoàn thành' ? 'Bán hàng' : 'Hủy đơn'}
                                                  </span>
                                                </td>
                                                <td className="py-2.5 px-4 border-b text-right text-gray-700">{h.GIABAN?.toLocaleString()}</td>
                                                <td className="py-2.5 px-4 border-b text-right text-gray-700">{item.GIANHAP?.toLocaleString()}</td>
                                                <td className="py-2.5 px-4 border-b text-center text-gray-700">
                                                  {h.TRANGTHAI_HDB === 'Hoàn thành' ? `-${h.SOLUONG}` : `+${h.SOLUONG}`}
                                                </td>
                                                <td className="py-2.5 px-4 border-b text-center font-bold text-gray-800">{stockBefore}</td>
                                              </tr>
                                            );
                                          }).reverse();
                                        })()
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              <div className="flex items-center justify-end gap-3 mt-8">
                                <button 
                                  onClick={() => setModal({ type: 'edit', product: item })}
                                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium text-sm transition-colors shadow-sm"
                                >
                                  <PencilSquareIcon className="w-4 h-4" /> Chỉnh sửa
                                </button>
                                <button 
                                  onClick={() => setModal({ type: 'barcode', product: item })}
                                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors shadow-sm"
                                >
                                  <PrinterIcon className="w-4 h-4" /> In tem mã
                                </button>
                                <button 
                                  onClick={() => setModal({ type: 'delete', product: item })}
                                  className="flex items-center gap-2 bg-white hover:bg-red-50 text-gray-700 border border-gray-300 px-4 py-2 rounded font-medium text-sm transition-colors shadow-sm"
                                >
                                  <TrashIcon className="w-4 h-4" /> Xóa
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
      {modal?.type === 'barcode' && <BarcodeModal product={modal.product} onClose={() => setModal(null)} />}
    </div>
  );
}

