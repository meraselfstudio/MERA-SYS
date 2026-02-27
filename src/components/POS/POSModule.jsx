import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getProducts } from '../../services/productService';
import {
    ShoppingCart, Trash2, Plus, Minus, User, CreditCard, Printer, X,
    CheckCircle2, Camera, PackagePlus, RefreshCw, ArrowRight, Copy,
    Timer, Instagram
} from 'lucide-react';
import Receipt from './Receipt';
import { useReactToPrint } from 'react-to-print';
import { useFinance } from '../../context/FinanceContext';
import html2canvas from 'html2canvas';
import { supabase } from '../../lib/supabase';

// ─── SESSION ID GENERATOR (doc 2.1 & 3) ──────────────────────────────────────
// Format wajib: DDMMYYYY-NAME-CODE (contoh: 27022026-AYU-MR)
const generateSessionId = (name = '', backgroundCode = '') => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const nameSlug = name.split(' ')[0].toUpperCase().slice(0, 6);
    const code = (backgroundCode || 'OTS').toUpperCase();
    return `${dd}${mm}${yyyy}-${nameSlug}-${code}`;
};

// ─── 5-MINUTE TIMER HOOK (doc 3 & 5.3) ────────────────────────────────────────
const useCountdown = (initialSeconds = 300, active = false) => {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        if (!active) { setSeconds(initialSeconds); setRunning(false); return; }
        setSeconds(initialSeconds);
        setRunning(true);
    }, [active, initialSeconds]);

    useEffect(() => {
        if (!running) return;
        if (seconds <= 0) { setRunning(false); return; }
        const t = setInterval(() => setSeconds(s => s - 1), 1000);
        return () => clearInterval(t);
    }, [running, seconds]);

    const reset = () => { setSeconds(initialSeconds); setRunning(true); };
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return { display: `${mm}:${ss}`, seconds, reset, isExpired: seconds <= 0 };
};

// ─── BADGE STATUS (doc 2.1) ────────────────────────────────────────────────────
const StatusBadge = ({ status, tipe }) => {
    // KEEPSLOT = Oranye (belum bayar) | UNVERIFIED_QRIS = Kuning (cek Livin)
    const isPaid = status === 'UNVERIFIED_QRIS' || tipe === 'ONLINE';
    return (
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${isPaid
            ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
            : 'bg-orange-500/20 text-orange-500 border-orange-500/30'
            }`}>
            {isPaid ? 'CEK LIVIN (QRIS)' : 'KEEP SLOT'}
        </span>
    );
};

const POSModule = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [customer, setCustomer] = useState({ name: '', type: 'Booking', payment: 'QRIS' });
    const [loading, setLoading] = useState(true);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const [copiedSessionId, setCopiedSessionId] = useState(false);

    // doc 2.1: Tabel `registrations` (bukan `bookings`)
    const [lobbyQueue, setLobbyQueue] = useState([]);      // KEEPSLOT / UNVERIFIED_QRIS
    const [inStudio, setInStudio] = useState([]);           // PROCESSED (sedang di Studio)
    const [loadingQueue, setLoadingQueue] = useState(false);
    const [activeRegistration, setActiveRegistration] = useState(null); // yang sedang checkout di Kolom 3

    // Session ID & Timer untuk Kolom 2 (doc 3 & 5.3)
    const [timerActive, setTimerActive] = useState(false);
    const countdown = useCountdown(5 * 60, timerActive);

    const receiptRef = useRef();
    const { addTransaction } = useFinance();

    // ─── 1. FETCH INITIAL DATA ──────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const prodData = await getProducts();
                setProducts(prodData);
                await fetchQueue();
            } catch (e) {
                console.error('Gagal memuat data awal:', e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // ─── 2. SUPABASE REALTIME SUBSCRIPTION (doc 6.2) ───────────────────────────
    // WebSocket subscription ke tabel `registrations` — update < 500ms tanpa F5
    useEffect(() => {
        const channel = supabase
            .channel('registrations-pos')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'registrations'
            }, () => {
                // Setiap INSERT/UPDATE/DELETE → refresh queue
                fetchQueue();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchQueue = useCallback(async () => {
        setLoadingQueue(true);
        try {
            const today = new Date().toLocaleDateString('en-CA');
            const { data, error } = await supabase
                .from('registrations')
                .select('*')
                .gte('created_at', `${today}T00:00:00`)
                .lte('created_at', `${today}T23:59:59`)
                .in('status', ['KEEPSLOT', 'UNVERIFIED_QRIS', 'PROCESSED'])
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (data) {
                setLobbyQueue(data.filter(r => r.status === 'KEEPSLOT' || r.status === 'UNVERIFIED_QRIS'));
                setInStudio(data.filter(r => r.status === 'PROCESSED'));
            }
        } catch (e) {
            console.error('Gagal fetch registrations:', e);
        } finally {
            setLoadingQueue(false);
        }
    }, []);

    // ─── 3. OPERASIONAL POS ─────────────────────────────────────────────────────

    // FASE 2: Kru verifikasi kedatangan → pindah Lobby ke In-Studio (PROCESSED)
    const handleVerifyArrival = async (id) => {
        try {
            await supabase.from('registrations').update({ status: 'PROCESSED' }).eq('id', id);
            // Realtime akan trigger fetchQueue otomatis
        } catch (e) {
            console.error('Gagal verifikasi:', e);
        }
    };

    // Aktifkan timer 5 menit untuk pelanggan di studio (doc 5.3)
    const handleStartTimer = (reg) => {
        setTimerActive(false);
        setTimeout(() => setTimerActive(true), 50); // restart countdown
    };

    // FASE 4: Tarik ke Kasir (Kolom 3 checkout)
    const handleStartCheckout = (reg) => {
        setActiveRegistration(reg);
        setCustomer({
            name: reg.customer_name,
            type: reg.booking_type === 'ONLINE' ? 'Booking' : 'Walk-In',
            payment: reg.status === 'UNVERIFIED_QRIS' ? 'QRIS' : 'CASH'
        });
        // Base package placeholder dari web
        const baseItem = {
            id: reg.id,
            name: `[WEB] ${reg.studio_choice || 'Self Photo'} ${reg.background_code ? `(${reg.background_code})` : ''}`.trim(),
            price: 0,
            qty: 1,
            tipe_harga: 'normal'
        };
        setCart([baseItem]);
    };

    const handleCancelCheckout = () => {
        setActiveRegistration(null);
        setCart([]);
        setCustomer({ name: '', type: 'Booking', payment: 'QRIS' });
    };

    // ─── 4. CART & TIERED PRICING (doc 2.1) ────────────────────────────────────
    const addToCart = (product) => {
        const existing = cart.find(i => i.id === product.id);
        if (existing) setCart(cart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
        else setCart([...cart, { ...product, qty: 1 }]);
    };
    const updateQty = (id, delta) => setCart(cart.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
    const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

    const calcTieredItem = (item) => {
        if (item.tipe_harga === 'bertingkat') {
            if (item.qty === 1) return item.tier_1 || 0;
            if (item.qty === 2) return item.tier_2 || item.tier_1 || 0;
            if (item.qty === 3) return item.tier_3 || item.tier_2 || item.tier_1 || 0;
            return (item.tier_3 || item.tier_2 || item.tier_1 || 0) + ((item.qty - 3) * (item.tier_lebih || 0));
        }
        return (item.price || item.harga || 0) * item.qty;
    };

    const total = cart.reduce((sum, item) => sum + calcTieredItem(item), 0);
    const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
    const canPay = cart.length > 0 && customer.name.trim() !== '';

    // ─── 5. KIRIM VIA IG (doc 3, Fase 5) ──────────────────────────────────────
    // Auto-copy pesan template (Link Drive + DM template) ke clipboard
    const handleKirimIG = () => {
        const sessionId = activeRegistration
            ? generateSessionId(activeRegistration.customer_name, activeRegistration.background_code)
            : '';
        const igHandle = activeRegistration?.instagram_handle || '';
        const pesan = `Halo kak @${igHandle}! 📸

Terima kasih sudah foto di Méra SelfStudio!
File foto kamu sudah siap ya.

📁 Link Google Drive: [PASTE LINK DRIVE DI SINI]
🗓️ Session ID: ${sessionId}

Link aktif selama 5 hari.
Jangan lupa follow & tag kami di foto kamu! 🤍

— Méra SelfStudio 📍`;

        navigator.clipboard.writeText(pesan).then(() => {
            alert('✅ Pesan template sudah di-copy ke clipboard!\nBuka Instagram DM dan paste.');
        }).catch(() => {
            prompt('Copy pesan ini secara manual:', pesan);
        });
    };

    // ─── 6. COMPLETE TRANSACTION ────────────────────────────────────────────────
    const completeTransaction = async () => {
        const sessionId = activeRegistration
            ? generateSessionId(activeRegistration.customer_name, activeRegistration.background_code)
            : `TRX-${Date.now()}`;

        addTransaction({
            id: sessionId,
            desc: `${customer.type} - ${customer.name}`,
            amount: total,
            type: 'IN',
            category: customer.type,
            method: customer.payment,
            items: cart
        });

        if (activeRegistration) {
            try {
                await supabase.from('registrations')
                    .update({ status: 'EXPIRED' }) // Mark selesai (doc 2.1 status EXPIRED = sudah layani)
                    .eq('id', activeRegistration.id);
                // Insert ke transactions (doc 2.1 Tabel transactions)
                await supabase.from('transactions').insert([{
                    session_id: sessionId,
                    registration_id: activeRegistration.id,
                    total_amount: total,
                    discount_amount: 0,
                    payment_method: customer.payment,
                    status: 'DONE'
                }]);
            } catch (e) {
                console.error('Gagal update Supabase:', e);
            }
        }
    };

    const resetAll = () => {
        setCart([]);
        setCustomer({ name: '', type: 'Booking', payment: 'QRIS' });
        setActiveRegistration(null);
        setShowReceiptPreview(false);
        setTimerActive(false);
    };

    const handlePrint = useReactToPrint({
        content: () => receiptRef.current,
        documentTitle: `Struk-${Date.now()}`,
        onAfterPrint: () => resetAll()
    });

    const handleConfirmAndPay = async () => {
        await completeTransaction();
        handlePrint();
    };

    const handleShareReceipt = async () => {
        if (!receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 2 });
            const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
            const file = new File([blob], `struk-${Date.now()}.png`, { type: 'image/png' });
            await completeTransaction();
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({ title: 'Struk Méra', text: `Struk untuk ${customer.name}`, files: [file] });
                resetAll();
            } else {
                const url = URL.createObjectURL(blob);
                Object.assign(document.createElement('a'), { href: url, download: file.name }).click();
                setTimeout(() => URL.revokeObjectURL(url), 10000);
                resetAll();
            }
        } catch (err) {
            console.error('Error share:', err);
            handleConfirmAndPay();
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#050505] text-gray-500 font-bold uppercase tracking-widest animate-pulse text-sm">
            Memuat Méra OS POS...
        </div>
    );

    const categories = ['All', ...new Set(products.map(p => p.kategori).filter(Boolean))];
    const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => p.kategori === selectedCategory);

    // Session ID untuk pelanggan yang sedang di studio (Kolom 2)
    const currentSessionId = activeRegistration
        ? generateSessionId(activeRegistration.customer_name, activeRegistration.background_code)
        : null;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#050505] text-white font-sans">

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* KOLOM 1: LOBBY — 30% (doc 5.3) */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <div className="w-[30%] h-full flex flex-col bg-[#0a0a0a] border-r border-white/10 shrink-0">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#111]">
                    <div>
                        <h2 className="font-black text-sm uppercase tracking-widest text-white flex items-center gap-2">
                            <User size={16} className="text-orange-400" /> 1. LOBBY
                        </h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                            Antrean Verifikasi · {lobbyQueue.length} tamu
                        </p>
                    </div>
                    <button
                        onClick={fetchQueue}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={14} className={`text-gray-400 ${loadingQueue ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingQueue ? (
                        <p className="text-center text-gray-600 text-[10px] uppercase font-bold animate-pulse mt-10">Mencari Data...</p>
                    ) : lobbyQueue.length === 0 ? (
                        <div className="text-center mt-10">
                            <p className="text-gray-600 text-[10px] uppercase font-bold">Tidak ada antrean</p>
                            <p className="text-gray-700 text-[9px] mt-2">Realtime aktif · auto-refresh</p>
                        </div>
                    ) : (
                        lobbyQueue.map(reg => (
                            <div key={reg.id} className="bg-[#111] border border-white/10 p-4 rounded-xl flex flex-col gap-3 shadow-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-black text-base uppercase tracking-tighter leading-none">{reg.customer_name}</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">
                                            @{reg.instagram_handle}
                                        </p>
                                        <p className="text-[9px] text-gray-500 mt-1">
                                            {reg.studio_choice} {reg.background_code ? `· ${reg.background_code}` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-orange-400">
                                            {new Date(reg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-[9px] text-gray-600 mt-1 uppercase">
                                            {reg.booking_type === 'ONLINE' ? '🌐 Online' : '🚶 OTS'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                                    <StatusBadge status={reg.status} tipe={reg.booking_type} />
                                    <button
                                        onClick={() => handleVerifyArrival(reg.id)}
                                        className="bg-white text-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all flex items-center gap-1"
                                    >
                                        Proses <ArrowRight size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* KOLOM 2: IN-STUDIO — 35% (doc 5.3) */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <div className="w-[35%] h-full flex flex-col bg-[#111] border-r border-white/10 shrink-0 shadow-[-10px_0_20px_rgba(0,0,0,0.5)] z-10">
                <div className="p-4 border-b border-white/10 bg-[#161616]">
                    <h2 className="font-black text-sm uppercase tracking-widest text-white flex items-center gap-2">
                        <Camera size={16} className="text-[#D91636]" /> 2. IN-STUDIO
                    </h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Sedang Foto · Tablet Seleksi</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {inStudio.length === 0 ? (
                        <p className="text-center text-gray-600 text-[10px] uppercase font-bold mt-10">Studio Kosong</p>
                    ) : (
                        inStudio.map(reg => {
                            const sessId = generateSessionId(reg.customer_name, reg.background_code);
                            const isActive = activeRegistration?.id === reg.id;

                            return (
                                <div key={reg.id} className="bg-[#1a1a1a] border border-[#D91636]/30 p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-1 h-full bg-[#D91636]" />

                                    {/* Nama & Info */}
                                    <div>
                                        <p className="font-black text-base uppercase tracking-tighter">{reg.customer_name}</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">
                                            {reg.studio_choice} {reg.background_code ? `· ${reg.background_code}` : ''}
                                        </p>
                                    </div>

                                    {/* SESSION ID BESAR (doc 3 & 5.3) */}
                                    <div className="bg-black/50 rounded-xl p-3 border border-white/10">
                                        <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Session ID</div>
                                        <div className="font-mono font-black text-lg text-white leading-tight break-all">
                                            {sessId}
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(sessId);
                                                setCopiedSessionId(reg.id);
                                                setTimeout(() => setCopiedSessionId(null), 2000);
                                            }}
                                            className={`mt-2 w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${copiedSessionId === reg.id
                                                ? 'bg-green-500 text-white'
                                                : 'bg-white text-black hover:bg-gray-200'
                                                }`}
                                        >
                                            <Copy size={12} />
                                            {copiedSessionId === reg.id ? 'COPIED! ✓' : 'COPY SESSION ID'}
                                        </button>
                                    </div>

                                    {/* TIMER 5 MENIT (doc 5.3) */}
                                    <div className={`flex items-center justify-between rounded-xl p-3 border transition-all ${timerActive && activeRegistration?.id === reg.id
                                        ? countdown.seconds <= 60
                                            ? 'bg-red-900/30 border-red-500/50'
                                            : 'bg-[#D91636]/10 border-[#D91636]/30'
                                        : 'bg-black/30 border-white/10'
                                        }`}>
                                        <div className="flex items-center gap-2">
                                            <Timer size={14} className={timerActive && activeRegistration?.id === reg.id ? 'text-[#D91636]' : 'text-gray-500'} />
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Seleksi Tablet</span>
                                        </div>
                                        <div className={`font-mono font-black text-xl ${timerActive && activeRegistration?.id === reg.id
                                            ? countdown.seconds <= 60 ? 'text-red-400' : 'text-white'
                                            : 'text-gray-600'
                                            }`}>
                                            {timerActive && activeRegistration?.id === reg.id
                                                ? countdown.isExpired ? '00:00 🔒' : countdown.display
                                                : '05:00'
                                            }
                                        </div>
                                        <button
                                            onClick={() => { setActiveRegistration(reg); handleStartTimer(reg); }}
                                            className="px-3 py-1 bg-[#D91636] text-white text-[9px] font-black rounded-lg uppercase tracking-widest hover:bg-red-700 transition-all"
                                        >
                                            {timerActive && activeRegistration?.id === reg.id ? 'Reset' : 'Start'}
                                        </button>
                                    </div>

                                    {/* Tarik ke Kasir */}
                                    <button
                                        disabled={isActive}
                                        onClick={() => handleStartCheckout(reg)}
                                        className="w-full bg-[#D91636] text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-800 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {isActive ? 'SEDANG CHECKOUT...' : 'Tarik ke Kasir →'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* KOLOM 3: CASHIER & UPSELL — 35% (doc 5.3) */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            <div className="w-[35%] h-full flex flex-col bg-[#050505] shrink-0 shadow-[-20px_0_40px_rgba(0,0,0,0.8)] z-20">

                {!activeRegistration ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <PackagePlus size={48} className="text-gray-800 mb-4" />
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Kasir Standby</h2>
                        <p className="text-xs text-gray-500 uppercase tracking-widest max-w-xs">
                            Tarik nama dari IN-STUDIO untuk memproses Add-On & Pelunasan
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-1 overflow-hidden flex-col">

                        {/* Header aktif */}
                        <div className="p-4 border-b border-white/10 bg-[#161616] flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="font-black text-sm text-white uppercase tracking-widest">3. CASHIER</h2>
                                <p className="text-[9px] font-black text-[#D91636] mt-1 uppercase">
                                    {customer.name} · {currentSessionId}
                                </p>
                            </div>
                            <button onClick={handleCancelCheckout} className="p-1.5 bg-red-900/20 text-red-500 hover:bg-red-900 hover:text-white rounded-lg transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Katalog Add-On */}
                        <div className="border-b border-white/10 shrink-0">
                            <div className="p-3 bg-[#0a0a0a] border-b border-white/5">
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Add-On / OTS</h3>
                            </div>
                            <div className="flex gap-2 overflow-x-auto px-3 pt-2 pb-2 scrollbar-hide bg-[#050505]">
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-[#111] text-gray-500 border-white/10 hover:text-white'}`}>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="max-h-40 overflow-y-auto p-2 grid grid-cols-1 gap-1.5 bg-[#050505]">
                                {filteredProducts.map(product => {
                                    let displayPrice = product.price || product.harga;
                                    if (product.tipe_harga === 'bertingkat') displayPrice = product.tier_1;
                                    return (
                                        <button key={product.id} onClick={() => addToCart(product)}
                                            className="w-full p-3 rounded-lg border border-white/10 hover:border-[#D91636] group flex items-center justify-between text-left bg-[#111] transition-all">
                                            <div>
                                                <h3 className="font-black text-white text-[10px] uppercase tracking-wider">{product.name || product.nama}</h3>
                                                <div className="font-bold text-[#D91636] text-[9px] mt-0.5">
                                                    {fmt(displayPrice)}
                                                    {product.tipe_harga === 'bertingkat' && <span className="text-[8px] font-normal text-gray-500 ml-1">+tier</span>}
                                                </div>
                                            </div>
                                            <Plus size={14} className="text-gray-500 group-hover:text-white transition-colors" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Keranjang */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {cart.map(item => {
                                const itemTotal = calcTieredItem(item);
                                const isWebBase = item.name?.includes('[WEB]');
                                const singlePrice = isWebBase ? 0 : (item.price || item.harga || 0);

                                return (
                                    <div key={item.id} className={`flex flex-col gap-2 p-3 rounded-xl border ${isWebBase ? 'border-blue-900/50 bg-blue-900/10' : 'border-white/10 bg-[#0a0a0a]'}`}>
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-black text-white uppercase tracking-wider leading-tight">
                                                {item.name || item.nama}
                                                {isWebBase && <span className="ml-2 bg-blue-500 text-black text-[7px] px-1.5 py-0.5 rounded-full uppercase font-black">Base</span>}
                                            </span>
                                            {!isWebBase && (
                                                <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500 ml-2 shrink-0">
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            {!isWebBase ? (
                                                <div className="flex items-center bg-black rounded-lg border border-white/10">
                                                    <button onClick={() => updateQty(item.id, -1)} className="p-1.5 text-gray-400 hover:text-white"><Minus size={10} /></button>
                                                    <span className="w-5 text-center text-[10px] font-black">{item.qty}</span>
                                                    <button onClick={() => updateQty(item.id, 1)} className="p-1.5 text-gray-400 hover:text-white"><Plus size={10} /></button>
                                                </div>
                                            ) : (
                                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Fixed</div>
                                            )}
                                            <div className="text-right">
                                                <div className="font-black text-xs text-white">{fmt(itemTotal)}</div>
                                                {!isWebBase && <div className="text-[8px] text-gray-500">@{fmt(singlePrice)}</div>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer Pembayaran */}
                        <div className="p-4 bg-[#0a0a0a] border-t border-white/10 space-y-3 shrink-0">

                            {/* Kirim via IG (doc 3, Fase 5 — Zero WhatsApp Policy) */}
                            <button
                                onClick={handleKirimIG}
                                className="w-full py-2.5 rounded-xl border border-purple-500/30 bg-purple-900/10 hover:bg-purple-900/20 text-purple-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                            >
                                <Instagram size={14} /> Kirim via IG DM
                            </button>

                            {/* Pilih Metode */}
                            <div className="flex gap-2">
                                <button onClick={() => setCustomer({ ...customer, payment: 'QRIS' })}
                                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${customer.payment === 'QRIS' ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'bg-[#111] border-white/5 text-gray-500 hover:text-white'}`}>
                                    QRIS / Transfer
                                </button>
                                <button onClick={() => setCustomer({ ...customer, payment: 'CASH' })}
                                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${customer.payment === 'CASH' ? 'border-green-500 bg-green-500/20 text-green-400' : 'bg-[#111] border-white/5 text-gray-500 hover:text-white'}`}>
                                    CASH
                                </button>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total</span>
                                <span className="text-2xl font-black text-white">{fmt(total)}</span>
                            </div>

                            <button
                                onClick={() => setShowReceiptPreview(true)}
                                disabled={!canPay}
                                className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${canPay
                                    ? 'bg-white text-black hover:bg-gray-200 active:scale-95 shadow-xl'
                                    : 'bg-[#111] text-gray-600 border border-white/5 cursor-not-allowed'
                                    }`}
                            >
                                <CreditCard size={16} /> Konfirmasi & Cetak Struk
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RECEIPT PREVIEW MODAL */}
            {showReceiptPreview && (
                <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
                            <h3 className="font-black text-sm text-white uppercase tracking-widest">Preview Struk</h3>
                            <button onClick={() => setShowReceiptPreview(false)} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><X size={16} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-[#050505] flex justify-center">
                            <Receipt ref={receiptRef} cart={cart} total={total} subtotal={total} paymentMethod={customer.payment} customer={customer} />
                        </div>
                        <div className="p-4 bg-[#1a1a1a] border-t border-white/10 flex gap-2">
                            <button onClick={() => setShowReceiptPreview(false)}
                                className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase text-gray-400 bg-[#111] hover:bg-white/10 transition-all">
                                Batal
                            </button>
                            <button onClick={handleShareReceipt}
                                className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase bg-white text-black hover:bg-gray-200 transition-all">
                                Simpan JPG
                            </button>
                            <button onClick={handleConfirmAndPay}
                                className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase bg-[#D91636] text-white hover:bg-red-800 flex items-center justify-center gap-1 transition-all">
                                <Printer size={14} /> Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSModule;