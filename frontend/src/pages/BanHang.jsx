import { useState, useRef, useCallback, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon
} from '@heroicons/react/24/outline';

const fmtCurrency = (n) => (n || 0).toLocaleString('vi-VN');
const fmtDateTime = (d) => {
  const datePart = d.toLocaleDateString('vi-VN');
  const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${datePart}  ${timePart}`;
};

function createTab(id) {
  return { id, items: [], pttt: 'Tiền mặt', khachTT: '' };
}

function normalizeProductKeyword(raw) {
  const q = (raw || '').trim();
  if (!q) return '';

  // Support short code inputs: "sp1", "SP1", "1" => "SP00000001"
  const compact = q.replace(/\s+/g, '');
  const match = compact.match(/^(?:sp)?(\d{1,8})$/i);
  if (match) {
    return `SP${match[1].padStart(8, '0')}`;
  }

  return q;
}

function normalizeText(raw) {
  return (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function BanHang() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tabs, setTabs] = useState([createTab(1)]);
  const [activeTab, setActiveTab] = useState(1);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [productCatalog, setProductCatalog] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [paying, setPaying] = useState(false);
  const [showInvoice, setShowInvoice] = useState(null);
  const [now, setNow] = useState(new Date());
  const [confirmClose, setConfirmClose] = useState(null); // { id, index }
  const [showMenu, setShowMenu] = useState(false);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const searchRequestIdRef = useRef(0);

  const currentTab = tabs.find(t => t.id === activeTab);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCatalog = useCallback(async () => {
    try {
      const res = await api.get('/hanghoa', { params: { limit: 500, trangthai: 'Đang bán' } });
      setProductCatalog(res?.data?.items || []);
      setSearchError('');
      return true;
    } catch {
      setSearchError('Không kết nối được dữ liệu hàng hóa');
      return false;
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let retryTimer;

    const bootstrap = async () => {
      const ok = await loadCatalog();
      if (!ok && !disposed) {
        retryTimer = setTimeout(() => { bootstrap(); }, 2000);
      }
    };

    bootstrap();
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [loadCatalog, user?.matk]);

  useEffect(() => {
    setTabs((prev) => {
      const used = new Set();
      let changed = false;
      const next = prev.map((tab) => {
        let nextId = tab.id;
        while (used.has(nextId)) {
          nextId += 1;
          changed = true;
        }
        used.add(nextId);
        return nextId === tab.id ? tab : { ...tab, id: nextId };
      });
      return changed ? next : prev;
    });
  }, []);

  const updateTab = (id, updater) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updater(t) } : t));
  };

  const addTab = () => {
    const nextId = tabs.length ? Math.max(...tabs.map((t) => t.id)) + 1 : 1;
    setTabs((prev) => [...prev, createTab(nextId)]);
    setActiveTab(nextId);
  };

  const removeTab = (id, tabIndex) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter((_, idx) => idx !== tabIndex);
    setTabs(newTabs);
    if (activeTab === id) {
      const nextActiveIndex = Math.max(0, tabIndex - 1);
      setActiveTab(newTabs[nextActiveIndex].id);
    }
  };

  const handleCloseTab = (id, tabIndex) => {
    const targetTab = tabs[tabIndex];
    if (!targetTab) return;
    if (targetTab.items?.length > 0) {
      setConfirmClose({ id, index: tabIndex });
      return;
    }
    removeTab(id, tabIndex);
  };

  const searchProducts = useCallback(async (q) => {
    if (!q.trim()) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    const requestId = ++searchRequestIdRef.current;
    setSearching(true);
    setSearchError('');
    try {
      const mergeUnique = (arr) => {
        const map = new Map();
        for (const item of arr) {
          if (!item?.MASP) continue;
          map.set(item.MASP, item);
        }
        return [...map.values()];
      };

      const keyword = normalizeProductKeyword(q);
      const qNorm = normalizeText(q);
      const keywordNorm = normalizeText(keyword);

      const localMatches = productCatalog
        .filter((p) => {
          const code = (p?.MASP || '').toUpperCase();
          const nameNorm = normalizeText(p?.TENSP || '');
          return (
            code.includes((q || '').toUpperCase()) ||
            code.includes((keyword || '').toUpperCase()) ||
            nameNorm.includes(qNorm) ||
            nameNorm.includes(keywordNorm)
          );
        })
        .slice(0, 8);

      if (localMatches.length > 0) {
        if (requestId === searchRequestIdRef.current) {
          setSearchResults(localMatches);
          setSearchError('');
        }
        return;
      }

      const requests = [
        api.get('/hanghoa', { params: { search: q, limit: 8, trangthai: 'Đang bán' } }),
      ];

      if (keyword !== q) {
        requests.push(api.get('/hanghoa', { params: { search: keyword, limit: 8, trangthai: 'Đang bán' } }));
      }

      const [listByRaw, listByNormalized] = await Promise.all(requests);
      const byRaw = listByRaw?.data?.items || [];
      const byNormalized = listByNormalized?.data?.items || [];
      let merged = mergeUnique([...byRaw, ...byNormalized]);

      // Last fallback: direct exact lookup by MASP (SP00000001)
      if (merged.length === 0) {
        try {
          const exact = await api.get(`/hanghoa/${keyword.toUpperCase()}`);
          const p = exact.data;
          if (p?.TRANGTHAI_SP === 'Đang bán') merged = [p];
        } catch { }
      }

      // Final fallback: fetch active products and filter client-side (supports no-diacritic name search)
      if (merged.length === 0) {
        try {
          const full = await api.get('/hanghoa', { params: { limit: 200, trangthai: 'Đang bán' } });
          const allItems = full?.data?.items || [];
          const keyNorm = keywordNorm;
          merged = allItems
            .filter((p) => {
              const code = (p?.MASP || '').toUpperCase();
              const nameNorm = normalizeText(p?.TENSP || '');
              return (
                code.includes((q || '').toUpperCase()) ||
                code.includes((keyword || '').toUpperCase()) ||
                nameNorm.includes(qNorm) ||
                nameNorm.includes(keyNorm)
              );
            })
            .slice(0, 8);
        } catch { }
      }

      // Avoid out-of-order responses when typing quickly
      if (requestId === searchRequestIdRef.current) {
        setSearchResults(merged);
        if (merged.length === 0) setSearchError('Không tìm thấy hàng hóa');
      }
    } catch {
      setSearchResults([]);
      setSearchError('Không kết nối được dữ liệu hàng hóa');
    }
    finally {
      if (requestId === searchRequestIdRef.current) {
        setSearching(false);
      }
    }
  }, [productCatalog]);

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearchQ(v);
    searchProducts(v);
  };

  const addItem = (product) => {
    updateTab(activeTab, (tab) => {
      const existing = tab.items.find(i => i.MASP === product.MASP);
      if (existing) {
        return { items: tab.items.map(i => i.MASP === product.MASP ? { ...i, SOLUONG: i.SOLUONG + 1, SL_TON: product.SL_TON, DMUC_TON_MIN: product.DMUC_TON_MIN } : i) };
      }
      return { items: [...tab.items, { MASP: product.MASP, TENSP: product.TENSP, DVT: product.DVT, GIABAN: product.GIABAN, SOLUONG: 1, SL_TON: product.SL_TON, DMUC_TON_MIN: product.DMUC_TON_MIN }] };
    });
    setSearchQ('');
    setSearchResults([]);
  };

  const updateQty = (masp, delta) => {
    updateTab(activeTab, (tab) => ({
      items: tab.items.map(i => i.MASP === masp ? { ...i, SOLUONG: Math.max(1, i.SOLUONG + delta) } : i)
    }));
  };

  const handlePay = async () => {
    if (!currentTab?.items?.length) {
      toast.error('Chưa có sản phẩm trong hóa đơn');
      return;
    }

    // Nếu khách không nhập gì, mặc định là trả đúng số tiền cần trả
    const khachDuaTien = currentTab?.khachTT && currentTab.khachTT.trim() !== ''
      ? Number(currentTab.khachTT)
      : total;

    if (khachDuaTien < total) {
      toast.error('Khách thanh toán chưa đủ');
      return;
    }

    setPaying(true);
    try {
      const currentItems = currentTab.items.map((i) => ({ ...i }));
      const res = await api.post('/hoadonban', {
        items: currentItems.map((i) => ({ MASP: i.MASP, SOLUONG: i.SOLUONG, GIABAN: i.GIABAN })),
        pttt: currentTab.pttt,
      });
      toast.success('Thanh toán thành công');

      // Cảnh báo tồn kho dưới định mức
      currentItems.forEach(item => {
        const remaining = (item.SL_TON || 0) - item.SOLUONG;
        const minStock = item.DMUC_TON_MIN || 0;
        if (remaining < minStock) {
          toast.error(`Cảnh báo ${item.TENSP} tồn kho dưới định mức tồn`, {
            duration: 5000,
          });
        }
      });

      setShowInvoice({
        ...res.data,
        items: currentItems,
        khachThanhToan: khachDuaTien,
        tienTraKhach: khachDuaTien - total,
      });
      updateTab(activeTab, () => ({ items: [], khachTT: '' }));
      loadCatalog();
    } catch (err) {
      toast.error('Lưu hóa đơn thất bại');
    } finally {
      setPaying(false);
    }
  };

  const total = currentTab?.items.reduce((s, i) => s + i.SOLUONG * i.GIABAN, 0) || 0;
  const totalQty = currentTab?.items.reduce((s, i) => s + i.SOLUONG, 0) || 0;
  const khachThanhToan = currentTab?.khachTT && currentTab.khachTT.trim() !== ''
    ? Number(currentTab.khachTT)
    : 0;
  const tienTraKhach = Math.max(0, khachThanhToan - total);

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="h-screen flex flex-col bg-[#e9e9eb]">
      <div className="h-12 bg-[#01b763] text-white flex items-center px-2 gap-3">
        <div className="relative w-[360px]">
          <input
            ref={searchRef}
            className="w-full h-8 rounded-lg bg-white text-gray-700 text-sm pl-9 pr-8 focus:outline-none"
            placeholder="Tìm kiếm hàng hóa (F7)"
            value={searchQ}
            onChange={handleSearchChange}
          />
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {(searchQ.trim() && (searching || searchResults.length > 0 || searchError)) && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-md bg-white border border-gray-200 shadow-lg z-50 overflow-hidden text-gray-800">
              {searching && <div className="px-3 py-2 text-xs text-gray-400">Đang tìm...</div>}
              {!searching && searchError && <div className="px-3 py-2 text-xs text-red-500">{searchError}</div>}
              {searchResults.map((p) => (
                <button
                  key={p.MASP}
                  onClick={() => addItem(p)}
                  className="w-full text-left px-5 py-4 text-gray-800 hover:bg-green-50 flex items-start justify-between gap-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                      {p.HINHANH ? (
                        <img src={p.HINHANH} alt={p.TENSP} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold text-gray-900">{p.TENSP}</p>
                      <p className="text-[14px] text-gray-700 mt-1">{p.MASP} | Tồn: {p.SL_TON ?? 0}</p>
                    </div>
                  </div>
                  <span className="text-[16px] font-semibold text-blue-500 shrink-0 pt-1">{fmtCurrency(p.GIABAN)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 6V3.5C1 2.83696 1.26339 2.20107 1.73223 1.73223C2.20107 1.26339 2.83696 1 3.5 1H6M18.5 1H21C21.663 1 22.2989 1.26339 22.7678 1.73223C23.2366 2.20107 23.5 2.83696 23.5 3.5V6M23.5 18.5V21C23.5 21.663 23.2366 22.2989 22.7678 22.7678C22.2989 23.2366 21.663 23.5 21 23.5H18.5M6 23.5H3.5C2.83696 23.5 2.20107 23.2366 1.73223 22.7678C1.26339 22.2989 1 21.663 1 21V18.5M6 12.25H18.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div className="flex items-center gap-1">
          {tabs.map((tab, idx) => (
            <div
              key={`${tab.id}-${idx}`}
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 px-4 rounded-t-md text-sm flex items-center gap-2 cursor-pointer ${activeTab === tab.id ? 'bg-white text-gray-800 font-semibold' : 'bg-[#02a357] text-white'
                }`}
            >
              {`Hóa đơn ${idx + 1}`}
              <XMarkIcon
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(tab.id, idx);
                }}
                className="w-4 h-4 text-gray-500 hover:text-red-500"
              />
            </div>
          ))}
          <button
            onClick={addTab}
            className="w-7 h-7 ml-2 rounded-full border border-white/40 flex items-center justify-center hover:bg-[#029f55]"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="ml-auto relative flex items-center gap-3 text-sm pr-2" ref={menuRef}>
          <span>{user?.tenht || user?.tendn || user?.sdt || 'Tài khoản'}</span>
          <button onClick={() => setShowMenu(v => !v)} className="text-base">≡</button>
          {showMenu && (
            <div className="absolute right-0 top-9 w-[190px] bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate('/');
                }}
                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 2H4C2.89543 2 2 2.89543 2 4V8C2 9.10457 2.89543 10 4 10H20C21.1046 10 22 9.10457 22 8V4C22 2.89543 21.1046 2 20 2Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 14H4C2.89543 14 2 14.8954 2 16V20C2 21.1046 2.89543 22 4 22H20C21.1046 22 22 21.1046 22 20V16C22 14.8954 21.1046 14 20 14Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 6H6.01" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 18H6.01" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Quản lý</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 21C4.45 21 3.97933 20.8043 3.588 20.413C3.19667 20.0217 3.00067 19.5507 3 19V5C3 4.45 3.196 3.97933 3.588 3.588C3.98 3.19667 4.45067 3.00067 5 3H11C11.2833 3 11.521 3.096 11.713 3.288C11.905 3.48 12.0007 3.71733 12 4C11.9993 4.28267 11.9033 4.52033 11.712 4.713C11.5207 4.90567 11.2833 5.00133 11 5H5V19H11C11.2833 19 11.521 19.096 11.713 19.288C11.905 19.48 12.0007 19.7173 12 20C11.9993 20.2827 11.9033 20.5203 11.712 20.713C11.5207 20.9057 11.2833 21.0013 11 21H5ZM17.175 13H10C9.71667 13 9.47933 12.904 9.288 12.712C9.09667 12.52 9.00067 12.2827 9 12C8.99933 11.7173 9.09533 11.48 9.288 11.288C9.48067 11.096 9.718 11 10 11H17.175L15.3 9.125C15.1167 8.94167 15.025 8.71667 15.025 8.45C15.025 8.18333 15.1167 7.95 15.3 7.75C15.4833 7.55 15.7167 7.44567 16 7.437C16.2833 7.42833 16.525 7.52433 16.725 7.725L20.3 11.3C20.5 11.5 20.6 11.7333 20.6 12C20.6 12.2667 20.5 12.5 20.3 12.7L16.725 16.275C16.525 16.475 16.2877 16.571 16.013 16.563C15.7383 16.555 15.5007 16.4507 15.3 16.25C15.1167 16.05 15.0293 15.8127 15.038 15.538C15.0467 15.2633 15.1423 15.034 15.325 14.85L17.175 13Z" fill="black" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 p-3 min-w-0 overflow-y-auto">
          <div className="space-y-4">
            {currentTab?.items.map((item, idx) => (
              <div key={item.MASP} className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3">
                <div className="grid grid-cols-[28px_32px_130px_1fr_150px_110px_120px] items-center gap-3 text-[16px]">
                  <div className="text-gray-700">{idx + 1}</div>
                  <button
                    onClick={() => updateTab(activeTab, (t) => ({ items: t.items.filter((i) => i.MASP !== item.MASP) }))}
                    className="flex items-center justify-center"
                  >
                    <TrashIcon className="w-5 h-5 text-gray-700 hover:text-red-500" />
                  </button>
                  <div className="text-[#323b4a]">{item.MASP}</div>
                  <div className="text-[#2d3138]">{item.TENSP}</div>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.MASP, -1)} className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 leading-none">−</button>
                      <span className={`w-7 text-center border-b border-gray-300 ${item.SOLUONG > (item.SL_TON || 0) ? 'text-red-500 font-bold' : 'text-gray-700'}`}>
                        {item.SOLUONG}
                      </span>
                      <button onClick={() => updateQty(item.MASP, 1)} className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 leading-none">+</button>
                    </div>
                  </div>
                  <div className="text-right text-[#2d3138]">{fmtCurrency(item.GIABAN)}</div>
                  <div className="text-right font-bold text-black">{fmtCurrency(item.SOLUONG * item.GIABAN)}</div>
                </div>
              </div>
            ))}
            {(!currentTab?.items || currentTab.items.length === 0) && (
              <div className="h-[120px]" />
            )}
          </div>
        </div>

        <div className="w-[370px] p-2 pl-0">
          <div className="h-full bg-white rounded-xl border border-gray-200 flex flex-col px-6 py-5">
            <div className="text-right text-sm text-gray-400 mb-10">{fmtDateTime(now)}</div>

            <div className="space-y-6 text-[15px]">
              <div className="grid grid-cols-[1fr_40px_90px] items-center text-[15px]">
                <span className="text-gray-700 font-medium">Tổng tiền hàng</span>
                <span className="text-right">{totalQty}</span>
                <span className="text-right">{fmtCurrency(total)}</span>
              </div>
              <div className="grid grid-cols-[1fr_120px] items-center">
                <span className="font-semibold text-gray-800">Khách cần trả</span>
                <input
                  type="number"
                  min="0"
                  className="text-right font-bold border-b border-gray-300 focus:border-[#53a8d4] focus:outline-none w-[120px] bg-transparent text-[#53a8d4] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={currentTab?.khachTT ?? ''}
                  placeholder={String(total)}
                  onChange={(e) => updateTab(activeTab, () => ({ khachTT: e.target.value }))}
                />
              </div>
              {currentTab?.khachTT && Number(currentTab.khachTT) > 0 && (
                <div className="grid grid-cols-[1fr_120px] items-center">
                  <span className="font-semibold text-gray-800">Tiền trả khách</span>
                  <span className="text-right font-semibold text-[#53a8d4]">{fmtCurrency(tienTraKhach)}</span>
                </div>
              )}
              <div className="pt-1 grid grid-cols-2 gap-6 text-[14px]">
                <label className="flex items-center gap-2 cursor-pointer h-6">
                  <input
                    type="radio"
                    checked={currentTab?.pttt === 'Tiền mặt'}
                    onChange={() => updateTab(activeTab, () => ({ pttt: 'Tiền mặt' }))}
                    className="accent-black w-4 h-4"
                  />
                  <span className="text-gray-700 leading-none">Tiền mặt</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer h-6">
                  <input
                    type="radio"
                    checked={currentTab?.pttt === 'Chuyển khoản'}
                    onChange={() => updateTab(activeTab, () => ({ pttt: 'Chuyển khoản' }))}
                    className="accent-black w-4 h-4"
                  />
                  <span className="text-gray-700 leading-none">Chuyển khoản</span>
                </label>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full h-12 rounded-xl bg-[#08b764] hover:bg-[#06a75b] disabled:opacity-60 text-white font-semibold tracking-wide uppercase"
              >
                {paying ? 'Đang xử lý...' : 'Thanh toán'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-5 bg-[#01b763]" />

      {confirmClose && (
        <div className="fixed inset-0 z-[100] bg-black/35 flex items-center justify-center p-4">
          <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl px-6 py-5 relative">
            <button
              onClick={() => setConfirmClose(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h3 className="text-[20px] font-semibold text-gray-900 mb-3">Đóng hóa đơn</h3>
            <p className="text-[18px] text-gray-800 leading-[1.35] mb-8">
              Thông tin của Hóa đơn {confirmClose.index + 1} sẽ không được lưu lại.
              <br />
              Bạn có chắc chắn muốn đóng?
            </p>
            <div className="flex justify-between max-w-[300px] mx-auto w-full">
              <button
                onClick={() => setConfirmClose(null)}
                className="min-w-[96px] h-11 px-6 rounded-xl border border-[#5c6cff] text-[#5c6cff] text-[16px] font-medium hover:bg-[#eef1ff]"
              >
                Bỏ qua
              </button>
              <button
                onClick={() => {
                  removeTab(confirmClose.id, confirmClose.index);
                  setConfirmClose(null);
                }}
                className="min-w-[96px] h-11 px-6 rounded-xl border border-[#5c6cff] text-[#5c6cff] text-[16px] font-medium hover:bg-[#eef1ff]"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoice && (
        <div className="fixed inset-0 z-[110] bg-black/35 flex items-center justify-center p-4">
          <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between no-print">
              <h3 className="text-lg font-semibold text-gray-900">Hóa đơn bán hàng</h3>
              <button onClick={() => setShowInvoice(null)}>
                <XMarkIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="p-5 space-y-3" id="invoice-print">
              <div className="text-center">
                <p className="text-lg font-bold text-green-700">TIỆM TẠP HÓA</p>
                <p className="text-xs text-gray-500">Mã HĐ: {showInvoice.MAHDB}</p>
                <p className="text-xs text-gray-500">{fmtDateTime(new Date(showInvoice.NGAYBAN || Date.now()))}</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left py-1">Tên hàng</th>
                    <th className="text-center py-1">SL</th>
                    <th className="text-right py-1">Đơn giá</th>
                    <th className="text-right py-1">T.Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {showInvoice.items.map((i) => (
                    <tr key={i.MASP} className="border-b border-gray-100">
                      <td className="py-1">{i.TENSP}</td>
                      <td className="py-1 text-center">{i.SOLUONG}</td>
                      <td className="py-1 text-right">{fmtCurrency(i.GIABAN)}</td>
                      <td className="py-1 text-right font-medium">{fmtCurrency(i.SOLUONG * i.GIABAN)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 text-sm border-t border-dashed pt-2">
                <div className="flex justify-between">
                  <span>Tổng cộng:</span>
                  <span className="font-semibold">{fmtCurrency(showInvoice.TONGTIENHANG_BAN)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Khách thanh toán:</span>
                  <span>{fmtCurrency(showInvoice.khachThanhToan)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tiền trả khách:</span>
                  <span>{fmtCurrency(showInvoice.tienTraKhach)}</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 no-print flex gap-3">
              <button
                onClick={() => setShowInvoice(null)}
                className="flex-1 h-10 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={handlePrintInvoice}
                className="flex-1 h-10 rounded-xl bg-[#08b764] hover:bg-[#06a75b] text-white font-semibold"
              >
                In hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}