import React, { useState, useMemo, useRef } from 'react';
import {
    Lock, DollarSign, TrendingUp, TrendingDown, CreditCard,
    Users, Calendar, ChevronLeft, ChevronRight, Download,
    Plus, X, Check, Edit3, FileText, UserMinus,
    Wallet, BarChart2, Printer, User, Monitor, Trash2, Upload
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import Papa from 'papaparse';
import { useFinance, computeBonus } from '../../context/FinanceContext';
import { supabase } from '../../lib/supabase';

/* ─── Design tokens ─────────────────────────────────────────────── */
const GC = ({ children, className = '', style = {} }) => (
    <div className={`rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/5 shadow-xl ${className}`} style={style}>{children}</div>
);

const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const fmtK = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}jt` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n || 0);

const CAT_STYLE = {
    Booking: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    OTS: 'bg-amber-500/15  text-amber-400  border-amber-500/30',
    Expense: 'bg-red-500/15    text-red-400    border-red-500/30',
    Operational: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Supplies: 'bg-blue-500/15   text-blue-400   border-blue-500/30',
    Salary: 'bg-green-500/15  text-green-400  border-green-500/30',
    Owner: 'bg-gray-500/15   text-gray-400   border-gray-500/30',
    Etc: 'bg-gray-500/15   text-gray-400   border-gray-500/30',
};

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const SHIFT_OPTS = [
    { value: 'weekday_full', label: 'Weekday Full Time (Senin–Kamis)' },
    { value: 'weekend_shift1', label: 'Weekend Shift 1 / 09–15 (Jumat–Minggu)' },
    { value: 'weekend_shift2', label: 'Weekend Shift 2 / 15–21 (Jumat–Minggu)' },
    { value: 'weekend_full', label: 'Weekend Full Time (Jumat–Minggu)' },
    { value: 'intern', label: 'Intern' },
];

/* ── Past Data (CSV) Modal ─────────────────────────────── */
const PastDataModal = ({ onClose, onSave }) => {
    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data;
                let txCount = 0;
                let attCount = 0;

                // Loop setiap baris CSV
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const date = row['Tanggal']?.trim();
                    if (!date) continue;

                    // 1. PROSES DATA KEUANGAN (TRANSACTIONS)
                    const cash = parseInt(row['Cash']) || 0;
                    const qris = parseInt(row['QRIS']) || 0;
                    const expenses = parseInt(row['Pengeluaran']) || 0;
                    const notes = row['Catatan Pengeluaran']?.trim() || '';

                    if (cash > 0) {
                        onSave({ id: `HIS-${Date.now()}-${i}-C`, time: '00:00', date, desc: `[CSV] Cash`, type: 'IN', category: 'OTS', amount: cash, method: 'CASH' });
                        txCount++;
                    }
                    if (qris > 0) {
                        onSave({ id: `HIS-${Date.now()}-${i}-Q`, time: '00:00', date, desc: `[CSV] QRIS`, type: 'IN', category: 'OTS', amount: qris, method: 'QRIS' });
                        txCount++;
                    }
                    if (expenses > 0) {
                        onSave({ id: `HIS-${Date.now()}-${i}-E`, time: '00:00', date, desc: `Expense${notes ? ': ' + notes : ''}`, type: 'OUT', category: 'Expense', amount: expenses, method: 'CASH' });
                        txCount++;
                    }

                    // 2. PROSES DATA HRD (ATTENDANCE)
                    const processCrewAttendance = async (crewKey, shiftKey, lateKey) => {
                        const crewIdStr = row[crewKey]?.trim();
                        if (!crewIdStr) return; // Ignore if Crew field is empty

                        const crewId = parseInt(crewIdStr) || 0;
                        const shiftCount = parseInt(row[shiftKey]) || 1;
                        const lateMinutes = parseInt(row[lateKey]) || 0;

                        // Create dummy timestamp using the Tanggal
                        const dummyCheckIn = new Date(`${date}T09:00:00`).toISOString();

                        try {
                            const { error: attError } = await supabase.from('attendance').insert([{
                                user_id: crewId,
                                check_in: dummyCheckIn,
                                status: 'completed', // Langsung selesai
                                shift_count: shiftCount,
                                late_minutes: lateMinutes
                            }]);

                            if (attError) throw attError;
                            attCount++;

                        } catch (err) {
                            console.error(`Gagal insert attendance untuk ${crewKey} pada ${date}:`, err);
                        }
                    };

                    await processCrewAttendance('Crew_1', 'Shift_1', 'Telat_1');
                    await processCrewAttendance('Crew_2', 'Shift_2', 'Telat_2');
                }

                alert(`Berhasil import ${txCount} transaksi dan ${attCount} record absensi HRD.`);
                onClose();
            },
            error: (error) => {
                console.error("Gagal membaca CSV:", error);
                alert("Format CSV tidak valid atau gagal dibaca.");
            }
        });
    };

    const downloadTemplate = () => {
        const template = 'Tanggal,Cash,QRIS,Pengeluaran,Catatan Pengeluaran,Crew_1,Shift_1,Telat_1,Crew_2,Shift_2,Telat_2\n2024-01-15,100000,50000,20000,Beli Kertas,1,1,0,2,1,15';
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([template], { type: 'text/csv' })), download: 'Template_Mera_Finance_HRD.csv' });
        a.click();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <div className="w-full max-w-md rounded-3xl p-7 bg-[#0a0a0a] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9)]">
                <div className="flex justify-between items-center mb-5">
                    <div><h3 className="text-xl font-black text-gray-900 dark:text-white">Input Data Lama (CSV)</h3><p className="text-xs text-gray-600 mt-0.5">Import transaksi dari file CSV</p></div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-gray-600 hover:text-gray-900 dark:text-white"><X size={18} /></button>
                </div>

                <div className="space-y-4">
                    <button onClick={downloadTemplate} className="w-full py-3 rounded-2xl bg-white/5 text-blue-400 font-bold hover:bg-white/10 flex items-center justify-center gap-2">
                        <Download size={16} /> Download Template CSV
                    </button>

                    <div className="relative w-full">
                        <input type="file" accept=".csv" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="w-full bg-black/40 border border-dashed border-white/20 rounded-xl px-4 py-8 text-center text-white transition-colors hover:border-primary">
                            <Monitor size={24} className="mx-auto mb-2 text-gray-500" />
                            <p className="text-sm font-bold">Pilih atau Tarik File CSV Kesini</p>
                            <p className="text-xs text-gray-500 mt-1">Pastikan format sesuai template</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="w-full py-3 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/8">Batal</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   PIN SCREEN
══════════════════════════════════════════════════════════════════ */
const PinScreen = ({ onUnlock }) => {
    const [pin, setPin] = useState('');
    const [err, setErr] = useState(false);
    const [shake, setShake] = useState(false);

    const tryPin = (p) => {
        if (p === '1609') { onUnlock(); return; }
        setErr(true); setShake(true); setPin('');
        setTimeout(() => setShake(false), 500);
    };

    const press = (d) => {
        if (pin.length >= 4) return;
        setErr(false);
        const next = pin + d;
        setPin(next);
        if (next.length === 4) setTimeout(() => tryPin(next), 150);
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className={`w-80 rounded-3xl p-8 text-center bg-[#0a0a0a] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9)] ${shake ? 'animate-bounce' : ''}`}>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                    <Lock size={26} className="text-primary" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Finance</h2>
                <p className="text-xs text-gray-600 mb-7">Masukkan PIN untuk akses</p>
                <div className="flex justify-center gap-3 mb-2">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${i < pin.length ? (err ? 'bg-red-500 scale-110' : 'bg-primary scale-110') : 'bg-white/10'}`} />
                    ))}
                </div>
                {err && <p className="text-red-400 text-xs mb-3 font-bold">PIN Salah</p>}
                {!err && <div className="mb-3 h-5" />}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d, i) => (
                        <button key={i}
                            onClick={() => d === '⌫' ? setPin(p => p.slice(0, -1)) : d !== '' && press(String(d))}
                            className={`h-14 rounded-2xl font-bold text-xl transition-all active:scale-90 ${d === '' ? 'invisible' : 'text-white bg-black/30 hover:bg-white/8 active:bg-white/15 border border-white/5'}`}>
                            {d}
                        </button>
                    ))}
                </div>
                <button onClick={() => tryPin(pin)} disabled={pin.length < 4}
                    className="w-full py-3 bg-primary hover:bg-red-700 text-white font-bold rounded-2xl transition-all disabled:opacity-30">
                    Masuk
                </button>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   TAB — REKAP HARIAN  (simplified: 6 KPI cards only)
══════════════════════════════════════════════════════════════════ */
const KPICard = ({ label, value, sub, icon: Icon, color, bg }) => (
    <GC className="p-4 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
            <Icon size={18} />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-base font-black text-gray-900 dark:text-white truncate">{fmt(value)}</p>
            {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
        </div>
    </GC>
);

const CountCard = ({ label, value, color, icon: Icon, bg }) => (
    <GC className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
            <Icon size={18} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-gray-600">sesi</p>
        </div>
    </GC>
);

const HarianTab = ({ transactions }) => {
    const today = new Date();
    const [date, setDate] = useState(today.toISOString().slice(0, 10));

    const stepDate = (n) => {
        const d = new Date(date);
        d.setDate(d.getDate() + n);
        setDate(d.toISOString().slice(0, 10));
    };
    const isToday = date === today.toISOString().slice(0, 10);

    const dayTx = useMemo(() =>
        transactions.filter(t => isToday ? (!t.date || t.date === date) : t.date === date),
        [transactions, date, isToday]);

    const dayRev = dayTx.filter(t => t.type === 'IN').reduce((a, t) => a + t.amount, 0);
    const dayExp = dayTx.filter(t => t.type === 'OUT' && t.category !== 'Salary').reduce((a, t) => a + t.amount, 0);
    const dayCash = dayTx.filter(t => t.type === 'IN' && t.method === 'CASH').reduce((a, t) => a + t.amount, 0);
    const dayQris = dayTx.filter(t => t.type === 'IN' && t.method === 'QRIS').reduce((a, t) => a + t.amount, 0);
    const dayBooking = dayTx.filter(t => t.category === 'Booking').length;
    const dayOTS = dayTx.filter(t => t.category === 'OTS').length;

    const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('id-ID',
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const kpis = [
        { label: 'Revenue', val: dayRev, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Cash', val: dayCash, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { label: 'QRIS', val: dayQris, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { label: 'Pengeluaran', val: dayExp, color: 'text-red-400', bg: 'bg-red-500/10' },
    ];

    return (
        <div className="space-y-3">
            {/* Date Navigator — compact */}
            <GC className="flex items-center justify-between px-4 py-2.5">
                <button onClick={() => stepDate(-1)} className="p-1.5 rounded-lg hover:bg-white/6 text-gray-400 hover:text-gray-900 dark:text-white transition-all">
                    <ChevronLeft size={16} />
                </button>
                <div className="text-center">
                    <p className="font-black text-gray-900 dark:text-white text-sm">{displayDate}</p>
                    {isToday && <span className="text-[10px] text-primary font-bold uppercase tracking-wider">● Hari Ini</span>}
                </div>
                <button onClick={() => stepDate(1)} disabled={isToday}
                    className="p-1.5 rounded-lg hover:bg-white/6 text-gray-400 hover:text-gray-900 dark:text-white transition-all disabled:opacity-20">
                    <ChevronRight size={16} />
                </button>
            </GC>

            {/* 4 KPIs — compact horizontal strip */}
            <div className="grid grid-cols-4 gap-2">
                {kpis.map(k => (
                    <GC key={k.label} className="p-3">
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${k.color}`}>{k.label}</p>
                        <p className="text-base font-black text-gray-900 dark:text-white leading-none">{fmtK(k.val)}</p>
                        <p className="text-[9px] text-gray-600 mt-0.5">{fmt(k.val)}</p>
                    </GC>
                ))}
            </div>

            {/* Booking / OTS pills */}
            <GC className="px-4 py-3 flex items-center gap-4">
                <span className="text-xs text-gray-600">Sesi hari ini:</span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/15 text-purple-400 border border-purple-500/20">
                    📸 Booking: {dayBooking}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    🚶 OTS: {dayOTS}
                </span>
                {dayTx.length === 0 && (
                    <span className="text-xs text-gray-700 ml-auto">Belum ada transaksi</span>
                )}
            </GC>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   EXPENSE MODAL
══════════════════════════════════════════════════════════════════ */
const ExpenseModal = ({ onClose, onSave }) => {
    const [form, setForm] = useState({ desc: '', amount: '', category: 'Operational', payment: 'CASH' });
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const submit = e => {
        e.preventDefault();
        if (!form.desc || !form.amount) return;
        onSave({ desc: form.desc, amount: parseInt(form.amount), category: form.category, payment: form.payment });
        onClose();
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <div className="w-full max-w-md rounded-3xl p-7 bg-[#0a0a0a] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9)]">
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Catat Pengeluaran</h3>
                        <p className="text-xs text-gray-600 mt-0.5">Tambahkan biaya operasional</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-gray-600 hover:text-gray-900 dark:text-white"><X size={18} /></button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Nama Item</label>
                        <input required type="text" placeholder="Contoh: Kertas Foto" value={form.desc} onChange={set('desc')}
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary placeholder-gray-700" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Jumlah (Rp)</label>
                        <input required type="number" placeholder="0" min="0" value={form.amount} onChange={set('amount')}
                            className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary placeholder-gray-700" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Kategori</label>
                            <select value={form.category} onChange={set('category')}
                                className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-primary">
                                {['Operational', 'Supplies', 'Salary', 'Owner', 'Etc'].map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Metode</label>
                            <select value={form.payment} onChange={set('payment')}
                                className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-primary">
                                <option value="CASH">Cash</option>
                                <option value="QRIS">QRIS</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/8">Batal</button>
                        <button type="submit" className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-red-700 shadow-lg shadow-primary/20">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   TAB — REKAP BULANAN
══════════════════════════════════════════════════════════════════ */
const BulananTab = ({ transactions, addExpense }) => {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [showExp, setShowExp] = useState(false);

    const stepMonth = (n) => {
        let m = month + n, y = year;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        setMonth(m); setYear(y);
    };

    const perDay = useMemo(() => {
        const getPeriodDates = (y, m) => {
            const dates = [];
            const d = new Date(y, m - 1, 26);
            const end = new Date(y, m, 25);
            while (d <= end) {
                dates.push(d.toISOString().slice(0, 10));
                d.setDate(d.getDate() + 1);
            }
            return dates;
        };

        const activeDates = getPeriodDates(year, month);
        const days = [];

        // Initialize days
        activeDates.forEach(dateStr => {
            const dayNum = parseInt(dateStr.split('-')[2], 10);
            days.push({ date: dateStr, day: dayNum, rev: 0, exp: 0, net: 0, cash: 0, qris: 0 });
        });

        // Aggregate transactions
        const map = days.reduce((acc, curr) => ({ ...acc, [curr.date]: curr }), {});

        transactions.forEach(t => {
            const dKey = t.date;
            if (map[dKey]) {
                const amt = t.amount || 0;
                if (t.type === 'IN') {
                    map[dKey].rev += amt;
                    map[dKey].net += amt;
                    if (t.method === 'CASH') map[dKey].cash += amt;
                    else map[dKey].qris += amt;
                } else if (t.type === 'OUT' && t.category !== 'Salary') {
                    map[dKey].exp += amt;
                    map[dKey].net -= amt;
                }
            }
        });

        return Object.values(map);
    }, [year, month, transactions]);

    const totRev = perDay.reduce((a, d) => a + d.rev, 0);
    const totExp = perDay.reduce((a, d) => a + d.exp, 0);
    const totNet = totRev - totExp;
    const totCash = perDay.reduce((a, d) => a + d.cash, 0);
    const totQris = perDay.reduce((a, d) => a + d.qris, 0);

    /* Revenue mix pie */
    const pieData = [
        { name: 'Booking', value: Math.round(totRev * 0.4), color: '#a78bfa' },
        { name: 'OTS', value: Math.round(totRev * 0.6), color: '#fb923c' },
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(10,2,2,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {payload.map(e => <p key={e.name} style={{ color: e.payload.color }}>{e.name}: {fmtK(e.value)}</p>)}
            </div>
        );
    };

    /* Hari Terbaik */
    const best = useMemo(() => [...perDay].sort((a, b) => b.rev - a.rev).slice(0, 3), [perDay]);

    return (
        <div className="space-y-4">
            {/* Month nav + Expense button */}
            <div className="flex items-center gap-3">
                <GC className="flex items-center gap-2 flex-1 px-5 py-3.5">
                    <button onClick={() => stepMonth(-1)} className="p-2 rounded-xl hover:bg-white/6 text-gray-400 hover:text-gray-900 dark:text-white transition-all">
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex-1 text-center">
                        <p className="font-black text-gray-900 dark:text-white text-lg">{MONTH_NAMES[month]} {year}</p>
                        <p className="text-[10px] text-gray-600">{perDay.filter(d => d.rev > 0).length} hari operasional</p>
                    </div>
                    <button onClick={() => stepMonth(1)} className="p-2 rounded-xl hover:bg-white/6 text-gray-400 hover:text-gray-900 dark:text-white transition-all">
                        <ChevronRight size={18} />
                    </button>
                </GC>
                <button onClick={() => setShowExp(true)}
                    className="flex items-center gap-2 px-4 py-3.5 bg-primary hover:bg-red-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary/20 shrink-0">
                    <Plus size={16} /> Input Expenses
                </button>
            </div>

            {/* Monthly KPI — 5 metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Total Revenue', val: totRev, color: 'text-emerald-400' },
                    { label: 'Total Expense', val: totExp, color: 'text-red-400' },
                    { label: 'Total Cash', val: totCash, color: 'text-orange-400' },
                    { label: 'Total QRIS', val: totQris, color: 'text-purple-400' },
                    { label: 'Net Profit', val: totNet, color: totNet >= 0 ? 'text-blue-400' : 'text-red-400' },
                ].map(k => (
                    <GC key={k.label} className="p-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{k.label}</p>
                        <p className={`text-lg font-black ${k.color}`}>{fmtK(k.val)}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{fmt(k.val)}</p>
                    </GC>
                ))}
            </div>

            {/* Revenue Mix Pie + Hari Terbaik */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GC className="p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                        <BarChart2 size={15} className="text-purple-400" /> Revenue Mix
                    </h3>
                    <div className="flex items-center gap-4">
                        <PieChart width={110} height={110}>
                            <Pie data={pieData} cx={50} cy={50} innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={0}>
                                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                        <div className="space-y-3">
                            {pieData.map(d => (
                                <div key={d.name}>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                        <span className="text-xs text-gray-400">{d.name}</span>
                                    </div>
                                    <p className="text-sm font-black text-gray-900 dark:text-white ml-4">{fmt(d.value)}</p>
                                    <p className="text-[10px] text-gray-600 ml-4">{totRev ? Math.round(d.value / totRev * 100) : 0}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </GC>

                <GC className="p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                        <TrendingUp size={15} className="text-amber-400" /> Hari Terbaik
                    </h3>
                    <div className="space-y-3">
                        {best.map((d, i) => (
                            <div key={d.date} className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-500'}`}>{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-400">
                                        {new Date(d.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </p>
                                    <div className="h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${best[0].rev ? (d.rev / best[0].rev) * 100 : 0}%` }} />
                                    </div>
                                </div>
                                <p className="text-sm font-black text-gray-900 dark:text-white shrink-0">{fmtK(d.rev)}</p>
                            </div>
                        ))}
                    </div>
                </GC>
            </div>

            {/* Per-day table — now with Cash + QRIS columns */}
            <GC className="overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Rekap Per Hari</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                {['Tgl', 'Hari', 'Revenue', 'Cash', 'QRIS', 'Expense', 'Net'].map(h => (
                                    <th key={h} className="px-4 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/4">
                            {perDay.map(d => (
                                <tr key={d.date} className={`hover:bg-white/2 transition-colors ${d.rev === 0 ? 'opacity-40' : ''}`}>
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{String(d.day).padStart(2, '0')}</td>
                                    <td className="px-4 py-2.5 text-xs text-gray-400">
                                        {new Date(d.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short' })}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm font-bold text-emerald-400">{d.rev > 0 ? fmtK(d.rev) : '—'}</td>
                                    <td className="px-4 py-2.5 text-sm font-semibold text-orange-400">{d.cash > 0 ? fmtK(d.cash) : '—'}</td>
                                    <td className="px-4 py-2.5 text-sm font-semibold text-purple-400">{d.qris > 0 ? fmtK(d.qris) : '—'}</td>
                                    <td className="px-4 py-2.5 text-sm font-bold text-red-400">{d.exp > 0 ? fmtK(d.exp) : '—'}</td>
                                    <td className={`px-4 py-2.5 text-sm font-black ${d.net >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                        {d.rev > 0 ? fmtK(d.net) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-white/10">
                                <td colSpan={2} className="px-4 py-3 text-xs font-black text-gray-400 uppercase">Total</td>
                                <td className="px-4 py-3 text-sm font-black text-emerald-400">{fmtK(totRev)}</td>
                                <td className="px-4 py-3 text-sm font-black text-orange-400">{fmtK(totCash)}</td>
                                <td className="px-4 py-3 text-sm font-black text-purple-400">{fmtK(totQris)}</td>
                                <td className="px-4 py-3 text-sm font-black text-red-400">{fmtK(totExp)}</td>
                                <td className={`px-4 py-3 text-sm font-black ${totNet >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{fmtK(totNet)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </GC>

            {showExp && <ExpenseModal onClose={() => setShowExp(false)} onSave={addExpense} />}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   SLIP GAJI — print per crew
══════════════════════════════════════════════════════════════════ */
const SlipGaji = ({ crew, month, year }) => {
    const total = crew.totalBase + crew.totalBonus + crew.manualBonus - crew.totalDenda;
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    return (
        <div id={`slip-${crew.id}`} className="hidden-print p-6 bg-white text-black font-sans" style={{ width: '320px', fontSize: '12px', fontFamily: 'Arial,sans-serif' }}>
            <div className="text-center mb-4">
                <img src="/logo-mera-maroon.png" alt="Méra Logo" style={{ width: '120px', height: 'auto', margin: '0 auto 10px', display: 'block' }} />
                <p className="font-black text-lg m-0">MÉRA SELFSTUDIOS</p>
                <p className="text-[10px] text-gray-500 m-0">Slip Gaji Bulanan</p>
                <p className="text-[10px] text-gray-400 m-0 font-bold">{MONTH_NAMES[month]} {year}</p>
            </div>
            <hr className="my-2 border-t border-dashed border-gray-300" />
            <table className="w-full text-xs mb-3">
                <tbody>
                    <tr><td className="py-0.5 text-gray-500">Nama Crew</td><td className="font-bold text-right">{crew.name}</td></tr>
                    <tr><td className="py-0.5 text-gray-500">Posisi / Shift</td><td className="text-right">{crew.posisi}</td></tr>
                    <tr><td className="py-0.5 text-gray-500">Total Hari Kerja</td><td className="text-right">{crew.workDays} Hari</td></tr>
                    <tr><td className="py-0.5 text-gray-500">Tanggal Cetak</td><td className="text-right">{today}</td></tr>
                </tbody>
            </table>
            <hr className="my-2 border-t border-dashed border-gray-300" />
            <p className="font-bold text-xs mb-1">Rincian Pendapatan</p>
            <table className="w-full text-xs mb-2">
                <tbody>
                    <tr><td className="py-1">Gaji Pokok</td><td className="text-right font-bold w-1/2 justify-end"><span>Rp</span> {Number(crew.totalBase).toLocaleString('id-ID')}</td></tr>
                    {crew.totalBonus > 0 && <tr><td className="py-1 text-green-700">+ Bonus Omset</td><td className="text-right text-green-700 font-bold justify-end"><span>Rp</span> {Number(crew.totalBonus).toLocaleString('id-ID')}</td></tr>}
                    {crew.manualBonus > 0 && <tr><td className="py-1 text-green-700">+ Bonus Manual</td><td className="text-right text-green-700 font-bold justify-end"><span>Rp</span> {Number(crew.manualBonus).toLocaleString('id-ID')}</td></tr>}
                    {crew.totalDenda > 0 && <tr><td className="py-1 text-red-700">− Potongan / Denda</td><td className="text-right text-red-700 font-bold justify-end"><span>Rp</span> {Number(crew.totalDenda).toLocaleString('id-ID')}</td></tr>}
                </tbody>
            </table>
            <hr className="my-2 border-t border-dashed border-gray-300" />
            <div className="flex justify-between font-black text-sm pt-1">
                <span>TOTAL DITERIMA</span><span>{fmt(total)}</span>
            </div>
            <p className="text-[9px] text-gray-400 mt-5 pt-3 border-t border-gray-100 text-center font-bold">Diterbitkan oleh Méra Operating System 2026</p>
        </div>
    );
};

const downloadSlip = (crew, month, year) => {
    const total = crew.totalBase + crew.totalBonus + crew.manualBonus - crew.totalDenda;
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{font-family:Arial,sans-serif;font-size:12px;margin:0;padding:24px;width:300px;color:#111;}
.logo{display:block;margin:0 auto 10px;width:120px;height:auto;}
.header{text-align:center;margin-bottom:12px;}
.title{font-size:16px;font-weight:900;margin:0;} .sub{color:#666;font-size:10px;margin:2px 0 0;}
hr{margin:10px 0;border:none;border-top:1px dashed #ccc;}
table{width:100%;border-collapse:collapse;} td{padding:3px 0;}
.right{text-align:right;} .bold{font-weight:700;} .green{color:#166534;} .red{color:#991b1b;}
.section-title{font-weight:700;margin:0 0 4px;font-size:11px;}
.flex-val{display:flex;justify-content:space-between;padding-left:16px;}
.total-row{font-weight:900;font-size:14px;padding-top:6px;}
.footer{color:#888;font-size:9px;text-align:center;margin-top:20px;font-weight:bold;padding-top:10px;border-top:1px dashed #eee;}
</style></head><body>
<div class="header">
  <img src="/logo-mera-maroon.png" class="logo" alt="Mera Logo" onerror="this.style.display='none'" />
  <p class="title">MÉRA SELFSTUDIOS</p>
  <p class="sub">Slip Gaji Bulanan<br/><b>${MONTH_NAMES[month]} ${year}</b></p>
</div>
<hr/>
<table>
<tr><td style="color:#666">Nama Crew</td><td class="right bold">${crew.name}</td></tr>
<tr><td style="color:#666">Posisi / Shift</td><td class="right">${crew.posisi}</td></tr>
<tr><td style="color:#666">Total Hari Kerja</td><td class="right">${crew.workDays} Hari</td></tr>
<tr><td style="color:#666">Tanggal Cetak</td><td class="right">${today}</td></tr>
</table>
<hr/>
<p class="section-title">Rincian Pendapatan</p>
<table>
<tr><td>Gaji Pokok</td><td class="right bold"><div class="flex-val"><span>Rp</span><span>${Number(crew.totalBase).toLocaleString('id-ID')}</span></div></td></tr>
${crew.totalBonus > 0 ? `<tr><td class="green">+ Bonus Omset</td><td class="right bold green"><div class="flex-val"><span>Rp</span><span>${Number(crew.totalBonus).toLocaleString('id-ID')}</span></div></td></tr>` : ''}
${crew.manualBonus > 0 ? `<tr><td class="green">+ Bonus Manual</td><td class="right bold green"><div class="flex-val"><span>Rp</span><span>${Number(crew.manualBonus).toLocaleString('id-ID')}</span></div></td></tr>` : ''}
${crew.totalDenda > 0 ? `<tr><td class="red">− Potongan / Denda</td><td class="right bold red"><div class="flex-val"><span>Rp</span><span>${Number(crew.totalDenda).toLocaleString('id-ID')}</span></div></td></tr>` : ''}
</table>
<hr/>
<table><tr><td class="total-row">TOTAL DITERIMA</td><td class="total-row right">${fmt(total)}</td></tr></table>
<p class="footer">Diterbitkan oleh Méra Operating System 2026</p>
</body></html>`;
    const w = window.open('', '_blank', 'width=380,height=600');
    w.document.write(html);
    w.document.close();
    w.onload = () => { setTimeout(() => w.print(), 500); };
};

/* ══════════════════════════════════════════════════════════════════
   GAJI CREW TAB — Monthly Accumulation
══════════════════════════════════════════════════════════════════ */
const GajiTab = () => {
    const { crew, updateCrew, transactions, addCrew, removeCrew } = useFinance();
    const now = new Date();
    const [editing, setEditing] = useState(null);
    const [editVal, setEditVal] = useState('');
    const [month, setMonth] = useState(now.getMonth());
    const [year, setYear] = useState(now.getFullYear());

    // Crew form
    const [showAddCrew, setShowAddCrew] = useState(false);
    const [crewForm, setCrewForm] = useState({ name: '', posisi: 'Crew', status_gaji: 'PRO', shift: 'weekday_full', base: '' });

    const stepMonth = (n) => {
        let m = month + n, y = year;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        setMonth(m); setYear(y);
    };

    const startEdit = (id, field, val) => { setEditing({ id, field }); setEditVal(String(val)); };
    const saveEdit = () => {
        if (!editing) return;
        updateCrew(editing.id, editing.field, parseInt(editVal) || 0);
        setEditing(null);
    };
    const saveNewCrew = () => {
        if (!crewForm.name.trim()) return;
        addCrew({ name: crewForm.name.trim(), posisi: crewForm.posisi, status_gaji: crewForm.status_gaji, shift: crewForm.shift, base: parseInt(crewForm.base) || 0 });
        setShowAddCrew(false); setCrewForm({ name: '', posisi: 'Crew', status_gaji: 'PRO', shift: 'weekday_full', base: '' });
    };

    const inp = "bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-primary placeholder-gray-700";

    // Per-day revenue map spanning from PrevMonth 26th -> CurrentMonth 25th
    const getPeriodDates = (y, m) => {
        const dates = [];
        const d = new Date(y, m - 1, 26); // Start 26th of previous month
        const end = new Date(y, m, 25);   // End 25th of current month
        while (d <= end) {
            dates.push(d.toISOString().slice(0, 10));
            d.setDate(d.getDate() + 1);
        }
        return dates;
    };

    const dailyRevenue = useMemo(() => {
        const activeDates = getPeriodDates(year, month);
        const map = {};
        transactions.forEach(t => {
            if (t.type !== 'IN' || !t.date) return;
            // Only aggregate if transaction date falls within the 26th-25th window
            if (activeDates.includes(t.date)) {
                map[t.date] = (map[t.date] || 0) + t.amount;
            }
        });
        return map;
    }, [transactions, month, year]);

    const isWeekendDay = (dateStr) => { const d = new Date(dateStr + 'T00:00:00'); return d.getDay() === 0 || d.getDay() === 6; };

    // Compute monthly totals per crew (26th to 25th)
    const crewStats = useMemo(() => {
        const activeDates = getPeriodDates(year, month);

        return crew.map(c => {
            if (c.status_gaji === 'INTERN') {
                return { ...c, workDays: 0, totalBase: 0, totalBonus: 0, manualBonus: 0, total: 0 };
            }
            const shiftIsWeekend = c.shift?.includes('weekend');
            let workDays = 0, totalBonus = 0;

            activeDates.forEach(ds => {
                // If the studio had no transactions/revenue on this day, we don't count it as a workday
                const isOperational = (dailyRevenue[ds] > 0);
                if (!isOperational) return;

                const activeCrewsToday = crew.filter(other => {
                    if (other.status_gaji === 'INTERN') return false;
                    const isOtherWeekendShift = other.shift?.includes('weekend');
                    return isOtherWeekendShift ? isWeekendDay(ds) : !isWeekendDay(ds);
                }).length;

                const weekend = isWeekendDay(ds);
                if (shiftIsWeekend ? !weekend : weekend) return; // continue equivalent

                workDays++;
                totalBonus += computeBonus(dailyRevenue[ds] || 0, weekend, activeCrewsToday);
            });

            const totalBase = (c.base || 0) * workDays;
            const manualBonus = c.bonus || 0;
            const totalDenda = c.denda || 0;
            return { ...c, workDays, totalBase, totalBonus, manualBonus, totalDenda, total: totalBase + totalBonus + manualBonus - totalDenda };
        });
    }, [crew, dailyRevenue, month, year]);

    const totalGaji = crewStats.filter(c => c.status_gaji !== 'INTERN').reduce((s, c) => s + c.total, 0);
    const payDate = `25 ${MONTH_NAMES[month]} ${year}`;

    const EditCell = ({ c, field, color }) => {
        const isEd = editing?.id === c.id && editing?.field === field;
        const val = c[field] || 0;
        if (isEd) return (
            <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                    <input autoFocus type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit()}
                        className="w-20 bg-black/60 border border-primary rounded-lg px-2 py-1 text-white text-xs outline-none" />
                    <button onClick={saveEdit} className="text-green-400 hover:text-green-300"><Check size={13} /></button>
                </div>
            </td>
        );
        return (
            <td className={`px-3 py-3 text-sm font-bold ${color} cursor-pointer hover:opacity-60 group`}
                onClick={() => startEdit(c.id, field, val)}>
                {field === 'bonus' ? '+' : '−'}{(val / 1000).toFixed(0)}k
                <Edit3 size={10} className="inline ml-1 opacity-0 group-hover:opacity-50" />
            </td>
        );
    };

    return (
        <div className="space-y-4">
            {/* Period + Pay Date */}
            <GC className="flex items-center justify-between px-5 py-3.5">
                <button onClick={() => stepMonth(-1)} className="p-2 rounded-xl hover:bg-white/6 text-gray-400 hover:text-gray-900 dark:text-white transition-all"><ChevronLeft size={18} /></button>
                <div className="text-center">
                    <p className="font-black text-gray-900 dark:text-white text-lg">{MONTH_NAMES[month]} {year}</p>
                    <p className="text-[10px] font-bold text-amber-400">💰 Gajian: {payDate}</p>
                </div>
                <button onClick={() => stepMonth(1)} className="p-2 rounded-xl hover:bg-white/6 text-gray-400 hover:text-gray-900 dark:text-white transition-all"><ChevronRight size={18} /></button>
            </GC>

            <div className="flex justify-end mb-2">
                <button onClick={() => setShowAddCrew(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-primary/20">
                    <Plus size={12} /> Tambah Crew Baru
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
                <GC className="p-4">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Crew Aktif</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{crewStats.filter(c => c.status_gaji !== 'INTERN').length}</p>
                    <p className="text-[10px] text-gray-600">orang</p>
                </GC>
                <GC className="p-4">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Gaji</p>
                    <p className="text-xl font-black text-emerald-400">{fmtK(totalGaji)}</p>
                    <p className="text-[10px] text-gray-600">{fmt(totalGaji)}</p>
                </GC>
                <GC className="p-4">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Bonus dari Omset</p>
                    <p className="text-xl font-black text-green-400">{fmtK(crewStats.reduce((s, c) => s + (c.totalBonus || 0), 0))}</p>
                    <p className="text-[10px] text-gray-600">akumulasi bulan ini</p>
                </GC>
            </div>

            {/* Table */}
            <GC className="overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2"><Users size={15} className="text-green-400" /> Gaji Bulanan</h3>
                    <p className="text-[10px] text-gray-600">Base×Hari + BonusOmset + BonusManual − Denda</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                {['Crew', 'Hari', 'Base Total', 'Bonus Omset', '+Manual', '−Denda', 'Total', 'Aksi'].map(h => (
                                    <th key={h} className="px-3 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/4">
                            {crewStats.map(c => {
                                const intern = c.status_gaji === 'INTERN';
                                return (
                                    <tr key={c.id} className={`hover:bg-white/2 transition-colors ${intern ? 'opacity-40' : ''}`}>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black flex items-center justify-center shrink-0">
                                                    {c.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{c.name}</p>
                                                    <p className="text-[10px] text-gray-600">{c.posisi}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-gray-500">{intern ? '—' : `${c.workDays}h`}</td>
                                        <td className="px-3 py-3 text-sm text-gray-300 font-semibold">{intern ? '—' : fmt(c.totalBase)}</td>
                                        <td className="px-3 py-3 text-sm font-bold text-green-400">{intern ? '—' : (c.totalBonus > 0 ? `+${fmtK(c.totalBonus)}` : '0')}</td>
                                        <EditCell c={c} field="bonus" color="text-blue-400" />
                                        <EditCell c={c} field="denda" color="text-red-400" />
                                        <td className="px-3 py-3 text-sm font-black text-gray-900 dark:text-white">{intern ? '—' : fmt(c.total)}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1">
                                                {!intern && (
                                                    <button onClick={() => downloadSlip(c, month, year)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-400 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all">
                                                        <Printer size={11} /> Cetak
                                                    </button>
                                                )}
                                                <button onClick={() => { if (window.confirm(`Tandai crew ${c.name} sebagai Resigned? (Histori Gaji tetap aman)`)) updateCrew(c.id, 'status_gaji', 'RESIGNED'); }}
                                                    className="p-1.5 text-orange-500/50 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all" title="Resign Crew">
                                                    <UserMinus size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-white/10">
                                <td colSpan={5} className="px-3 py-3 text-xs font-black text-gray-400 uppercase">Total Pengeluaran Gaji</td>
                                <td colSpan={3} className="px-3 py-3 text-sm font-black text-emerald-400">{fmt(totalGaji)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </GC>

            <GC className="p-5 flex items-center justify-between">
                <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">Cetak Semua Slip Gaji</p>
                    <p className="text-xs text-gray-600 mt-0.5">Download slip semua crew aktif</p>
                </div>
                <button onClick={() => crewStats.filter(c => c.status_gaji !== 'INTERN').forEach((c, i) => setTimeout(() => downloadSlip(c, month, year), i * 400))}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-red-700 transition-all shadow-lg shadow-primary/20">
                    <Download size={15} /> Cetak Semua
                </button>
            </GC>

            {/* Add Crew Modal */}
            {showAddCrew && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
                    <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: 'rgba(14,2,3,0.98)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 40px 80px rgba(0,0,0,0.9)' }}>
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Tambah Crew Baru</h3>
                            <button onClick={() => setShowAddCrew(false)} className="text-gray-500 hover:text-gray-900 dark:text-white"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Nama</label>
                                <input placeholder="Nama crew..." value={crewForm.name} onChange={e => setCrewForm(f => ({ ...f, name: e.target.value }))} className={`w-full ${inp}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Posisi</label>
                                    <select value={crewForm.posisi} onChange={e => {
                                        const p = e.target.value;
                                        setCrewForm(f => ({ ...f, posisi: p, status_gaji: p === 'Intern' ? 'INTERN' : 'PRO', shift: p === 'Intern' ? 'intern' : f.shift }));
                                    }} className={`w-full ${inp}`}>
                                        <option value="Crew">Crew</option>
                                        <option value="Intern">Intern</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Shift</label>
                                    <select value={crewForm.shift} onChange={e => setCrewForm(f => ({ ...f, shift: e.target.value }))} className={`w-full ${inp}`} disabled={crewForm.posisi === 'Intern'}>
                                        {SHIFT_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            {crewForm.posisi !== 'Intern' && (
                                <div>
                                    <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Gaji per Hari (Rp)</label>
                                    <input type="number" placeholder="75000" min={0} step={5000} value={crewForm.base} onChange={e => setCrewForm(f => ({ ...f, base: e.target.value }))} className={`w-full ${inp}`} />
                                    <p className="text-[10px] text-gray-600 mt-1">Otomatis dikalikan hari kerja di Finance › Gaji Crew</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowAddCrew(false)} className="flex-1 py-3 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/8">Batal</button>
                            <button onClick={saveNewCrew} className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-red-700 shadow-lg shadow-primary/20">Simpan Crew</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════════════════════════ */
const FinanceModule = () => {
    const { stats, transactions, addExpense, addTransaction } = useFinance();
    const [unlocked, setUnlocked] = useState(false);
    const [tab, setTab] = useState('harian');
    const [showPast, setShowPast] = useState(false);

    const exportCSV = () => {
        const rows = ['ID,Waktu,Tanggal,Deskripsi,Tipe,Kategori,Metode,Jumlah',
            ...transactions.map(t => `${t.id},${t.time},${t.date || ''},"${t.desc}",${t.type},${t.category},${t.method},${t.amount}`)].join('\n');
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([rows], { type: 'text/csv' })), download: `finance-${new Date().toISOString().slice(0, 10)}.csv` });
        a.click();
    };

    if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />;

    const tabs = [
        { key: 'harian', icon: <Calendar size={15} />, label: 'Rekap Harian' },
        { key: 'bulanan', icon: <BarChart2 size={15} />, label: 'Rekap Bulanan' },
        { key: 'gaji', icon: <Users size={15} />, label: 'Gaji Crew' },
    ];

    return (
        <div className="p-5 pb-20 max-w-screen-xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Wallet size={20} className="text-primary" /> Finance
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full text-green-400"
                            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            ● Unlocked
                        </span>
                    </h1>
                    <p className="text-xs text-gray-600 mt-0.5">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowPast(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-400 hover:bg-blue-900/20 transition-all border border-blue-500/20 bg-blue-500/5">
                        <Upload size={13} /> Upload Lama
                    </button>
                    <button onClick={exportCSV}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:bg-emerald-900/20 transition-all border border-emerald-500/20 bg-emerald-500/5">
                        <Download size={13} /> Export CSV
                    </button>
                    <button onClick={() => setUnlocked(false)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-900/20 transition-all">
                        <Lock size={13} /> Lock
                    </button>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t.key ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-gray-400 hover:text-white'}`}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {tab === 'harian' && <HarianTab transactions={transactions} />}
            {tab === 'bulanan' && <BulananTab transactions={transactions} addExpense={addExpense} />}
            {tab === 'gaji' && <GajiTab />}

            {showPast && <PastDataModal onClose={() => setShowPast(false)} onSave={addTransaction} />}
        </div>
    );
};

export default FinanceModule;
