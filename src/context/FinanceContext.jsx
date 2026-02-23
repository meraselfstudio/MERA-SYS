import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
/* ─── Storage Keys ─────────────────────────────────── */
const KEYS = {
    transactions: 'mera_transactions',
    expenses: 'mera_expenses',
    bookings: 'mera_bookings',
    crew: 'mera_crew',
    products: 'mera_products',
};

/* ─── Crew from crew.csv ───────────────────────────── */
export const INIT_CREW = [
    { id: 1, name: 'Satria', posisi: 'Crew', status_gaji: 'PRO', shift: 'weekday_full', base: 75000, denda: 0 },
    { id: 2, name: 'Umar', posisi: 'Crew', status_gaji: 'PRO', shift: 'weekend_full', base: 50000, denda: 0 },
    { id: 3, name: 'Ena', posisi: 'Intern', status_gaji: 'INTERN', shift: 'intern', base: 0, denda: 0 },
    { id: 4, name: 'David', posisi: 'Intern', status_gaji: 'INTERN', shift: 'intern', base: 0, denda: 0 },
    { id: 5, name: 'Abel', posisi: 'Intern', status_gaji: 'INTERN', shift: 'intern', base: 0, denda: 0 },
];

export const INIT_PRODUCTS = [
    { id: '1', name: 'Self Photo Session', category: 'Basic Studio', tipe_harga: 'normal', price: 50000, active: true },
    { id: '2', name: 'Party Photo Session', category: 'Basic Studio', tipe_harga: 'normal', price: 135000, active: true },
    { id: '3', name: 'Thematic Basic', category: 'Thematic Studio', tipe_harga: 'normal', price: 15000, active: true },
    { id: '4', name: 'Thematic Package', category: 'Thematic Studio', tipe_harga: 'normal', price: 50000, active: true },
    { id: '5', name: 'Pas Photo Basic', category: 'Basic Studio', tipe_harga: 'normal', price: 80000, active: true },
    { id: '6', name: 'Pas Photo Package', category: 'Basic Studio', tipe_harga: 'normal', price: 100000, active: true },
    { id: '7', name: 'Edited + Colored Photo', category: 'Add Ons', tipe_harga: 'normal', price: 20000, active: true },
    { id: '8', name: 'Add Person', category: 'Add Ons', tipe_harga: 'normal', price: 25000, active: true },
    { id: '9', name: 'Add Print', category: 'Add Ons', tipe_harga: 'bertingkat', price: 0, tier_1: 15000, tier_2: 30000, tier_3: 35000, tier_lebih: 13000, active: true },
    { id: '10', name: 'Special Frame', category: 'Add Ons', tipe_harga: 'bertingkat', price: 0, tier_1: 25000, tier_2: 40000, tier_3: 50000, tier_lebih: 15000, active: true },
    { id: '11', name: 'Add Time (5m)', category: 'Add Ons', tipe_harga: 'normal', price: 15000, active: true }
];

/* ─── Shift config ─────────────────────────────────── */
export const SHIFT_CONFIG = {
    weekday_full: { label: 'Weekday Full Time (Senin–Kamis)', isWeekend: false, daysPerMonth: 18 },
    weekend_full: { label: 'Weekend Full Time (Jumat–Minggu)', isWeekend: true, daysPerMonth: 13 },
    weekend_shift1: { label: 'Weekend Shift 1 (09–15)', isWeekend: true, daysPerMonth: 7 },
    weekend_shift2: { label: 'Weekend Shift 2 (15–21)', isWeekend: true, daysPerMonth: 6 },
    intern: { label: 'Intern', isWeekend: false, daysPerMonth: 0 },
};

/* ─── Bonus Logic ──────────────────────────────────── */
// Weekday: Target Rp 1.000.000 -> Bonus Rp 20.000/crew. Tiap +Rp 50.000 -> Bonus +Rp 5.000/crew
// Weekend: Target Rp 1.500.000 -> Total Bonus Rp 20.000. Tiap +Rp 50.000 -> Total Bonus +Rp 5.000. DIBAGI RATA jumlah crew.
export const computeBonus = (revenue, isWeekend, crewCount = 1) => {
    if (isWeekend) {
        const target = 1_500_000;
        if (revenue < target) return 0;
        const steps = Math.floor((revenue - target) / 50_000);
        const totalBonus = 20_000 + steps * 5_000;
        return Math.floor(totalBonus / Math.max(1, crewCount));
    } else {
        const target = 1_000_000;
        if (revenue < target) return 0;
        const steps = Math.floor((revenue - target) / 50_000);
        return 20_000 + steps * 5_000;
    }
};

/* ─── Helpers ──────────────────────────────────────── */
const load = (key, fallback = []) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
};

const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
};

const todayKey = () => `mera_absensi_${new Date().toISOString().slice(0, 10)}`;

const FinanceContext = createContext(null);

export const FinanceProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [crew, setCrew] = useState(INIT_CREW);
    const [products, setProducts] = useState(INIT_PRODUCTS);
    const [absensi, setAbsensi] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchInitialData = async () => {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Finance data initialization timeout")), 5000)
            );

            try {
                const [txData, expData, bookData, attData] = await Promise.race([
                    Promise.all([
                        supabase.from('transactions').select('*'),
                        supabase.from('expenses').select('*'),
                        supabase.from('bookings').select('*'),
                        supabase.from('attendance').select('*')
                    ]),
                    timeoutPromise
                ]);

                if (txData.data) {
                    const mappedTx = txData.data.map(t => ({
                        id: t.id,
                        time: new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                        desc: `Transaction ${t.id.slice(0, 8)}`,
                        type: t.total_amount > 0 ? 'IN' : 'OUT',
                        category: 'OTS',
                        amount: Number(t.total_amount),
                        method: t.payment_method?.toUpperCase(),
                        date: new Date(t.created_at).toISOString().slice(0, 10),
                    }));
                    setTransactions(mappedTx);
                }

                if (expData.data) {
                    const mappedExp = expData.data.map(e => ({
                        id: e.id,
                        desc: e.description,
                        amount: Number(e.amount),
                        category: e.category,
                        payment: 'CASH', // Default for now
                        date: new Date(e.date).toISOString().slice(0, 10)
                    }));
                    setExpenses(mappedExp);
                }

                if (bookData.data) {
                    const mappedBook = bookData.data.map(b => ({
                        id: b.id,
                        name: b.nama,
                        phone: b.whatsapp || b.phone,
                        package: b.paket,
                        price: b.total_tagihan || 0,
                        tanggal: b.tanggal,
                        jam: b.jam,
                        date: b.tanggal, // Alias for UI consistency
                        time: b.jam,     // Alias for UI consistency
                        status: b.status,
                        pmt: b.tipe_bayar,
                        createdAt: b.created_at
                    }));
                    setBookings(mappedBook);
                }

                if (attData.data) {
                    const mappedAtt = attData.data.map(a => ({
                        id: a.id,
                        crewId: a.user_id, // This would need to match the static INIT_CREW somehow, or fetch crew from DB
                        time: new Date(a.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                        date: new Date(a.check_in).toISOString().slice(0, 10),
                    }));
                    setAbsensi(mappedAtt);
                }

            } catch (err) {
                console.error("Error fetching initial data from Supabase:", err);
                // Fallback to local storage if network fails
                setTransactions(load(KEYS.transactions, []));
                setExpenses(load(KEYS.expenses, []));
                setBookings(load(KEYS.bookings, []));
                setCrew(load(KEYS.crew, INIT_CREW));
                setProducts(load(KEYS.products, INIT_PRODUCTS));
                setAbsensi(load(todayKey(), []));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchInitialData();

        // Setup Realtime Subscriptions
        let channel;
        try {
            channel = supabase.channel('custom-all-channel')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'transactions' },
                    (payload) => {
                        // In a complete implementation, we'd handle insert/update/delete specifically
                        fetchInitialData();
                    }
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'bookings' },
                    (payload) => {
                        fetchInitialData();
                    }
                )
                .subscribe();
        } catch (err) {
            console.error("Finance subscription failed:", err);
        }

        return () => {
            isMounted = false;
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    // Keep saving to local storage as a backup mechanism for offline capabilities
    useEffect(() => { save(KEYS.transactions, transactions); }, [transactions]);
    useEffect(() => { save(KEYS.expenses, expenses); }, [expenses]);
    useEffect(() => { save(KEYS.bookings, bookings); }, [bookings]);
    useEffect(() => { save(KEYS.crew, crew); }, [crew]);
    useEffect(() => { save(KEYS.products, products); }, [products]);
    useEffect(() => { save(todayKey(), absensi); }, [absensi]);

    /* ── Derived stats ─────────────────────────────── */
    const stats = React.useMemo(() => {
        const income = transactions.filter(t => t.type === 'IN').reduce((a, t) => a + t.amount, 0);
        const expenseTotal = transactions.filter(t => t.type === 'OUT').reduce((a, t) => a + t.amount, 0);
        const cashIn = transactions.filter(t => t.type === 'IN' && t.method === 'CASH').reduce((a, t) => a + t.amount, 0);
        const cashOut = transactions.filter(t => t.type === 'OUT' && t.method === 'CASH').reduce((a, t) => a + t.amount, 0);
        const qrisIn = transactions.filter(t => t.type === 'IN' && t.method === 'QRIS').reduce((a, t) => a + t.amount, 0);
        const qrisOut = transactions.filter(t => t.type === 'OUT' && t.method === 'QRIS').reduce((a, t) => a + t.amount, 0);
        return {
            revenue: income,
            expenses: expenseTotal,
            netProfit: income - expenseTotal,
            cash: Math.max(0, cashIn - cashOut),
            qris: Math.max(0, qrisIn - qrisOut),
            booking: transactions.filter(t => t.category === 'Booking').reduce((a, t) => a + t.amount, 0),
            ots: transactions.filter(t => t.category === 'OTS').reduce((a, t) => a + t.amount, 0),
        };
    }, [transactions]);

    /* ── Mutations ─────────────────────────────────── */
    const addTransaction = useCallback((trx) => {
        setTransactions(prev => [...prev, {
            ...trx,
            date: trx.date || new Date().toISOString().slice(0, 10),
        }]);
    }, []);

    const addExpense = useCallback((exp) => {
        const id = `EXP-${Date.now()}`;
        const now = new Date();
        setExpenses(prev => [...prev, {
            id, desc: exp.desc,
            amount: parseInt(exp.amount),
            category: exp.category || 'Expense',
            payment: exp.payment || 'CASH',
            date: now.toISOString().slice(0, 10),
        }]);
        addTransaction({
            id,
            time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            desc: exp.desc,
            type: 'OUT',
            category: exp.category || 'Expense',
            amount: parseInt(exp.amount),
            method: exp.payment || 'CASH',
        });
    }, [addTransaction]);

    const addBooking = useCallback(async (booking) => {
        const id = booking.id || `BK-${Date.now()}`;
        const newBooking = {
            ...booking,
            id,
            createdAt: new Date().toISOString(),
        };

        // Pre-emptive UI update
        setBookings(prev => [...prev, newBooking]);

        const payload = {
            nama: booking.name,
            whatsapp: booking.phone || booking.whatsapp,
            tanggal: booking.tanggal || booking.date,
            jam: booking.jam || booking.time,
            paket: booking.package,
            total_tagihan: Number(booking.price),
            status: booking.status,
            tipe_bayar: booking.pmt
        };

        const { error } = await supabase.from('bookings').insert([payload]);
        if (error) console.error("Failed to sync new booking to Supabase:", error);

        // Auto-create transaction if created as PAID
        if (booking.status === 'PAID') {
            const method = booking.pmt === 'PENDING' ? 'CASH' : booking.pmt;
            addTransaction({
                id: `TRX-${id}-${Date.now()}`,
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                desc: `Booking: ${booking.name} (${booking.package})`,
                type: 'IN',
                category: 'Booking',
                amount: Number(booking.price) || 0,
                method: method,
                date: new Date().toISOString().slice(0, 10),
            });
        }
    }, [addTransaction]);

    const updateBooking = useCallback(async (id, updates) => {
        setBookings(prev => {
            const currentBooking = prev.find(b => b.id === id);
            const merged = { ...currentBooking, ...updates };

            // Supabase Persistence
            const syncToSupabase = async () => {
                const payload = {};
                if (updates.name) payload.nama = updates.name;
                if (updates.phone) payload.whatsapp = updates.phone;
                if (updates.date) payload.tanggal = updates.date;
                if (updates.time) payload.jam = updates.time;
                if (updates.package) payload.paket = updates.package;
                if (updates.price) payload.total_tagihan = Number(updates.price);
                if (updates.status) payload.status = updates.status;
                if (updates.pmt) payload.tipe_bayar = updates.pmt;

                const { error } = await supabase.from('bookings').update(payload).eq('id', id);
                if (error) console.error("Failed to sync update to Supabase:", error);
            };
            syncToSupabase();

            if (updates.status === 'PAID' && currentBooking?.status !== 'PAID') {
                // Auto-create transaction if payment method is provided
                const method = merged.pmt === 'PENDING' ? 'CASH' : merged.pmt; // Default to CASH if pending but marked paid
                addTransaction({
                    id: `TRX-${id}-${Date.now()}`,
                    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    desc: `Booking: ${merged.name} (${merged.package})`,
                    type: 'IN',
                    category: 'Booking',
                    amount: Number(merged.price) || 0,
                    method: method,
                    date: new Date().toISOString().slice(0, 10), // Log on the day it's paid
                });

                // Also update the merged booking to ensure pmt is not pending if status is PAID
                if (merged.pmt === 'PENDING') merged.pmt = method;
            }

            return prev.map(b => b.id === id ? merged : b);
        });
    }, [addTransaction]);

    const deleteBooking = useCallback(async (id) => {
        setBookings(prev => prev.filter(b => b.id !== id));
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        if (error) console.error("Failed to delete booking from Supabase:", error);
    }, []);

    const updateCrew = useCallback((id, field, val) => {
        setCrew(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
    }, []);

    const addCrew = useCallback((member) => {
        setCrew(prev => {
            const newId = Math.max(0, ...prev.map(c => c.id)) + 1;
            return [...prev, { ...member, id: newId, bonus: 0, denda: 0 }];
        });
    }, []);

    const removeCrew = useCallback((id) => {
        setCrew(prev => prev.filter(c => c.id !== id));
    }, []);

    /* ── Products CRUD ─────────────────────────────── */
    const addProduct = useCallback((p) => {
        setProducts(prev => [...prev, { ...p, id: `p-${Date.now()}`, active: true }]);
    }, []);

    const updateProduct = useCallback((id, updates) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }, []);

    const deleteProduct = useCallback((id) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    }, []);

    /* ── Absensi (Attendance) ──────────────────────── */
    const addAbsensi = useCallback((record) => {
        setAbsensi(prev => {
            // Avoid duplicate check-ins for same person today
            if (prev.some(a => a.crewId === record.crewId)) return prev;
            return [...prev, { ...record, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }];
        });
    }, []);

    /* ── Reset Targeted Month data ─────────────────────── */
    const resetMonth = useCallback(async (year, month) => {
        const monthStr = String(month + 1).padStart(2, '0');
        const lastDay = new Date(year, month + 1, 0).getDate();
        const startYMD = `${year}-${monthStr}-01`;
        const endYMD = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

        const startTimestamp = new Date(year, month, 1).toISOString();
        const endTimestamp = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

        try {
            await Promise.all([
                supabase.from('transactions').delete().gte('created_at', startTimestamp).lte('created_at', endTimestamp),
                supabase.from('expenses').delete().gte('date', startYMD).lte('date', endYMD),
                supabase.from('bookings').delete().gte('tanggal', startYMD).lte('tanggal', endYMD),
                supabase.from('attendance').delete().gte('check_in', startTimestamp).lte('check_in', endTimestamp)
            ]);
        } catch (err) {
            console.error("Failed to delete monthly data from Supabase:", err);
        }

        setTransactions(prev => prev.filter(t => {
            if (!t.date) return true;
            const [y, m] = t.date.split('-');
            return !(Number(y) === year && Number(m) === month + 1);
        }));
        setExpenses(prev => prev.filter(e => {
            if (!e.date) return true;
            const [y, m] = e.date.split('-');
            return !(Number(y) === year && Number(m) === month + 1);
        }));
        setBookings(prev => prev.filter(b => {
            if (!b.date) return true;
            const [y, m] = b.date.split('-');
            return !(Number(y) === year && Number(m) === month + 1);
        }));
        setAbsensi(prev => prev.filter(a => {
            if (!a.date) return true;
            const [y, m] = a.date.split('-');
            return !(Number(y) === year && Number(m) === month + 1);
        }));

        // Reset manual bonus and denda for the targeted month
        setCrew(prev => prev.map(c => ({ ...c, bonus: 0, denda: 0 })));
    }, []);

    /* ── Reset ALL data ────────────────────────────── */
    const resetAll = useCallback(async () => {
        try {
            // Delete all data from Supabase
            await Promise.all([
                supabase.from('transactions').delete().not('id', 'is', null),
                supabase.from('expenses').delete().not('id', 'is', null),
                supabase.from('bookings').delete().not('id', 'is', null),
                supabase.from('attendance').delete().not('id', 'is', null)
            ]);
        } catch (err) {
            console.error("Failed to delete all data from Supabase:", err);
        }

        Object.values(KEYS).forEach(k => localStorage.removeItem(k));
        localStorage.removeItem('checklist_v2');
        localStorage.removeItem('checklist_tabs_v1');
        localStorage.removeItem('mera_user');
        localStorage.removeItem(todayKey());
        setTransactions([]);
        setExpenses([]);
        setBookings([]);
        setCrew(INIT_CREW.map(c => ({ ...c, bonus: 0, denda: 0 }))); // Ensure reset bonus/denda
        setProducts(INIT_PRODUCTS);
        setAbsensi([]);
    }, []);

    const value = {
        transactions, expenses, bookings, crew, products, stats, absensi,
        addTransaction, addExpense, addBooking, updateBooking, deleteBooking,
        updateCrew, addCrew, removeCrew,
        addProduct, updateProduct, deleteProduct,
        addAbsensi, resetMonth, resetAll,
    };

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};

export const useFinance = () => {
    const ctx = useContext(FinanceContext);
    if (!ctx) throw new Error('useFinance must be used within a FinanceProvider');
    return ctx;
};
