import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Palette, Calendar, Sparkles, Users, Clock, Minus, Plus, CheckCircle, Camera, MessageCircle, Phone } from 'lucide-react';

export default function CustomerBooking() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [ticketData, setTicketData] = useState(null);

    // --- DATABASE PRICELIST PDF 2026 ---
    const packages = {
        basic: [
            { id: 'self-photo', name: 'Self Photo Session', price: 50000, desc: '1-2 Orang | 10 Menit | ∞ Jepret | 1 Cetak | Soft File B&W' },
            { id: 'party-photo', name: 'Party Photo Packages', price: 135000, desc: 'Max 8 Orang | 15 Menit | ∞ Jepret | 2 Cetak | Soft File B&W' }
        ],
        thematic: [
            { id: 'graduate', name: 'Graduate Yearbook', price: 70000, desc: '1-2 Orang | 10 Menit | 1 Cetak | All Soft File' },
            { id: 'majestic', name: 'Majestic', price: 50000, desc: '1-2 Orang | 10 Menit | ∞ Jepret | 1 Cetak | All Soft File' },
            { id: 'elevator', name: 'Elevator', price: 50000, desc: '2 Orang | 10 Menit | ∞ Jepret | 1 Cetak | All Soft File' }
        ],
        pasphoto: [
            { id: 'pas-personal', name: 'Pas Photo Personal', price: 80000, desc: '1 Orang | 10 Menit | ∞ Jepret | 2 Lembar 4x6, 5 Lbr 3x4, 3 Lbr 2x3 | All Soft File' },
            { id: 'pas-package', name: 'Pas Photo Packages', price: 100000, desc: '2 Orang | 10 Menit | ∞ Jepret | 3 Cetak | All Soft File' }
        ]
    };

    // --- JADWAL DINAMIS ---
    const generateTimeSlots = (dateString) => {
        if (!dateString) return [];
        const date = new Date(dateString);
        const day = date.getDay();
        let slots = [];

        // 0 is Sunday, 5-6 is Fri-Sat
        const isWeekend = (day === 0 || day >= 5);
        const startHour = isWeekend ? 9 : 12; // 09:00 for weekend, 12:00 for weekday
        const endHour = 21;

        for (let h = startHour; h < endHour; h++) {
            const hourStr = h.toString().padStart(2, '0');
            slots.push(`${hourStr}:00`);
            slots.push(`${hourStr}:30`);
        }

        return slots;
    };

    const basicBackgrounds = ['Light Grey', 'Dusty Pink', 'Blue', 'Maroon', 'Dark Grey', 'Brown'];

    const [form, setForm] = useState({
        kategori: 'basic',
        paket: null,
        background: '',
        tanggal: '',
        jam: '',
        nama: '',
        email: '',
        phone: '',
        instagram: '',
        tipeBayar: 'KEEPSLOT'
    });

    const [addons, setAddons] = useState({
        colored: false, // 15k
        addPerson: 0,   // 15k
        addTime: 0      // 15k
    });

    // --- LOGIKA HARGA ---
    const grandTotal = (form.paket?.price || 0)
        + (addons.colored ? 15000 : 0)
        + (addons.addPerson * 15000)
        + (addons.addTime * 15000);

    // --- SUPABASE FETCH JADWAL ---
    const fetchBookedSlots = async (selectedDate) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('jam')
                .eq('tanggal', selectedDate)
                .not('status', 'in', '("EXPIRED","CANCELLED")');

            if (error) throw error;
            if (data) setBookedSlots(data.map(b => b.jam));
        } catch (error) {
            console.error("Gagal mengambil jadwal:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (form.tanggal) {
            fetchBookedSlots(form.tanggal);
            setForm(prev => ({ ...prev, jam: '' }));
        }
    }, [form.tanggal]);

    // --- SUBMIT FINAL ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 6);

        const payload = {
            nama: form.nama,
            email: form.email,
            whatsapp: form.phone,
            instagram: form.instagram,
            kategori: form.kategori,
            paket: form.paket.name,
            background: form.background,
            add_colored: addons.colored,
            add_person: addons.addPerson,
            add_time: addons.addTime,
            total_tagihan: grandTotal,
            tanggal: form.tanggal,
            jam: form.jam,
            tipe_bayar: form.tipeBayar,
            status: form.tipeBayar === 'KEEPSLOT' ? 'KEEPSLOT' : 'AWAITING_CONFIRMATION',
            expires_at: expiresAt.toISOString(),
        };

        try {
            const { data, error } = await supabase.from('bookings').insert([payload]).select();
            if (error) throw error;
            if (data && data.length > 0) {
                setTicketData(data[0]);
                setStep(form.tipeBayar === 'PAID' ? 4 : 5); // 4 = QRIS, 5 = TIKET
            }
        } catch (error) {
            console.error("Gagal diproses:", error);
            alert("Maaf, slot baru saja diambil orang lain. Coba jam lain.");
            if (form.tanggal) fetchBookedSlots(form.tanggal);
        } finally {
            setLoading(false);
        }
    };

    // =================================================================================
    // RENDER LAYAR 1: LANDING & PILIH PAKET (PDF STYLE IDENTITAS)
    // =================================================================================
    if (step === 1) {
        return (
            <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#800000]">

                {/* HERO SECTION (Landing Page Vibe) */}
                <section className="pt-20 pb-12 px-6 text-center border-b border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#800000]/20 to-transparent opacity-50"></div>
                    <div className="relative z-10">
                        <img src="/mera-logo.png" alt="Mera Studio" className="h-8 invert mx-auto mb-6" />
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Pricelist 2026.</h1>
                        <p className="text-gray-400 text-sm tracking-widest uppercase">Select your canvas to book</p>
                    </div>
                </section>

                {/* KATEGORI TABS */}
                <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 px-4 py-4">
                    <div className="max-w-xl mx-auto flex bg-[#111] p-1 rounded-xl border border-white/5">
                        {['basic', 'thematic', 'pasphoto'].map(kat => (
                            <button
                                key={kat}
                                onClick={() => { setForm({ ...form, kategori: kat, paket: null, background: '' }); setAddons({ colored: false, addPerson: 0, addTime: 0 }); }}
                                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${form.kategori === kat ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                {kat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DAFTAR PAKET (PDF CARD STYLE) */}
                <div className="max-w-xl mx-auto p-4 pb-32">
                    {form.kategori === 'basic' && <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-6 flex items-center gap-3">Basic Studio <span className="h-px bg-white/20 flex-1"></span></h2>}
                    {form.kategori === 'thematic' && <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-6 flex items-center gap-3">Thematic Concept <span className="h-px bg-white/20 flex-1"></span></h2>}
                    {form.kategori === 'pasphoto' && <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-6 flex items-center gap-3">Pas Photo <span className="h-px bg-white/20 flex-1"></span></h2>}

                    <div className="space-y-4">
                        {packages[form.kategori].map(pkg => (
                            <div
                                key={pkg.id}
                                onClick={() => setForm({ ...form, paket: pkg })}
                                className={`relative overflow-hidden p-6 rounded-2xl cursor-pointer transition-all border ${form.paket?.id === pkg.id ? 'bg-[#1a1a1a] border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-[#0a0a0a] border-white/10 hover:border-white/30'}`}
                            >
                                {/* Desain Kartu Harga ala PDF */}
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${form.paket?.id === pkg.id ? 'text-white' : 'text-gray-300'}`}>{pkg.name}</h3>
                                    <div className="text-right">
                                        <span className="block text-[10px] text-gray-500 uppercase tracking-widest">Harga</span>
                                        <span className="text-xl font-black text-[#800000]">{pkg.price / 1000}K</span>
                                    </div>
                                </div>

                                {/* Fitur Split by Pipe (|) meniru list PDF */}
                                <div className="flex flex-wrap gap-2 mt-4 border-t border-white/10 pt-4">
                                    {pkg.desc.split(' | ').map((feature, idx) => (
                                        <span key={idx} className="bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm">
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* KHUSUS BASIC STUDIO: PILIH WARNA BACKGROUND (Ala PDF) */}
                    {form.kategori === 'basic' && form.paket && (
                        <div className="mt-8 p-6 bg-[#111] rounded-2xl border border-[#800000]/30 animate-fade-in">
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#800000] mb-4 flex items-center gap-2"><Palette size={16} /> Background Colors</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {basicBackgrounds.map(bg => (
                                    <button
                                        key={bg}
                                        onClick={() => setForm({ ...form, background: bg })}
                                        className={`py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${form.background === bg ? 'bg-[#800000] text-white border-[#800000] shadow-[0_0_15px_rgba(128,0,0,0.4)]' : 'bg-[#0a0a0a] text-gray-400 border-white/5 hover:border-white/20'}`}
                                    >
                                        {bg}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* FLOATING NEXT BUTTON */}
                <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent z-50">
                    <button
                        disabled={!form.paket || (form.kategori === 'basic' && !form.background)}
                        onClick={() => setStep(2)}
                        className="w-full max-w-xl mx-auto block bg-white text-black py-5 rounded-full font-black text-sm uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-2xl"
                    >
                        Lanjut Pilih Waktu
                    </button>
                </div>
            </div>
        );
    }

    // =================================================================================
    // RENDER LAYAR 2: WAKTU & ADD-ONS 
    // =================================================================================
    if (step === 2) {
        return (
            <div className="min-h-screen bg-[#050505] text-white p-4 pb-32 font-sans max-w-xl mx-auto">
                <button onClick={() => setStep(1)} className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2 hover:text-white">← Kembali</button>

                {/* RINGKASAN KERANJANG SEMENTARA */}
                <div className="bg-[#111] border-l-4 border-[#800000] p-4 rounded-r-2xl mb-8 flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-white uppercase tracking-tighter">{form.paket.name}</h3>
                        {form.background && <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Color: {form.background}</p>}
                    </div>
                    <div className="text-right">
                        <span className="text-[#800000] font-black">{form.paket.price / 1000}K</span>
                    </div>
                </div>

                {/* PILIH JADWAL */}
                <div className="mb-10">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2"><Calendar size={14} /> Tanggal & Jam Sesi</h4>
                    <input
                        type="date" min={new Date().toISOString().split('T')[0]} value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })}
                        className="w-full bg-[#111] border border-white/10 p-4 rounded-xl text-white font-bold mb-4 outline-none focus:border-white/50 uppercase tracking-widest"
                    />
                    {form.tanggal && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {generateTimeSlots(form.tanggal).map(jam => {
                                const isBooked = bookedSlots.includes(jam);
                                return (
                                    <button key={jam} disabled={isBooked || loading} onClick={() => setForm({ ...form, jam })} className={`py-4 rounded-xl text-sm font-black transition-all border ${isBooked ? 'bg-white/5 text-gray-800 border-transparent cursor-not-allowed' : form.jam === jam ? 'bg-white text-black border-white scale-105 shadow-lg' : 'bg-[#111] text-gray-400 border-white/5 hover:border-white/30'}`}>
                                        {isBooked ? 'FULL' : jam}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* ADD-ONS (Murni Orang, Waktu, Colored) */}
                <div className="mb-8 border-t border-white/10 pt-8">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#800000] mb-4 flex items-center gap-2"><Sparkles size={14} /> Add-Ons Area</h4>

                    <div className="space-y-4">
                        {/* Colored Photo (Khusus Basic) */}
                        {form.kategori === 'basic' && (
                            <div className="flex justify-between items-center bg-[#111] border border-white/5 p-5 rounded-2xl">
                                <div>
                                    <p className="font-black text-sm uppercase tracking-tighter">Colored + Edited Photo</p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Semua file berwarna</p>
                                    <p className="text-sm font-black text-[#800000] mt-2">+15K</p>
                                </div>
                                <button onClick={() => setAddons({ ...addons, colored: !addons.colored })} className={`w-14 h-8 rounded-full transition-all relative ${addons.colored ? 'bg-white' : 'bg-gray-800'}`}>
                                    <div className={`w-6 h-6 rounded-full absolute top-1 transition-all ${addons.colored ? 'bg-black left-7' : 'bg-gray-500 left-1'}`}></div>
                                </button>
                            </div>
                        )}

                        {/* Stepper Person & Time */}
                        {[
                            { id: 'addPerson', name: 'Add Person', desc: 'Per 1 Orang tambahan', price: '15', icon: <Users size={16} /> },
                            { id: 'addTime', name: 'Add Time', desc: 'Per 5 Menit tambahan', price: '15', icon: <Clock size={16} /> }
                        ].map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-[#111] border border-white/5 p-5 rounded-2xl">
                                <div className="w-2/3">
                                    <p className="font-black text-sm uppercase tracking-tighter flex items-center gap-2">{item.icon} {item.name}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{item.desc}</p>
                                    <p className="text-sm font-black text-[#800000] mt-2">+{item.price}K</p>
                                </div>
                                <div className="flex items-center bg-black rounded-xl border border-white/10 p-1">
                                    <button onClick={() => setAddons(p => ({ ...p, [item.id]: Math.max(0, p[item.id] - 1) }))} className="p-3 text-gray-500 hover:text-white"><Minus size={14} /></button>
                                    <span className="w-8 text-center text-lg font-black">{addons[item.id]}</span>
                                    <button onClick={() => setAddons(p => ({ ...p, [item.id]: p[item.id] + 1 }))} className="p-3 text-gray-500 hover:text-white"><Plus size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FLOATING CHECKOUT FOOTER */}
                <div className="fixed bottom-0 left-0 w-full p-4 bg-[#0a0a0a] border-t border-white/10 z-50">
                    <div className="max-w-xl mx-auto flex justify-between items-center">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Sementara</p>
                            <p className="text-2xl font-black text-white">Rp {grandTotal.toLocaleString('id-ID')}</p>
                        </div>
                        <button
                            disabled={!form.tanggal || !form.jam}
                            onClick={() => setStep(3)}
                            className="bg-[#800000] text-white py-4 px-8 rounded-full font-black text-sm uppercase tracking-widest disabled:opacity-20 transition-all"
                        >
                            Isi Data Diri
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // =================================================================================
    // RENDER LAYAR 3: DATA DIRI & CHECKOUT FINAL
    // =================================================================================
    if (step === 3) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 font-sans">
                <div className="w-full max-w-md bg-[#111] p-6 sm:p-8 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">

                    <button onClick={() => setStep(2)} className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-8 flex items-center gap-2 hover:text-white">← Edit Jadwal</button>

                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 text-center">Secure Slot.</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 mb-8">
                            <input type="text" required placeholder="NAMA LENGKAP" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className="w-full bg-black border border-white/10 p-5 rounded-xl text-white font-bold uppercase tracking-wider text-sm outline-none focus:border-white transition-colors" />
                            <div className="relative">
                                <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input type="tel" required placeholder="WHATSAPP (08...)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-black border border-white/10 p-5 pl-12 rounded-xl text-white font-bold uppercase tracking-wider text-sm outline-none focus:border-white transition-colors" />
                            </div>
                            <input type="email" required placeholder="EMAIL (UNTUK FILE)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-black border border-white/10 p-5 rounded-xl text-white font-bold uppercase tracking-wider text-sm outline-none focus:border-white transition-colors" />
                            <input type="text" required placeholder="INSTAGRAM (@USERNAME)" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} className="w-full bg-black border border-white/10 p-5 rounded-xl text-white font-bold uppercase tracking-wider text-sm outline-none focus:border-white transition-colors" />
                        </div>

                        <div className="space-y-3 mb-8">
                            <button type="button" onClick={() => setForm({ ...form, tipeBayar: 'KEEPSLOT' })} className={`w-full p-5 rounded-xl border flex justify-between items-center transition-all ${form.tipeBayar === 'KEEPSLOT' ? 'border-white bg-white/10' : 'border-white/5 bg-black'}`}>
                                <div className="text-left">
                                    <p className="font-black text-sm uppercase tracking-widest">Keep Slot</p>
                                    <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">Bayar di Studio. Hangus 6 Jam.</p>
                                </div>
                                {form.tipeBayar === 'KEEPSLOT' && <CheckCircle className="text-white w-5 h-5" />}
                            </button>

                            <button type="button" onClick={() => setForm({ ...form, tipeBayar: 'PAID' })} className={`w-full p-5 rounded-xl border flex justify-between items-center transition-all ${form.tipeBayar === 'PAID' ? 'border-[#00A86B] bg-[#00A86B]/10' : 'border-white/5 bg-black'}`}>
                                <div className="text-left">
                                    <p className="font-black text-sm uppercase tracking-widest text-[#00A86B]">Full Paid (QRIS)</p>
                                    <p className="text-[9px] text-[#00A86B]/70 mt-1 uppercase tracking-widest">Kunci permanen tanpa risiko.</p>
                                </div>
                                {form.tipeBayar === 'PAID' && <CheckCircle className="text-[#00A86B] w-5 h-5" />}
                            </button>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-white text-black py-5 rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50 transition-all shadow-2xl flex justify-center items-center gap-2">
                            {loading ? 'PROCESSING...' : `PAY RP ${grandTotal.toLocaleString('id-ID')}`}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // =================================================================================
    // RENDER LAYAR 4 & 5: QRIS & TIKET (Disatukan ringkas)
    // =================================================================================
    if (step === 4 || step === 5) {
        const shortId = ticketData?.id?.split('-')[0].toUpperCase() || 'MERA';

        if (step === 4) {
            return (
                <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
                    <h2 className="text-2xl font-black uppercase mb-6 text-center">Scan to Pay</h2>
                    <div className="w-64 h-64 bg-white rounded-2xl mb-8 flex items-center justify-center">QRIS DISINI</div>
                    <button onClick={() => setStep(5)} className="bg-[#00A86B] w-full max-w-xs py-4 rounded-xl font-black uppercase tracking-widest">I HAVE PAID</button>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm bg-[#111] border border-white/20 p-8 rounded-3xl text-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#800000] rounded-full blur-[50px] opacity-30"></div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Booking Confirmed</p>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">{shortId}</h1>

                    <div className="text-left bg-black p-4 rounded-xl mb-8 border border-white/5 space-y-2">
                        <p className="text-xs font-bold text-gray-400">NAMA: <span className="text-white">{ticketData?.nama}</span></p>
                        <p className="text-xs font-bold text-gray-400">WAKTU: <span className="text-white">{ticketData?.tanggal} | {ticketData?.jam}</span></p>
                        <p className="text-xs font-bold text-gray-400">PAKET: <span className="text-white">{ticketData?.paket}</span></p>
                    </div>

                    <div className="w-full h-24 bg-white rounded-xl mb-6 flex items-center justify-center"><Camera className="text-black" /></div>

                    <a
                        href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                            `Halo Méra Studio!\n\nSaya ingin konfirmasi booking:\nID: ${shortId}\nNama: ${ticketData?.nama}\nJadwal: ${ticketData?.tanggal} | ${ticketData?.jam}\nPaket: ${ticketData?.paket}\n\nLink OS: os.meraselfstudio.com`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:brightness-110 transition-all mb-4"
                    >
                        <MessageCircle size={20} />
                        Konfirmasi via WA
                    </a>

                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Screenshot for entry</p>
                </div>
            </div>
        );
    }
}