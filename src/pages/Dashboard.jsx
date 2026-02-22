import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, X, Lock, Search,
    CalendarDays, ClipboardList, Check, Trash2, ChevronRight, Clock
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

/* ── helpers ────────────────────────────────────── */
const STATUS_STYLES = {
    PAID: 'bg-green-900/20 text-green-400 border border-green-900/50',
    KEEPSLOT: 'bg-yellow-900/20 text-yellow-400 border border-yellow-900/50',
    COMPLETED: 'bg-blue-900/20 text-blue-400 border border-blue-900/50',
    PENDING: 'bg-gray-900/20 text-gray-400 border border-white/10',
    ARRIVED: 'bg-purple-900/20 text-purple-400 border border-purple-900/50',
    AWAITING_CONFIRMATION: 'bg-orange-900/20 text-orange-400 border border-orange-900/50',
};

const GlassCard = ({ children, className = '' }) => (
    <div className={`rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/5 shadow-xl ${className}`}>
        {children}
    </div>
);

/* ── NEW BOOKING MODAL ──────────────────────────── */
const PACKAGES = [
    'Self Photo Session', 'Party Photo Session', 'Thematic Basic',
    'Thematic Package', 'Wide Photo', 'Custom Session'
];

const NewBookingModal = ({ onClose, onSave }) => {
    const today = new Date().toISOString().slice(0, 10);
    const [form, setForm] = useState({ name: '', phone: '', price: '', date: today, time: '', package: PACKAGES[0], status: 'KEEPSLOT', pmt: 'PENDING', notes: '' });
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const inp = "w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-primary placeholder-gray-700";

    const submit = e => {
        e.preventDefault();
        onSave({
            ...form,
            id: `BK-${Date.now()}`,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <div className="w-full max-w-md rounded-3xl p-7 bg-[#0a0a0a] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9)]">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">New Booking</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-white"><X size={18} /></button>
                </div>
                <form onSubmit={submit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Nama Customer</label>
                            <input required placeholder="Nama..." value={form.name} onChange={set('name')} className={inp} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">No. HP / WA</label>
                            <input placeholder="08..." value={form.phone} onChange={set('phone')} className={inp} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Tanggal</label>
                            <input required type="date" value={form.date} onChange={set('date')} className={inp} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Jam</label>
                            <input required type="time" value={form.time} onChange={set('time')} className={inp} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Paket</label>
                            <select value={form.package} onChange={set('package')} className={inp}>
                                {PACKAGES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Harga (Rp)</label>
                            <input type="number" required placeholder="0" value={form.price} onChange={set('price')} className={inp} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Status</label>
                            <select value={form.status} onChange={set('status')} className={inp}>
                                {['KEEPSLOT', 'AWAITING_CONFIRMATION', 'PAID', 'ARRIVED', 'COMPLETED', 'PENDING'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Pembayaran</label>
                            <select value={form.pmt} onChange={set('pmt')} className={inp}>
                                {['PENDING', 'CASH', 'QRIS'].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Catatan</label>
                        <textarea rows="2" placeholder="Keterangan..." value={form.notes} onChange={set('notes')} className={`${inp} resize-none`} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/8">Batal</button>
                        <button type="submit" className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-red-700 shadow-lg shadow-primary/20">Simpan</button>
                    </div>
                </form>
            </div >
        </div >
    );
};

/* ── EDIT BOOKING MODAL ─────────────────────────── */
const EditBookingModal = ({ booking, onClose, onSave }) => {
    const [form, setForm] = useState({ ...booking });
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const inp = "w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-primary placeholder-gray-700";

    const submit = e => {
        e.preventDefault();
        onSave(form.id, form);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <div className="w-full max-w-md rounded-3xl p-7 bg-[#0a0a0a] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9)]">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Edit Booking</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-white"><X size={18} /></button>
                </div>
                <form onSubmit={submit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Nama Customer</label>
                            <input required placeholder="Nama..." value={form.name} onChange={set('name')} className={inp} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">No. HP / WA</label>
                            <input placeholder="08..." value={form.phone || ''} onChange={set('phone')} className={inp} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Tanggal</label>
                            <input required type="date" value={form.date} onChange={set('date')} className={inp} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Jam</label>
                            <input required type="time" value={form.time} onChange={set('time')} className={inp} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Paket</label>
                            <select value={form.package} onChange={set('package')} className={inp}>
                                {PACKAGES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Harga (Rp)</label>
                            <input type="number" required placeholder="0" value={form.price || ''} onChange={set('price')} className={inp} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Status</label>
                            <select value={form.status} onChange={set('status')} className={inp}>
                                {['KEEPSLOT', 'AWAITING_CONFIRMATION', 'PAID', 'ARRIVED', 'COMPLETED', 'PENDING'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Pembayaran</label>
                            <select value={form.pmt} onChange={set('pmt')} className={inp}>
                                {['PENDING', 'CASH', 'QRIS'].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Catatan</label>
                        <textarea rows="2" placeholder="Keterangan..." value={form.notes} onChange={set('notes')} className={`${inp} resize-none`} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/8">Batal</button>
                        <button type="submit" className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-red-700 shadow-lg shadow-primary/20">Simpan Perubahan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ── BOOKINGS TAB ───────────────────────────────── */
const BookingsTab = () => {
    const { bookings, addBooking, updateBooking, deleteBooking } = useFinance();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [showNewModal, setShowNewModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);

    const statuses = ['All', 'PAID', 'KEEPSLOT', 'COMPLETED', 'PENDING'];
    const filtered = bookings.filter(b => {
        const matchSearch = (b.name || '').toLowerCase().includes(search.toLowerCase()) || (b.id || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'All' || b.status === filterStatus;
        return matchSearch && matchStatus;
    }).sort((a, b) => (a.date || '') > (b.date || '') ? 1 : -1);

    // Group bookings by date for calendar view
    const groupedByDate = filtered.reduce((acc, b) => {
        const d = b.date || 'Unknown';
        if (!acc[d]) acc[d] = [];
        acc[d].push(b);
        return acc;
    }, {});
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => a > b ? 1 : -1);

    return (
        <>
            <GlassCard>
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><CalendarDays size={18} /></div>
                        <h2 className="font-bold text-gray-900 dark:text-white">Booking List</h2>
                        <span className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded font-mono">{filtered.length} records</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
                            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>List</button>
                            <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>Calendar</button>
                        </div>
                        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors">
                            <Plus size={14} /> New Booking
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-white/5 flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                        <input type="text" placeholder="Cari nama atau ID booking..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-black/30 border border-white/8 rounded-xl text-sm text-white placeholder-gray-700 outline-none focus:border-primary" />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        {statuses.map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${filterStatus === s ? 'bg-primary text-white border-primary' : 'bg-white/3 text-gray-400 border-white/8 hover:text-white'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="overflow-x-auto min-h-[300px]">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <CalendarDays size={32} className="text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-600 font-bold">Belum ada booking</p>
                            <p className="text-gray-700 text-xs mt-1">Klik "+ New Booking" untuk menambahkan</p>
                        </div>
                    ) : viewMode === 'list' ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['ID/Contact', 'Nama', 'Tanggal', 'Jam', 'Paket', 'Harga', 'Status', 'Bayar', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/4">
                                {filtered.map(b => (
                                    <tr key={b.id} onClick={() => setEditingBooking(b)} className="hover:bg-white/2 cursor-pointer transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="font-mono text-xs text-gray-500">{b.id.replace('BK-', '')}</div>
                                            {b.phone && <div className="text-[10px] text-gray-600 mt-0.5">{b.phone}</div>}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white text-sm">{b.name}</td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{b.date}</td>
                                        <td className="px-4 py-3 text-sm font-mono text-gray-300">{b.time}</td>
                                        <td className="px-4 py-3 text-xs text-gray-400 max-w-32 truncate">{b.package}</td>
                                        <td className="px-4 py-3 text-xs font-mono text-gray-300">Rp {Number(b.price || 0).toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${STATUS_STYLES[b.status] || STATUS_STYLES.PENDING}`}>{b.status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">{b.pmt}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={(e) => { e.stopPropagation(); deleteBooking(b.id); }}
                                                className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-4 space-y-6">
                            {sortedDates.map(date => {
                                const dayBookings = groupedByDate[date];
                                const dateObj = new Date(date);
                                const dateStr = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                                const isToday = date === new Date().toISOString().slice(0, 10);

                                return (
                                    <div key={date} className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-primary' : 'bg-gray-600'}`} />
                                            <h3 className={`font-bold ${isToday ? 'text-primary' : 'text-gray-300'}`}>
                                                {dateStr} {isToday && <span className="ml-2 text-[10px] px-2 py-0.5 bg-primary/20 rounded-full">Hari Ini</span>}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {dayBookings.sort((a, b) => a.time > b.time ? 1 : -1).map(b => (
                                                <div key={b.id} onClick={() => setEditingBooking(b)}
                                                    className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-primary/50 cursor-pointer transition-all group flex flex-col justify-between">

                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="text-gray-900 dark:text-white font-bold">{b.name}</div>
                                                            {b.phone && <div className="text-xs text-gray-500">{b.phone}</div>}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLES[b.status] || STATUS_STYLES.PENDING}`}>{b.status}</span>
                                                            <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">{b.time}</span>
                                                        </div>
                                                    </div>

                                                    <div className="text-xs text-gray-400 mb-3">{b.package}</div>

                                                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                                        <div className="text-xs font-mono font-bold text-gray-300">Rp {Number(b.price || 0).toLocaleString('id-ID')}</div>
                                                        <button onClick={(e) => { e.stopPropagation(); deleteBooking(b.id); }}
                                                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </GlassCard>
            {showNewModal && <NewBookingModal onClose={() => setShowNewModal(false)} onSave={addBooking} />}
            {editingBooking && <EditBookingModal booking={editingBooking} onClose={() => setEditingBooking(null)} onSave={updateBooking} />}
        </>
    );
};

/* ── helper: reset interval ──────────────────────── */
const todayStr = () => new Date().toISOString().slice(0, 10);

/* ── Default tab config (seeds localStorage on first load) ── */
const DEFAULT_TABS = [
    {
        key: 'opening', label: 'Opening Shift (BAB 1)', emoji: '🌅', accent: 'text-amber-400', reset: 'daily',
        tasks: [
            { id: 'o1', label: 'Datang 30 mnt sebelum beroperasi (Pakaian rapi, parfum)' },
            { id: 'o2', label: 'LOBBY: Sapu, pel, tata meja, bersihkan kaca & nyalakan lampu' },
            { id: 'o3', label: 'STUDIO: Tata alat & properti (Basic & Thematic)' },
            { id: 'o4', label: 'Nyalakan alat elektronik & pastikan berfungsi normal' },
            { id: 'o5', label: 'Cek stok kertas & tinta (pesan jika menipis)' },
            { id: 'o6', label: 'Login os.meraselfstudio.com di iMac' },
            { id: 'o7', label: 'Siapkan HP Android khusus untuk mengecek Livin Mandiri' }
        ],
    },
    {
        key: 'operational', label: 'Operational (BAB 2-4)', emoji: '📸', accent: 'text-blue-400', reset: 'daily',
        tasks: [
            { id: 'op1', label: 'Sambut tamu (5S) & Cek Screenshot Tiket' },
            { id: 'op2', label: 'Verifikasi: Cek mutasi 50k (jika Unverified) / Langsung hadir (Keep Slot)' },
            { id: 'op3', label: 'Jelaskan aturan, durasi, rekomendasi bg, & cara pakai remote' },
            { id: 'op4', label: 'Atur timer & Pasang Preset B&W saat foto percobaan' },
            { id: 'op5', label: 'Segera Ekspor foto saat timer habis & atur timer pilih foto' },
            { id: 'op6', label: 'WAJIB tawarkan Upselling (Add-Ons) saat tamu memilih foto' },
            { id: 'op7', label: 'Check-out iMac & Tagih sisa lunas (Cash/QRIS)' },
            { id: 'op8', label: 'Print foto fisik & masukkan ke dalam packaging' },
            { id: 'op9', label: 'Buat Folder Drive & Kirim link softfile via DM Instagram' },
            { id: 'op10', label: 'Periksa studio pasca-sesi (Background sobek/properti)' },
        ]
    },
    {
        key: 'closing', label: 'Closing Shift (BAB 5)', emoji: '🌙', accent: 'text-purple-400', reset: 'daily',
        tasks: [
            { id: 'c1', label: 'Print rekap penjualan hari ini' },
            { id: 'c2', label: 'Matikan semua peralatan elektronik dengan hati-hati' },
            { id: 'c3', label: 'Pastikan semua properti dikembalikan ke tempatnya' },
            { id: 'c4', label: 'Kunci pintu & jendela studio' },
            { id: 'c5', label: 'Laporan shift di grup WA' },
            { id: 'c6', label: 'Pastikan area kasir bersih & rapi' },
        ],
    },
    {
        key: 'weekly', label: 'Tugas Mingguan', emoji: '📅', accent: 'text-green-400', reset: 'weekly',
        tasks: [
            { id: 'w1', label: 'Deep clean seluruh studio' },
            { id: 'w2', label: 'Sortir & buang prop yang rusak' },
            { id: 'w3', label: 'Update list background & prop di sistem' },
            { id: 'w4', label: 'Cek kondisi kabel & peralatan elektronik' },
            { id: 'w5', label: 'Restock packaging & supplies' },
            { id: 'w6', label: 'Rapat mingguan tim' },
        ],
    },
];

const TABS_KEY = 'checklist_tabs_v2_meraos';
const DONE_KEY = 'checklist_done_v2_meraos';

const loadTabs = () => {
    try { const r = localStorage.getItem(TABS_KEY); return r ? JSON.parse(r) : DEFAULT_TABS; }
    catch { return DEFAULT_TABS; }
};
const saveTabs = (t) => localStorage.setItem(TABS_KEY, JSON.stringify(t));

const loadDone = () => { try { return JSON.parse(localStorage.getItem(DONE_KEY)) || {}; } catch { return {}; } };
const saveDone = (d) => localStorage.setItem(DONE_KEY, JSON.stringify(d));

const isoWeek = (d) => {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7));
    return Math.ceil((((dt - new Date(Date.UTC(dt.getUTCFullYear(), 0, 1))) / 86400000) + 1) / 7);
};
const weekStr = () => `${new Date().getFullYear()}-W${isoWeek(new Date())}`;

/* ── CHECKLIST TAB ──────────────────────────────── */
const ChecklistTab = () => {
    const [tabs, setTabs] = useState(loadTabs);
    const [activeKey, setActiveKey] = useState(() => tabs[0]?.key || 'opening');
    const [done, setDone] = useState({});

    // Owner mode state
    const [isOwner, setIsOwner] = useState(false);
    const [ownerPin, setOwnerPin] = useState('');
    const [pinErr, setPinErr] = useState(false);

    // Task input
    const [newLabel, setNewLabel] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    // Tab editing
    const [editingTabKey, setEditingTabKey] = useState(null);
    const [editingTabLabel, setEditingTabLabel] = useState('');
    const [showAddTab, setShowAddTab] = useState(false);
    const [newTabLabel, setNewTabLabel] = useState('');

    // Reset daily / weekly done state
    useEffect(() => {
        const saved = loadDone();
        const prev = saved._meta || {};
        const today = todayStr();
        const week = weekStr();
        const fresh = { ...saved };

        if (prev.lastDay !== today) {
            tabs.forEach(tb => {
                if (tb.reset === 'daily') tb.tasks.forEach(t => delete fresh[t.id]);
            });
            fresh._meta = { ...prev, lastDay: today };
        }
        if (prev.lastWeek !== week) {
            tabs.forEach(tb => {
                if (tb.reset === 'weekly') tb.tasks.forEach(t => delete fresh[t.id]);
            });
            fresh._meta = { ...(fresh._meta || {}), lastWeek: week };
        }
        setDone(fresh);
        saveDone(fresh);
    }, []);

    const persistTabs = useCallback((next) => { setTabs(next); saveTabs(next); }, []);
    const persistDone = useCallback((next) => { setDone(next); saveDone(next); }, []);

    const toggleTask = (id) => {
        const next = { ...done, [id]: !done[id] };
        if (!next[id]) delete next[id];
        persistDone(next);
    };

    const verifyOwner = () => {
        if (ownerPin === '1609') { setIsOwner(true); setOwnerPin(''); setPinErr(false); }
        else { setPinErr(true); setOwnerPin(''); }
    };

    // ── Task management ──
    const addTask = () => {
        if (!newLabel.trim()) return;
        const nextTabs = tabs.map(tb =>
            tb.key === activeKey
                ? { ...tb, tasks: [...tb.tasks, { id: `t-${Date.now()}`, label: newLabel.trim() }] }
                : tb
        );
        persistTabs(nextTabs);
        setNewLabel(''); setShowAdd(false);
    };

    const removeTask = (taskId) => {
        const nextTabs = tabs.map(tb =>
            tb.key === activeKey
                ? { ...tb, tasks: tb.tasks.filter(t => t.id !== taskId) }
                : tb
        );
        const nextDone = { ...done }; delete nextDone[taskId];
        persistTabs(nextTabs); persistDone(nextDone);
    };

    // ── Tab management ──
    const startRenameTab = (tb) => { setEditingTabKey(tb.key); setEditingTabLabel(tb.label); };
    const saveRenameTab = () => {
        if (!editingTabLabel.trim()) { setEditingTabKey(null); return; }
        persistTabs(tabs.map(tb => tb.key === editingTabKey ? { ...tb, label: editingTabLabel.trim() } : tb));
        setEditingTabKey(null);
    };

    const deleteTab = (key) => {
        if (tabs.length <= 1) return;
        const next = tabs.filter(tb => tb.key !== key);
        persistTabs(next);
        if (activeKey === key) setActiveKey(next[0].key);
    };

    const addTab = () => {
        if (!newTabLabel.trim()) return;
        const key = `tab-${Date.now()}`;
        persistTabs([...tabs, { key, label: newTabLabel.trim(), emoji: '📋', accent: 'text-gray-400', reset: 'daily', tasks: [] }]);
        setActiveKey(key);
        setNewTabLabel(''); setShowAddTab(false);
    };

    const activeTab = tabs.find(tb => tb.key === activeKey) || tabs[0];
    const tasks = activeTab?.tasks || [];
    const doneN = tasks.filter(t => done[t.id]).length;
    const pct = tasks.length ? Math.round(doneN / tasks.length * 100) : 0;

    return (
        <div className="space-y-4">
            <GlassCard>
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><ClipboardList size={18} /></div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white">Crew Checklist</h2>
                            <p className="text-[10px] text-gray-600">
                                {activeTab?.reset === 'weekly' ? '↺ Reset otomatis setiap minggu' : '↺ Reset otomatis setiap hari'}
                            </p>
                        </div>
                    </div>
                    {!isOwner ? (
                        <div className="flex gap-2 items-center">
                            <input type="password" placeholder="Owner PIN" value={ownerPin}
                                onChange={e => { setOwnerPin(e.target.value); setPinErr(false); }}
                                onKeyDown={e => e.key === 'Enter' && verifyOwner()}
                                className={`w-24 h-8 bg-black/30 border rounded-lg px-2 text-white text-center text-sm outline-none focus:border-primary ${pinErr ? 'border-red-500' : 'border-white/10'}`} />
                            <button onClick={verifyOwner} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-gray-900 dark:text-white transition-colors">
                                <Lock size={16} />
                            </button>
                            {pinErr && <span className="text-xs text-red-400">PIN salah</span>}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-green-400 font-bold">● Owner Mode</span>
                            <button onClick={() => setShowAdd(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors">
                                <Plus size={13} /> Tambah Task
                            </button>
                            <button onClick={() => setShowAddTab(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-white/8 hover:bg-white/12 text-gray-300 rounded-xl text-xs font-bold transition-colors border border-white/10">
                                <Plus size={13} /> Tab Baru
                            </button>
                            <button onClick={() => setIsOwner(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-600 hover:text-gray-300">
                                <Lock size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Shift tabs */}
                <div className="px-5 pt-4 flex gap-2 flex-wrap items-center">
                    {tabs.map((tb) => {
                        const doneCount = tb.tasks.filter(t => done[t.id]).length;
                        const isActive = activeKey === tb.key;
                        const isEditing = isOwner && editingTabKey === tb.key;
                        return (
                            <div key={tb.key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isActive ? 'bg-primary text-white border-primary' : 'text-gray-400 border-white/10 hover:text-white bg-white/3'}`}>
                                {isEditing ? (
                                    <input autoFocus value={editingTabLabel} onChange={e => setEditingTabLabel(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveRenameTab(); if (e.key === 'Escape') setEditingTabKey(null); }}
                                        onBlur={saveRenameTab}
                                        className="bg-transparent outline-none w-24 text-gray-900 dark:text-white font-bold text-xs" />
                                ) : (
                                    <button onClick={() => setActiveKey(tb.key)} className="flex items-center gap-1.5">
                                        {tb.emoji} {tb.label}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-white/8'}`}>{doneCount}/{tb.tasks.length}</span>
                                    </button>
                                )}
                                {/* Owner controls on tab */}
                                {isOwner && !isEditing && (
                                    <div className="flex items-center gap-0.5 ml-1">
                                        <button onClick={() => startRenameTab(tb)}
                                            className={`p-0.5 rounded hover:bg-white/20 transition-colors ${isActive ? 'text-white/60' : 'text-gray-600'}`}
                                            title="Rename tab">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        </button>
                                        {tabs.length > 1 && (
                                            <button onClick={() => deleteTab(tb.key)}
                                                className="p-0.5 rounded hover:bg-red-500/20 text-red-500/60 hover:text-red-400 transition-colors"
                                                title="Hapus tab">
                                                <Trash2 size={10} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Progress bar */}
                <div className="px-5 pt-3 pb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                        <span className={activeTab?.accent}>{activeTab?.emoji} {activeTab?.label}</span>
                        <span className="font-mono">{doneN}/{tasks.length} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                </div>

                {/* Task list */}
                <div className="divide-y divide-white/5 pb-2">
                    {tasks.map(t => (
                        <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 group">
                            <button onClick={() => toggleTask(t.id)}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${done[t.id] ? 'bg-primary border-primary' : 'border-white/20 hover:border-primary/50'}`}>
                                {done[t.id] && <Check size={11} className="text-gray-900 dark:text-white" />}
                            </button>
                            <span className={`flex-1 text-sm leading-snug transition-colors ${done[t.id] ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                                {t.label}
                            </span>
                            {/* Owner: trash on ALL tasks */}
                            {isOwner && (
                                <button onClick={() => removeTask(t.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <p className="px-5 py-8 text-center text-xs text-gray-700">
                            {isOwner ? 'Belum ada task — klik "Tambah Task" untuk mulai' : 'Belum ada task'}
                        </p>
                    )}
                </div>
            </GlassCard>

            {/* Add Task Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
                    <div className="w-full max-w-sm rounded-2xl p-6 bg-[#0a0a0a] border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Tambah Task</h3>
                            <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-gray-900 dark:text-white"><X size={18} /></button>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">Tab: <span className="text-gray-900 dark:text-white font-bold">{activeTab?.label}</span></p>
                        <input autoFocus type="text" placeholder="Deskripsi task..." value={newLabel}
                            onChange={e => setNewLabel(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTask()}
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary placeholder-gray-700 mb-4" />
                        <div className="flex gap-3">
                            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/8">Batal</button>
                            <button onClick={addTask} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-red-700 shadow-lg shadow-primary/20">Tambah</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Tab Modal */}
            {showAddTab && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
                    <div className="w-full max-w-sm rounded-2xl p-6 bg-[#0a0a0a] border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Tambah Tab Baru</h3>
                            <button onClick={() => setShowAddTab(false)} className="text-gray-500 hover:text-gray-900 dark:text-white"><X size={18} /></button>
                        </div>
                        <input autoFocus type="text" placeholder="Nama tab (misal: Inventaris)" value={newTabLabel}
                            onChange={e => setNewTabLabel(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTab()}
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary placeholder-gray-700 mb-4" />
                        <div className="flex gap-3">
                            <button onClick={() => setShowAddTab(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/8">Batal</button>
                            <button onClick={addTab} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-red-700 shadow-lg shadow-primary/20">Buat Tab</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
/* ── SHIFT CONFIG (same logic as AbsensiModule) ──── */
const DASHBOARD_SHIFTS = {
    weekday_full: { label: 'Weekday', sub: 'Senin – Kamis', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400' },
    weekend_shift1: { label: 'Weekend Shift 1', sub: 'Jumat – Minggu · 09–15', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
    weekend_shift2: { label: 'Weekend Shift 2', sub: 'Jumat – Minggu · 15–21', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-400' },
    weekend_full: { label: 'Weekend Full', sub: 'Jumat – Minggu · Full', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', dot: 'bg-green-400 animate-pulse' },
};

const getActiveShift = (now) => {
    const day = now.getDay();   // 0=Sun,1=Mon,...,6=Sat
    const hour = now.getHours();
    const isWeekend = day === 0 || day >= 5; // Fri/Sat/Sun
    if (!isWeekend) return 'weekday_full';
    if (hour < 15) return 'weekend_shift1';
    return 'weekend_shift2';
};

/* ── LIVE CLOCK HEADER ──────────────────────────── */
const LiveClockHeader = () => {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const shiftKey = getActiveShift(now);
    const shift = DASHBOARD_SHIFTS[shiftKey];

    return (
        <div className="flex items-center gap-4">
            <div>
                <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{timeStr}</span>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-black ${shift.bg} ${shift.border} ${shift.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${shift.dot}`} />
                        {shift.label}
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{dateStr} <span className="text-gray-700">· {shift.sub}</span></p>
            </div>
        </div>
    );
};


/* ── MAIN PAGE ──────────────────────────────────── */
const Dashboard = () => {
    const [tab, setTab] = useState('checklist');

    const tabs = [
        { key: 'bookings', icon: <CalendarDays size={15} />, label: 'Bookings' },
        { key: 'checklist', icon: <ClipboardList size={15} />, label: 'Checklist' },
    ];

    return (
        <div className="p-6 pb-16 max-w-4xl mx-auto">
            {/* Live Clock Header */}
            <div className="mb-6">
                <LiveClockHeader />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t.key ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-gray-400 hover:text-white'}`}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {tab === 'bookings' && <BookingsTab />}
            {tab === 'checklist' && <ChecklistTab />}
        </div>
    );
};

export default Dashboard;
