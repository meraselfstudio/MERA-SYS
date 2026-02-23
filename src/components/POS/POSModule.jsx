import React, { useState, useEffect, useRef } from 'react';
import { getProducts } from '../../services/productService';
import { ShoppingCart, Trash2, Plus, Minus, User, CreditCard, Printer, X, Calendar, CheckCircle2, Camera, PackagePlus, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import Receipt from './Receipt';
import { useReactToPrint } from 'react-to-print';
import { useFinance } from '../../context/FinanceContext';
import html2canvas from 'html2canvas';
import { createClient } from '@supabase/supabase-js';

// === GANTI DENGAN KREDENSIAL SUPABASE-MU ===
const supabaseUrl = 'https://kgmeqorjbgkwalfdoprm.supabase.co';
const supabaseKey = 'sb_publishable_m63YfkkKuHeIwIwuI4jp_Q_Jy14KhUa';
const supabase = createClient(supabaseUrl, supabaseKey);

const POSModule = () => {
    // --- STATE DATA POS ---
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [customer, setCustomer] = useState({ name: '', type: 'Booking', payment: 'QRIS' });
    const [loading, setLoading] = useState(true);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);

    // --- STATE JADWAL SUPABASE ---
    const [queueBookings, setQueueBookings] = useState([]); // Lobby (KEEPSLOT / AWAITING_CONFIRMATION)
    const [activeBookings, setActiveBookings] = useState([]); // In-Studio (ARRIVED)
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [selectedBookingForCheckout, setSelectedBookingForCheckout] = useState(null);

    const receiptRef = useRef();
    const { addTransaction } = useFinance();

    // ==========================================
    // 1. INITIAL FETCH
    // ==========================================
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const prodData = await getProducts();
                setProducts(prodData);
                await fetchTodaySchedule();
            } catch (error) {
                console.error("Gagal memuat data awal:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const fetchTodaySchedule = async () => {
        setLoadingBookings(true);
        try {
            const today = new Date().toLocaleDateString('en-CA');
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('tanggal', today)
                .in('status', ['KEEPSLOT', 'AWAITING_CONFIRMATION', 'ARRIVED'])
                .order('jam', { ascending: true });

            if (error) throw error;

            if (data) {
                setQueueBookings(data.filter(b => b.status === 'KEEPSLOT' || b.status === 'AWAITING_CONFIRMATION'));
                setActiveBookings(data.filter(b => b.status === 'ARRIVED'));
            }
        } catch (error) {
            console.error("Gagal menarik jadwal:", error);
        } finally {
            setLoadingBookings(false);
        }
    };

    // ==========================================
    // 2. LOGIKA OPERASIONAL (VERIFIKASI -> SESI -> CHECKOUT)
    // ==========================================

    const simulateCustomer = async () => {
        const mock = {
            nama: 'Customer Test ' + Math.floor(Math.random() * 1000),
            paket: 'Self Photo Session',
            total_tagihan: 50000,
            tanggal: new Date().toLocaleDateString('en-CA'),
            jam: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`,
            tipe_bayar: 'KEEPSLOT',
            status: 'AWAITING_CONFIRMATION'
        };
        try {
            await supabase.from('bookings').insert([mock]);
            fetchTodaySchedule();
        } catch (e) {
            console.error("Gagal simulasi:", e);
        }
    };

    // A. KRU MEMVERIFIKASI KEDATANGAN (Pindah dari Lobby ke Studio)
    const handleVerifyArrival = async (id) => {
        try {
            await supabase.from('bookings').update({ status: 'ARRIVED' }).eq('id', id);
            fetchTodaySchedule(); // Refresh data
        } catch (error) {
            console.error("Gagal verifikasi kedatangan:", error);
            alert("Gagal update status database.");
        }
    };

    // B. KRU MENARIK PELANGGAN KE KASIR (Pindah dari Studio ke Keranjang)
    const handleStartCheckout = (booking) => {
        setSelectedBookingForCheckout(booking);
        setCustomer({
            name: booking.nama,
            type: 'Booking',
            payment: booking.tipe_bayar === 'PAID' ? 'QRIS' : 'CASH'
        });

        // Masukkan paket dasar dari Web ke keranjang sebagai Item Utama
        const webItemName = `[WEB] ${booking.paket} ${booking.background ? `(${booking.background})` : ''}`;
        const bookingItem = {
            id: booking.id,
            name: webItemName,
            price: booking.total_tagihan, // Grand total mutlak dari web
            qty: 1,
            tipe_harga: 'normal'
        };

        setCart([bookingItem]);
    };

    // C. BATALKAN CHECKOUT SEMENTARA (Jika pelanggan belum selesai milih)
    const handleCancelCheckout = () => {
        setSelectedBookingForCheckout(null);
        setCart([]);
        setCustomer({ name: '', type: 'Booking', payment: 'QRIS' });
    };

    // ==========================================
    // 3. FUNGSI KERANJANG & CHECKOUT AKHIR
    // ==========================================
    const addToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
        else setCart([...cart, { ...product, qty: 1 }]);
    };

    const updateQty = (id, delta) => setCart(cart.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
    const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

    const calculateTotal = () => {
        return cart.reduce((total, item) => {
            if (item.tipe_harga === 'bertingkat') {
                if (item.qty === 1) return total + (item.tier_1 || 0);
                if (item.qty === 2) return total + (item.tier_2 || item.tier_1 || 0);
                if (item.qty === 3) return total + (item.tier_3 || item.tier_2 || item.tier_1 || 0);
                if (item.qty > 3) return total + (item.tier_3 || item.tier_2 || item.tier_1 || 0) + ((item.qty - 3) * (item.tier_lebih || 0));
                return total;
            } else {
                return total + ((item.price || item.harga || 0) * item.qty);
            }
        }, 0);
    };

    const total = calculateTotal();
    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    const canPay = cart.length > 0 && customer.name.trim() !== '' && !!customer.type && !!customer.payment;

    // --- EKSEKUSI TRANSAKSI FINAL (TUTUP BUKU & UPDATE SUPABASE) ---
    const completeTransaction = async () => {
        addTransaction({
            id: `TRX-${Date.now()}`,
            desc: `${customer.type} - ${customer.name}`,
            amount: total,
            type: 'IN',
            category: customer.type,
            method: customer.payment,
            items: cart
        });

        // Tandai selesai di Supabase
        if (selectedBookingForCheckout) {
            try {
                await supabase.from('bookings').update({ status: 'COMPLETED' }).eq('id', selectedBookingForCheckout.id);
                fetchTodaySchedule();
            } catch (error) {
                console.error("Gagal update status Supabase:", error);
            }
        }
    };

    const resetCartAndCheckout = () => {
        setCart([]);
        setCustomer({ name: '', type: 'Booking', payment: 'QRIS' });
        setSelectedBookingForCheckout(null);
        setShowReceiptPreview(false);
    };

    const handlePrint = useReactToPrint({
        content: () => receiptRef.current,
        documentTitle: `Receipt-${new Date().getTime()}`,
        onAfterPrint: () => resetCartAndCheckout()
    });

    const handleConfirmAndPay = async () => {
        await completeTransaction();
        handlePrint();
    };

    const handleShareReceipt = async () => {
        if (!receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 2 });
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], `receipt-${Date.now()}.png`, { type: 'image/png' });

            await completeTransaction();

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ title: 'Receipt', text: `Receipt for ${customer.name}`, files: [file] });
                resetCartAndCheckout();
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = file.name; a.target = '_blank';
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 10000);
                resetCartAndCheckout();
            }
        } catch (err) {
            console.error("Error sharing receipt:", err);
            handleConfirmAndPay();
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Memuat Studio OS iMac...</div>;

    const categories = ['All', ...new Set(products.map(p => p.kategori).filter(Boolean))];
    const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => p.kategori === selectedCategory);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#050505] text-white font-sans selection:bg-[#800000]/30">

            {/* ========================================== */}
            {/* PANEL 1: LOBBY (ANTREAN VERIFIKASI) - 25% */}
            {/* ========================================== */}
            <div className="w-1/4 h-full flex flex-col bg-[#0a0a0a] border-r border-white/10 shrink-0">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#111]">
                    <div>
                        <h2 className="font-black text-sm uppercase tracking-widest text-white flex items-center gap-2"><User size={16} className="text-[#800000]" /> 1. LOBBY</h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Antrean Belum Verifikasi</p>
                    </div>
                    <div className="flex gap-1 items-center">
                        <button onClick={simulateCustomer} className="p-2 hover:bg-white/10 flex items-center gap-1 rounded-lg text-blue-400 font-bold text-[9px] uppercase tracking-widest transition-colors" title="Simulasi Customer Baru">
                            <Plus size={12} /> Test
                        </button>
                        <button onClick={fetchTodaySchedule} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Refresh Data">
                            <RefreshCw size={14} className={`text-gray-400 ${loadingBookings ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {loadingBookings ? (
                        <p className="text-center text-gray-600 text-[10px] uppercase font-bold animate-pulse mt-10">Mencari Data...</p>
                    ) : queueBookings.length === 0 ? (
                        <p className="text-center text-gray-600 text-[10px] uppercase font-bold mt-10">Tidak ada antrean</p>
                    ) : (
                        queueBookings.map(booking => (
                            <div key={booking.id} className="bg-[#111] border border-white/10 p-4 rounded-xl flex flex-col gap-3 shadow-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-black text-base uppercase tracking-tighter leading-none">{booking.nama}</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{booking.paket}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-[#800000]">{booking.jam}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${booking.tipe_bayar === 'PAID' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-orange-500/20 text-orange-500 border border-orange-500/30'}`}>
                                        {booking.tipe_bayar === 'PAID' ? 'CEK LIVIN (QRIS)' : 'KEEP SLOT'}
                                    </span>
                                    <button
                                        onClick={() => handleVerifyArrival(booking.id)}
                                        className="bg-white text-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all flex items-center gap-1"
                                    >
                                        Verified <ArrowRight size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ========================================== */}
            {/* PANEL 2: IN-STUDIO (SEDANG SESI) - 25% */}
            {/* ========================================== */}
            <div className="w-1/4 h-full flex flex-col bg-[#111] border-r border-white/10 shrink-0 shadow-[-10px_0_20px_rgba(0,0,0,0.5)] z-10">
                <div className="p-4 border-b border-white/10 bg-[#161616]">
                    <h2 className="font-black text-sm uppercase tracking-widest text-white flex items-center gap-2"><Camera size={16} className="text-[#800000]" /> 2. IN-STUDIO</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Sedang Foto / Pilih File</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {activeBookings.length === 0 ? (
                        <p className="text-center text-gray-600 text-[10px] uppercase font-bold mt-10">Studio Kosong</p>
                    ) : (
                        activeBookings.map(booking => (
                            <div key={booking.id} className="bg-[#1a1a1a] border border-[#800000]/30 p-4 rounded-xl flex flex-col gap-3 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-1 h-full bg-[#800000]"></div>
                                <div>
                                    <p className="font-black text-base uppercase tracking-tighter leading-none text-white">{booking.nama}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{booking.paket} {booking.background ? `(${booking.background})` : ''}</p>
                                </div>
                                <button
                                    disabled={selectedBookingForCheckout?.id === booking.id}
                                    onClick={() => handleStartCheckout(booking)}
                                    className="w-full bg-[#800000] text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-900 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {selectedBookingForCheckout?.id === booking.id ? 'SEDANG CHECKOUT...' : 'Tarik ke Kasir (Checkout)'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ========================================== */}
            {/* PANEL 3: CASHIER & UPSELL (KERANJANG) - 50% */}
            {/* ========================================== */}
            <div className="w-2/4 h-full flex flex-col bg-[#050505] shrink-0 shadow-[-20px_0_40px_rgba(0,0,0,0.8)] z-20 relative">

                {/* STATE 1: KOSONG (Kru belum narik nama dari Studio) */}
                {!selectedBookingForCheckout ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <PackagePlus size={48} className="text-gray-800 mb-4" />
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Kasir Standby</h2>
                        <p className="text-xs text-gray-500 uppercase tracking-widest max-w-xs">Tarik nama dari antrean IN-STUDIO untuk memproses penambahan Add-On & Struk Pelunasan.</p>
                    </div>
                ) : (
                    /* STATE 2: MODE CHECKOUT AKTIF (Terbelah jadi Katalog & Keranjang) */
                    <div className="flex flex-1 overflow-hidden">

                        {/* 3A. KATALOG ADD-ON FISIK (Print / Frame) */}
                        <div className="w-1/2 flex flex-col border-r border-white/10 bg-[#0a0a0a]">
                            <div className="p-4 border-b border-white/10 bg-[#111]">
                                <h2 className="font-black text-xs uppercase tracking-widest text-white flex items-center gap-2">Menu OTS / Add-On</h2>
                            </div>

                            <div className="flex gap-2 overflow-x-auto p-3 scrollbar-hide border-b border-white/5 bg-[#050505]">
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-[#111] text-gray-500 border-white/10 hover:text-white'}`}>
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 gap-2 content-start custom-scrollbar">
                                {filteredProducts.map(product => {
                                    let displayPrice = product.price || product.harga;
                                    if (product.tipe_harga === 'bertingkat') displayPrice = product.tier_1;

                                    return (
                                        <button key={product.id} onClick={() => addToCart(product)} className="w-full p-4 rounded-xl transition-all border border-white/10 hover:border-[#800000] group flex items-center justify-between text-left bg-[#111] shadow-sm">
                                            <div>
                                                <h3 className="font-black text-white text-xs uppercase tracking-wider">{product.name || product.nama}</h3>
                                                <div className="font-bold text-[#800000] text-[10px] mt-1">
                                                    {formatCurrency(displayPrice)}
                                                    {product.tipe_harga === 'bertingkat' && <span className="text-[8px] font-normal text-gray-500 ml-1">+tier</span>}
                                                </div>
                                            </div>
                                            <div className="h-6 w-6 rounded-full bg-black border border-white/10 flex items-center justify-center text-gray-500 group-hover:bg-[#800000] group-hover:text-white group-hover:border-[#800000] transition-colors shrink-0">
                                                <Plus size={12} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3B. KERANJANG FINAL & PEMBAYARAN */}
                        <div className="w-1/2 flex flex-col bg-[#111] relative">
                            {/* Header Keranjang Aktif */}
                            <div className="p-4 border-b border-white/10 bg-[#1a1a1a] flex justify-between items-center">
                                <div>
                                    <h2 className="font-black text-xs uppercase tracking-widest text-white">Active Checkout</h2>
                                    <p className="text-[9px] font-black text-blue-400 mt-1 uppercase tracking-widest">
                                        Pelanggan: {customer.name}
                                    </p>
                                </div>
                                <button onClick={handleCancelCheckout} className="p-1.5 bg-red-900/20 text-red-500 hover:bg-red-900 hover:text-white rounded-lg transition-colors" title="Batal Checkout">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* List Item Keranjang */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                {cart.map(item => {
                                    let itemTotal = 0; let singlePriceDisplay = 0;
                                    if (item.tipe_harga === 'bertingkat') {
                                        if (item.qty === 1) itemTotal = item.tier_1 || 0;
                                        else if (item.qty === 2) itemTotal = item.tier_2 || item.tier_1 || 0;
                                        else if (item.qty === 3) itemTotal = item.tier_3 || item.tier_2 || item.tier_1 || 0;
                                        else itemTotal = (item.tier_3 || item.tier_2 || item.tier_1 || 0) + ((item.qty - 3) * (item.tier_lebih || 0));
                                        singlePriceDisplay = itemTotal / item.qty;
                                    } else {
                                        singlePriceDisplay = item.price || item.harga || 0;
                                        itemTotal = singlePriceDisplay * item.qty;
                                    }

                                    const isWebBase = item.name?.includes('[WEB]');

                                    return (
                                        <div key={item.id} className={`flex flex-col gap-2 p-3 rounded-xl border ${isWebBase ? 'border-blue-900/50 bg-blue-900/10' : 'border-white/10 bg-[#0a0a0a]'}`}>
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black text-white uppercase tracking-wider leading-tight">
                                                    {item.name || item.nama}
                                                    {isWebBase && <span className="ml-2 bg-blue-500 text-black text-[7px] px-1.5 py-0.5 rounded-full uppercase font-black">Base Web</span>}
                                                </span>
                                                {!isWebBase && (
                                                    <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                {!isWebBase ? (
                                                    <div className="flex items-center bg-black rounded-lg border border-white/10">
                                                        <button onClick={() => updateQty(item.id, -1)} className="p-1.5 text-gray-400 hover:text-white"><Minus size={10} /></button>
                                                        <span className="w-5 text-center text-[10px] font-black text-white">{item.qty}</span>
                                                        <button onClick={() => updateQty(item.id, 1)} className="p-1.5 text-gray-400 hover:text-white"><Plus size={10} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Fixed Item</div>
                                                )}
                                                <div className="text-right">
                                                    <div className="font-black text-xs text-white">{formatCurrency(itemTotal)}</div>
                                                    {!isWebBase && <div className="text-[8px] text-gray-500">@{formatCurrency(singlePriceDisplay)}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Area Tagihan Final */}
                            <div className="p-4 bg-[#0a0a0a] border-t border-white/10">
                                <div className="flex gap-2 mb-4">
                                    <button onClick={() => setCustomer({ ...customer, payment: 'QRIS' })} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${customer.payment === 'QRIS' ? 'border-[#00A86B] bg-[#00A86B]/20 text-[#00A86B]' : 'bg-[#111] border-white/5 text-gray-500 hover:text-white'}`}>QRIS / Transfer</button>
                                    <button onClick={() => setCustomer({ ...customer, payment: 'CASH' })} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${customer.payment === 'CASH' ? 'border-green-500 bg-green-500/20 text-green-400' : 'bg-[#111] border-white/5 text-gray-500 hover:text-white'}`}>CASH (Tunai)</button>
                                </div>

                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tagihan Akhir</span>
                                    <span className="text-2xl font-black text-white">{formatCurrency(total)}</span>
                                </div>

                                <button onClick={() => setShowReceiptPreview(true)} disabled={!canPay} className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${canPay ? 'bg-white text-black hover:bg-gray-200 active:scale-95' : 'bg-surface-800 text-gray-600 border border-white/5 cursor-not-allowed'}`}>
                                    <CreditCard size={16} /> Konfirmasi Lunas & Cetak Struk
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================== */}
            {/* RECEIPT PREVIEW MODAL (OVERLAY MUTLAK)     */}
            {/* ========================================== */}
            {showReceiptPreview && (
                <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
                            <h3 className="font-black text-sm text-white uppercase tracking-widest">Preview Struk</h3>
                            <button onClick={() => setShowReceiptPreview(false)} className="p-1.5 bg-surface-800 hover:bg-white/20 rounded-full text-gray-400 transition-colors"><X size={16} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-[#050505] flex justify-center">
                            <div className="shadow-2xl shadow-black">
                                <Receipt ref={receiptRef} cart={cart} total={total} subtotal={total} paymentMethod={customer.payment} customer={customer} />
                            </div>
                        </div>

                        <div className="p-4 bg-[#1a1a1a] border-t border-white/10 flex flex-col sm:flex-row gap-2">
                            <button onClick={() => setShowReceiptPreview(false)} className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 bg-surface-800 hover:bg-surface-700 hover:text-white transition-all">
                                Batal
                            </button>
                            <div className="flex flex-1 gap-2">
                                <button onClick={handleShareReceipt} className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-black bg-white hover:bg-gray-200 shadow-lg transition-all" title="Download Image untuk dikirim ke IG DM">
                                    Simpan JPG
                                </button>
                                <button onClick={handleConfirmAndPay} className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white bg-[#800000] hover:bg-red-900 flex items-center justify-center gap-1 shadow-lg transition-all" title="Print Fisik">
                                    <Printer size={14} /> Print
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSModule;