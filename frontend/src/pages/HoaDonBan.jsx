import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, PlusIcon, AdjustmentsHorizontalIcon, CalendarDaysIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subMonths, subWeeks, subDays, endOfMonth, subYears, addMonths } from 'date-fns';

const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);
const fmtDate = (s) => {
  if (!s) return '';
  const d = new Date(s);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};
const fmtShort = (s) => {
  if (!s) return '';
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

// ── Quick-pick popup (Tháng này) ──────────────────────────────────────────────
const QUICK_OPTIONS = [
  { group: 'Theo ngày',  items: [{ label: 'Hôm nay', key: 'today' }, { label: 'Hôm qua', key: 'yesterday' }] },
  { group: 'Theo tuần',  items: [{ label: 'Tuần này', key: 'thisWeek' }, { label: 'Tuần trước', key: 'lastWeek' }] },
  { group: 'Theo tháng', items: [{ label: 'Tháng này', key: 'thisMonth' }, { label: 'Tháng trước', key: 'lastMonth' }] },
  { group: 'Theo năm',   items: [{ label: 'Năm này', key: 'thisYear' }, { label: 'Năm trước', key: 'lastYear' }] },
];

function getRange(key) {
  const today = new Date();
  switch (key) {
    case 'today':      return [format(today,'yyyy-MM-dd'), format(today,'yyyy-MM-dd')];
    case 'yesterday':  { const y = subDays(today,1); return [format(y,'yyyy-MM-dd'), format(y,'yyyy-MM-dd')]; }
    case 'thisWeek':   return [format(startOfWeek(today,{weekStartsOn:1}),'yyyy-MM-dd'), format(endOfWeek(today,{weekStartsOn:1}),'yyyy-MM-dd')];
    case 'lastWeek':   { const lw = subWeeks(today,1); return [format(startOfWeek(lw,{weekStartsOn:1}),'yyyy-MM-dd'), format(endOfWeek(lw,{weekStartsOn:1}),'yyyy-MM-dd')]; }
    case 'thisMonth':  return [format(startOfMonth(today),'yyyy-MM-dd'), format(today,'yyyy-MM-dd')];
    case 'lastMonth':  { const lm = subMonths(today,1); return [format(startOfMonth(lm),'yyyy-MM-dd'), format(endOfMonth(lm),'yyyy-MM-dd')]; }
    case 'thisYear':   return [format(startOfYear(today),'yyyy-MM-dd'), format(endOfYear(today),'yyyy-MM-dd')];
    case 'lastYear':   { const ly = subYears(today,1); return [format(startOfYear(ly),'yyyy-MM-dd'), format(endOfYear(ly),'yyyy-MM-dd')]; }
    default:           return [format(startOfMonth(today),'yyyy-MM-dd'), format(today,'yyyy-MM-dd')];
  }
}

function QuickPickPopup({ activeKey, onSelect, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-5" style={{ minWidth: 420 }}>
      <div className="flex gap-8">
        {QUICK_OPTIONS.map(({ group, items }) => (
          <div key={group} className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gray-800 mb-1">{group}</p>
            {items.map(({ label, key }) => (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className={`text-sm px-5 py-1.5 rounded-full border transition-colors whitespace-nowrap
                  ${activeKey === key
                    ? 'bg-green-500 text-white border-green-500 font-medium'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-green-400 hover:text-green-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Date Range Picker popup (Tùy chỉnh) ──────────────────────────────────────
const DOW = ['T2','T3','T4','T5','T6','T7','CN'];

function CalendarMonth({ year, month, selecting, startDate, endDate, hoverDate, onDayClick, onDayHover }) {
  const firstDay = new Date(year, month, 1);
  // weekday of first day (Mon=0)
  let startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push({ day: prevDays - startDow + 1 + i, cur: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - startDow - daysInMonth + 1, cur: false });

  const toStr = (d) => format(new Date(year, month, d), 'yyyy-MM-dd');

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 mb-1">
        {DOW.map(d => <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((c, i) => {
          if (!c.cur) return <div key={i} className="text-center text-xs text-gray-300 py-1.5">{String(c.day).padStart(2,'0')}</div>;
          const ds = toStr(c.day);
          const isStart = ds === startDate;
          const isEnd = ds === endDate;
          const inRange = startDate && endDate && ds > startDate && ds < endDate;
          const isHover = selecting && startDate && !endDate && hoverDate && ds > startDate && ds <= hoverDate;
          return (
            <div key={i} className="flex justify-center py-0.5">
              <button
                onClick={() => onDayClick(ds)}
                onMouseEnter={() => onDayHover(ds)}
                className={`w-8 h-8 text-xs rounded-full flex items-center justify-center transition-colors
                  ${isStart || isEnd ? 'bg-green-600 text-white font-bold' : ''}
                  ${inRange || isHover ? 'bg-green-100 text-green-800 rounded-none' : ''}
                  ${!isStart && !isEnd && !inRange && !isHover ? 'hover:bg-gray-100 text-gray-700' : ''}`}
              >
                {String(c.day).padStart(2,'0')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DateRangePopup({ initStart, initEnd, onApply, onClose }) {
  const ref = useRef();
  const today = new Date();
  const [leftYear, setLeftYear] = useState(today.getFullYear());
  const [leftMonth, setLeftMonth] = useState(today.getMonth());
  const [startDate, setStartDate] = useState(initStart || '');
  const [endDate, setEndDate] = useState(initEnd || '');
  const [selecting, setSelecting] = useState(false);
  const [hoverDate, setHoverDate] = useState('');

  const rightDate = addMonths(new Date(leftYear, leftMonth, 1), 1);
  const rightYear = rightDate.getFullYear();
  const rightMonth = rightDate.getMonth();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleDayClick = (ds) => {
    if (!selecting || (startDate && endDate)) {
      setStartDate(ds); setEndDate(''); setSelecting(true);
    } else {
      if (ds < startDate) { setStartDate(ds); setEndDate(''); }
      else { setEndDate(ds); setSelecting(false); }
    }
  };

  const prevMonth = () => {
    const d = subMonths(new Date(leftYear, leftMonth, 1), 1);
    setLeftYear(d.getFullYear()); setLeftMonth(d.getMonth());
  };
  const nextMonth = () => {
    const d = addMonths(new Date(leftYear, leftMonth, 1), 1);
    setLeftYear(d.getFullYear()); setLeftMonth(d.getMonth());
  };

  const displayStart = startDate ? fmtShort(startDate) : '--/--/----';
  const displayEnd   = endDate   ? fmtShort(endDate)   : '--/--/----';

  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-[560px]">
      <p className="text-sm font-semibold text-gray-700 mb-3">
        Từ ngày: <span className="text-green-700">{displayStart}</span>
        {' '}-{' '}
        Đến ngày: <span className="text-green-700">{displayEnd}</span>
      </p>
      <div className="flex gap-4">
        {/* Left calendar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronLeftIcon className="w-4 h-4 text-gray-500" /></button>
            <span className="text-sm font-semibold text-gray-700">Tháng {leftMonth + 1}/ {leftYear}</span>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronRightIcon className="w-4 h-4 text-gray-500" /></button>
          </div>
          <CalendarMonth year={leftYear} month={leftMonth} selecting={selecting}
            startDate={startDate} endDate={endDate} hoverDate={hoverDate}
            onDayClick={handleDayClick} onDayHover={setHoverDate} />
        </div>
        {/* Right calendar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronLeftIcon className="w-4 h-4 text-gray-500" /></button>
            <span className="text-sm font-semibold text-gray-700">Tháng {rightMonth + 1}/ {rightYear}</span>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronRightIcon className="w-4 h-4 text-gray-500" /></button>
          </div>
          <CalendarMonth year={rightYear} month={rightMonth} selecting={selecting}
            startDate={startDate} endDate={endDate} hoverDate={hoverDate}
            onDayClick={handleDayClick} onDayHover={setHoverDate} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Bỏ qua</button>
        <button
          onClick={() => { if (startDate && endDate) onApply(startDate, endDate); }}
          disabled={!startDate || !endDate}
          className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-40"
        >Áp dụng</button>
      </div>
    </div>
  );
}

// ── ExpandedInvoice ───────────────────────────────────────────────────────────
function ExpandedInvoice({ invoice, onCancelled }) {
  const [detail, setDetail] = useState(null);
  const [ghichu, setGhichu] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    api.get(`/hoadonban/${invoice.MAHDB}`)
      .then(r => { setDetail(r.data); setGhichu(r.data.GHICHU || ''); })
      .catch(() => toast.error('Lỗi tải chi tiết'))
      .finally(() => setLoading(false));
  }, [invoice.MAHDB]);

  const saveNote = async () => {
    setSaving(true);
    try { await api.patch(`/hoadonban/${invoice.MAHDB}/ghichu`, { ghichu }); toast.success('Đã lưu ghi chú'); }
    catch { toast.error('Lỗi lưu ghi chú'); } finally { setSaving(false); }
  };

  const cancelInvoice = async () => {
    setCancelling(true);
    try {
      await api.patch(`/hoadonban/${invoice.MAHDB}/huy`);
      toast.success('Đã hủy hóa đơn'); setShowCancel(false); onCancelled();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi hủy hóa đơn'); }
    finally { setCancelling(false); }
  };

  if (loading) return <tr><td colSpan={3} className="py-4 text-center text-gray-400 bg-green-50">Đang tải...</td></tr>;

  const tongTien = detail?.TONGTIENHANG_BAN || 0;

  return (
    <tr>
      <td colSpan={3} className="bg-white border-b border-gray-100 px-6 py-4">
        {/* Tab */}
        <div className="border-b border-gray-200 mb-4">
          <span className="inline-block text-sm font-semibold text-blue-500 border-b-2 border-blue-500 pb-2 pr-4">Thông tin</span>
        </div>

        {/* Header info */}
        <div className="flex items-center gap-3 mb-3">
          <span className="font-bold text-gray-800 text-base">Khách lẻ</span>
          <span className="text-gray-600 text-sm">{detail?.MAHDB}</span>
          <span className={`text-xs font-semibold px-3 py-0.5 rounded-full ${detail?.TRANGTHAI_HDB === 'Hoàn thành' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {detail?.TRANGTHAI_HDB}
          </span>
        </div>

        {/* Ngày bán */}
        <div className="flex justify-end items-center gap-2 mb-3 text-sm text-gray-600">
          <span>Ngày bán:</span>
          <span className="font-medium">{fmtDate(detail?.NGAYBAN)}</span>
          <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
        </div>

        {/* Items table */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Mã hàng</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Tên hàng</th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">Số lượng</th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">Đơn giá</th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {detail?.items?.map(i => (
              <tr key={i.MASP} className="border-b border-gray-100">
                <td className="py-2.5 px-3 text-sm text-gray-500">{i.MASP}</td>
                <td className="py-2.5 px-3 text-gray-800">{i.TENSP}</td>
                <td className="py-2.5 px-3 text-right text-gray-700">{i.SOLUONG}</td>
                <td className="py-2.5 px-3 text-right text-gray-700">{fmtCurrency(i.GIABAN)}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-gray-800">{fmtCurrency(i.SOLUONG * i.GIABAN)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bottom: ghi chú + tổng + nút */}
        <div className="flex gap-6">
          {/* Ghi chú */}
          <div className="flex-1">
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-green-400 text-gray-400 placeholder-gray-300"
              rows={3}
              value={ghichu}
              onChange={e => setGhichu(e.target.value)}
              placeholder="Ghi chú"
            />
          </div>

          {/* Tổng tiền */}
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tổng tiền hàng:</span>
              <span className="text-gray-800">{fmtCurrency(tongTien)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Khách cần trả:</span>
              <span className="text-gray-800">{fmtCurrency(tongTien)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-gray-500">Khách đã trả:</span>
              <span className="text-gray-800">{fmtCurrency(tongTien)}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={saveNote}
            disabled={saving}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
          {detail?.TRANGTHAI_HDB === 'Hoàn thành' && (
            <button
              onClick={() => setShowCancel(true)}
              className="flex items-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Hủy
            </button>
          )}
        </div>

        {showCancel && (
          <div className="modal-overlay" onClick={() => setShowCancel(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowCancel(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h3 className="font-bold text-lg mb-3">Hủy hóa đơn</h3>
              <p className="text-gray-700 text-sm mb-8">
                Bạn có chắc chắn muốn hủy hóa đơn <strong>{detail?.MAHDB}</strong> không?
              </p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => setShowCancel(false)}
                  className="px-8 py-2 rounded-xl border-2 border-blue-400 text-blue-500 font-semibold text-sm hover:bg-blue-50 transition-colors">
                  Bỏ qua
                </button>
                <button onClick={cancelInvoice} disabled={cancelling}
                  className="px-8 py-2 rounded-xl border-2 border-red-400 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-50">
                  {cancelling ? 'Đang hủy...' : 'Đồng ý'}
                </button>
              </div>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HoaDonBan() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [filterStatus, setFilterStatus] = useState({ 'Hoàn thành': true, 'Đã hủy': false });
  const [filterPTTT, setFilterPTTT] = useState({ 'Tiền mặt': true, 'Chuyển khoản': true });

  // date state
  const [dateMode, setDateMode] = useState('thang');
  const [quickKey, setQuickKey] = useState('thisMonth');
  const [tungay, setTungay] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [denngay, setDenngay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showQuickPick, setShowQuickPick] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [showFilterBox, setShowFilterBox] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statuses = Object.entries(filterStatus).filter(([, v]) => v).map(([k]) => k).join(',');
      const pttts = Object.entries(filterPTTT).filter(([, v]) => v).map(([k]) => k).join(',');
      const res = await api.get('/hoadonban', {
        params: { page, limit: 15, search, trangthai: statuses, pttt: pttts, tungay, denngay }
      });
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      const sum = res.data.totalAmount ?? res.data.items.reduce((acc, i) => acc + (parseFloat(i.TONGTIENHANG_BAN) || 0), 0);
      setTotalAmount(sum);
    } catch { toast.error('Lỗi tải dữ liệu'); }
    finally { setLoading(false); }
  }, [page, search, filterStatus, filterPTTT, tungay, denngay]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = (k) => { setFilterStatus(p => ({ ...p, [k]: !p[k] })); setPage(1); };
  const togglePTTT = (k) => { setFilterPTTT(p => ({ ...p, [k]: !p[k] })); setPage(1); };

  const handleQuickSelect = (key) => {
    const [s, e] = getRange(key);
    setQuickKey(key); setTungay(s); setDenngay(e);
    setShowQuickPick(false); setPage(1);
  };

  const handleApplyRange = (s, e) => {
    setTungay(s); setDenngay(e);
    setShowDateRange(false); setPage(1);
  };

  // label for "Tháng này" button
  const quickLabel = QUICK_OPTIONS.flatMap(g => g.items).find(i => i.key === quickKey)?.label || 'Tháng này';

  return (
    <div className="flex gap-0 h-full">
      {/* Sidebar */}
      <div className="w-56 shrink-0 pr-4 space-y-5">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Hóa đơn</h1>

        {/* Thời gian */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Thời gian</p>
          <div className="space-y-1">
            {/* Tháng này / quick pick */}
            <div className="relative">
              <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
                <input type="radio" name="dateMode" checked={dateMode === 'thang'}
                  onChange={() => { setDateMode('thang'); setShowDateRange(false); }}
                  className="accent-green-600" />
                <button
                  type="button"
                  onClick={() => { setDateMode('thang'); setShowDateRange(false); setShowQuickPick(v => !v); }}
                  className={`flex-1 flex items-center justify-between rounded px-2 py-1 border text-sm
                    ${dateMode === 'thang' ? 'border-green-500 bg-white' : 'border-gray-200 bg-gray-100'}`}
                >
                  <span>{quickLabel}</span>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </label>
              {showQuickPick && dateMode === 'thang' && (
                <QuickPickPopup activeKey={quickKey} onSelect={handleQuickSelect} onClose={() => setShowQuickPick(false)} />
              )}
            </div>

            {/* Tùy chỉnh / date range */}
            <div className="relative">
              <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
                <input type="radio" name="dateMode" checked={dateMode === 'custom'}
                  onChange={() => { setDateMode('custom'); setShowQuickPick(false); }}
                  className="accent-green-600" />
                <button
                  type="button"
                  onClick={() => { setDateMode('custom'); setShowQuickPick(false); setShowDateRange(v => !v); }}
                  className={`flex-1 flex items-center justify-between rounded px-2 py-1 border text-sm
                    ${dateMode === 'custom' ? 'border-green-500 bg-white' : 'border-gray-200 bg-gray-100'}`}
                >
                  <span>Tùy chỉnh</span>
                  <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </label>
              {showDateRange && dateMode === 'custom' && (
                <DateRangePopup initStart={tungay} initEnd={denngay}
                  onApply={handleApplyRange} onClose={() => setShowDateRange(false)} />
              )}
            </div>
          </div>
        </div>

        {/* Trạng thái hóa đơn */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Trạng thái hóa đơn</p>
          {Object.keys(filterStatus).map(k => (
            <label key={k} className="flex items-center gap-2 text-sm cursor-pointer py-1">
              <input type="checkbox" checked={filterStatus[k]} onChange={() => toggleStatus(k)}
                className="rounded border-gray-300 accent-green-600 w-4 h-4" />
              {k}
            </label>
          ))}
        </div>

        {/* Phương thức thanh toán */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Phương thức thanh toán</p>
          {Object.keys(filterPTTT).map(k => (
            <label key={k} className="flex items-center gap-2 text-sm cursor-pointer py-1">
              <input type="checkbox" checked={filterPTTT[k]} onChange={() => togglePTTT(k)}
                className="rounded border-gray-300 accent-green-600 w-4 h-4" />
              {k}
            </label>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 space-y-3">
        {/* Search + Tạo mới */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            {/* Search bar */}
            <div className="flex items-center border border-gray-200 rounded-lg bg-white px-3 py-2 gap-2">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                className="flex-1 text-sm focus:outline-none bg-transparent placeholder-gray-400"
                placeholder="Tìm kiếm theo mã hóa đơn, tên hàng, mã hàng"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setPage(1); setShowFilterBox(false); } }}
              />
              <button onClick={() => setShowFilterBox(v => !v)} className="shrink-0 hover:text-green-600 text-gray-400 transition-colors">
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
              </button>
            </div>
            {/* Filter dropdown */}
            {showFilterBox && (
              <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
                <input
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400 mb-3"
                  placeholder="Theo mã hóa đơn, tên hàng, mã hàng"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => { setPage(1); setShowFilterBox(false); }}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/ban-hang')}
            className="flex items-center gap-1.5 border border-green-600 text-green-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4" /> Tạo mới
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-100">
                <th className="text-left py-3 px-6 font-bold text-gray-800">Mã hóa đơn</th>
                <th className="text-left py-3 px-6 font-bold text-gray-800">Thời gian</th>
                <th className="text-right py-3 px-6 font-bold text-gray-800">Tổng tiền hàng</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-6"></td>
                  <td className="py-3 px-6"></td>
                  <td className="py-3 px-6 text-right font-bold text-gray-800">{fmtCurrency(totalAmount)}</td>
                </tr>
              )}
              {loading ? (
                <tr><td colSpan={3} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-12 text-gray-400">Không có hóa đơn nào</td></tr>
              ) : items.map(inv => (
                <React.Fragment key={inv.MAHDB}>
                  <tr
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === inv.MAHDB ? null : inv.MAHDB)}
                  >
                    <td className="py-3 px-6 text-gray-700">{inv.MAHDB}</td>
                    <td className="py-3 px-6 text-gray-600">{fmtDate(inv.NGAYBAN)}</td>
                    <td className="py-3 px-6 text-right text-gray-700">{fmtCurrency(inv.TONGTIENHANG_BAN)}</td>
                  </tr>
                  {expandedRow === inv.MAHDB && (
                    <ExpandedInvoice invoice={inv} onCancelled={() => { setExpandedRow(null); load(); }} />
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">Tổng: {total} hóa đơn</p>
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
  );
}
