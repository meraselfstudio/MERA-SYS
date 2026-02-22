import React, { useState } from 'react';
import {
    Printer, HardDrive, ChevronRight, User,
    Monitor, Zap, CheckCircle,
    Sun, Moon, Trash2, DollarSign, RotateCcw, Download,
    Lock, X, Shield, ChevronLeft, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { UserCheck, Clock } from 'lucide-react';

/* ── Primitives ─────────────────────────────── */
const Toggle = ({ active, onToggle }) => (
    <button onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${active ? 'bg-primary' : 'bg-white/8 border border-white/10'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${active ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

const Badge = ({ children, color = 'green' }) => {
    const c = {
        green: 'bg-green-500/15 text-green-400 border-green-500/30',
        gray: 'bg-white/5      text-gray-400  border-white/10',
        orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    };
    return <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${c[color] || c.gray}`}>{children}</span>;
};

const Section = ({ title, icon: Icon, accent = 'text-primary', children }) => (
    <section className="rounded-2xl overflow-hidden mb-5"
        style={{ background: 'linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))', boxShadow: '0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/5 border border-white/8 ${accent}`}><Icon size={16} /></div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest">{title}</h3>
        </div>
        <div className="divide-y divide-white/5">{children}</div>
    </section>
);

const Row = ({ title, description, children, onClick, chevron, danger }) => (
    <div className={`px-6 py-4 flex items-center justify-between gap-4 transition-colors ${onClick ? 'cursor-pointer hover:bg-white/3' : ''} ${danger ? 'hover:bg-red-900/10' : ''}`} onClick={onClick}>
        <div className="min-w-0">
            <div className={`font-semibold text-sm ${danger ? 'text-red-400' : 'text-white'}`}>{title}</div>
            {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
            {children}
            {chevron && <ChevronRight size={16} className="text-gray-600" />}
        </div>
    </div>
);

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const fmt = n => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;



/* ─ Modal Past Data removed (moved to Finance via plan) ─ */
/* ── Owner Tools Section ─────────────────────────── */
const SHIFT_OPTS = [
    { value: 'weekday_full', label: 'Weekday Full Time (Senin–Kamis)' },
    { value: 'weekend_shift1', label: 'Weekend Shift 1 / 09–15 (Jumat–Minggu)' },
    { value: 'weekend_shift2', label: 'Weekend Shift 2 / 15–21 (Jumat–Minggu)' },
    { value: 'weekend_full', label: 'Weekend Full Time (Jumat–Minggu)' },
    { value: 'intern', label: 'Intern' },
];

const CATEGORIES = ['Basic Studio', 'Thematic Studio', 'Add Ons', 'Print', 'Merchandise', 'Lainnya'];

const OwnerToolsSection = () => {
    const { resetAll, resetMonth, products, addProduct, updateProduct, deleteProduct } = useFinance();
    const { logout, user } = useAuth();
    const [ownerTab, setOwnerTab] = useState('data'); // 'data' | 'produk'

    // Month Reset State
    const now = new Date();
    const [resetYr, setResetYr] = useState(now.getFullYear());
    const [resetMo, setResetMo] = useState(now.getMonth());

    // Product form
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [prodForm, setProdForm] = useState({
        name: '', category: 'Basic Studio', tipe_harga: 'normal',
        price: '', tier_1: '', tier_2: '', tier_3: '', tier_lebih: ''
    });

    // Product handlers
    const openEditProduct = (p) => {
        setEditingProduct(p);
        setProdForm({
            name: p.name, category: p.category, tipe_harga: p.tipe_harga || 'normal',
            price: p.price ? String(p.price) : '',
            tier_1: p.tier_1 ? String(p.tier_1) : '',
            tier_2: p.tier_2 ? String(p.tier_2) : '',
            tier_3: p.tier_3 ? String(p.tier_3) : '',
            tier_lebih: p.tier_lebih ? String(p.tier_lebih) : '',
        });
        setShowAddProduct(true);
    };
    const saveProduct = () => {
        if (!prodForm.name.trim()) return;
        const data = {
            name: prodForm.name.trim(),
            category: prodForm.category,
            tipe_harga: prodForm.tipe_harga,
            price: parseInt(prodForm.price) || 0,
            tier_1: parseInt(prodForm.tier_1) || 0,
            tier_2: parseInt(prodForm.tier_2) || 0,
            tier_3: parseInt(prodForm.tier_3) || 0,
            tier_lebih: parseInt(prodForm.tier_lebih) || 0,
        };
        if (editingProduct) updateProduct(editingProduct.id, data);
        else addProduct(data);
        setShowAddProduct(false); setEditingProduct(null);
        setProdForm({ name: '', category: 'Basic Studio', tipe_harga: 'normal', price: '', tier_1: '', tier_2: '', tier_3: '', tier_lebih: '' });
    };

    const inp = "bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-primary placeholder-gray-700";

    // Protect Owner Tools so only OWNER can see them
    if (user?.role !== 'OWNER' && user?.role !== 'ADMIN') {
        return null;
    }

    return (
        <>
            <Section title="Owner Tools" icon={Lock} accent="text-amber-400">
                {/* Sub-tabs */}
                <div className="px-6 pt-4 pb-2 flex gap-2">
                    {[['data', '📊 Data'], ['produk', '🛒 Produk']].map(([k, l]) => (
                        <button key={k} onClick={() => setOwnerTab(k)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${ownerTab === k ? 'bg-primary text-white border-primary' : 'bg-white/4 text-gray-400 border-white/8 hover:text-white'}`}>
                            {l}
                        </button>
                    ))}
                    <div className="flex-1" />
                </div>

                {/* TAB: DATA */}
                {ownerTab === 'data' && (<>
                    <Row title="Reset 1 Bulan Data" description="⚠️ Hapus transaksi dan booking untuk bulan tertentu" danger>
                        <div className="flex items-center gap-2">
                            <select className="bg-black/40 border border-white/10 text-white rounded-lg px-2 py-1 text-xs" value={resetMo} onChange={e => setResetMo(Number(e.target.value))}>
                                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                            <input type="number" className="w-16 bg-black/40 border border-white/10 text-white rounded-lg px-2 py-1 text-xs" value={resetYr} onChange={e => setResetYr(Number(e.target.value))} />
                            <button onClick={() => {
                                if (window.confirm(`Yakin reset data untuk ${MONTHS[resetMo]} ${resetYr}?`)) resetMonth(resetYr, resetMo);
                            }} className="p-1.5 rounded-lg bg-red-900/40 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </Row>
                    <Row title="Reset Semua Data" description="⚠️ Hapus semua rekap, booking & checklist"
                        onClick={() => {
                            if (window.confirm('Reset SEMUA data aplikasi?\n\n• Semua transaksi Finance\n• Semua data Booking\n• Checklist & progress\n\nTidak bisa dibatalkan!')) {
                                resetAll(); logout();
                            }
                        }} chevron danger>
                        <Trash2 size={15} className="text-red-900" />
                    </Row>
                </>)}

                {/* TAB: PRODUK */}
                {ownerTab === 'produk' && (<>
                    <div className="px-6 py-3 flex items-center justify-between">
                        <p className="text-xs text-gray-500">{products.length} produk terdaftar</p>
                        <button onClick={() => { setEditingProduct(null); setProdForm({ name: '', category: 'Basic Studio', tipe_harga: 'normal', price: '', tier_1: '', tier_2: '', tier_3: '', tier_lebih: '' }); setShowAddProduct(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all">
                            <Plus size={12} /> Tambah Produk
                        </button>
                    </div>
                    <div className="divide-y divide-white/5">
                        {products.map(p => (
                            <div key={p.id} className={`px-6 py-3 flex items-center gap-3 transition-colors ${!p.active ? 'opacity-40' : ''}`}>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name} {p.tipe_harga === 'bertingkat' && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full ml-1">Bertingkat</span>}</p>
                                    <p className="text-xs text-gray-600">
                                        {p.category} · {p.tipe_harga === 'normal' ? `Rp ${Number(p.price).toLocaleString('id-ID')}` : `Dari Rp ${Number(p.tier_1).toLocaleString('id-ID')}`}
                                    </p>
                                </div>
                                <button onClick={() => updateProduct(p.id, { active: !p.active })}
                                    className={`text-[10px] px-2 py-1 rounded-full font-bold border transition-all ${p.active ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/8 text-gray-600'}`}>
                                    {p.active ? 'AKTIF' : 'OFF'}
                                </button>
                                <button onClick={() => openEditProduct(p)} className="text-gray-600 hover:text-blue-400 p-1.5 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                                <button onClick={() => { if (window.confirm(`Hapus "${p.name}"?`)) deleteProduct(p.id); }}
                                    className="text-red-600/50 hover:text-red-400 p-1.5 transition-colors"><Trash2 size={13} /></button>
                            </div>
                        ))}
                    </div>
                </>)}
            </Section>

            {/* Add/Edit Product Modal */}
            {showAddProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
                    <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: 'rgba(14,2,3,0.98)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 40px 80px rgba(0,0,0,0.9)' }}>
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h3>
                            <button onClick={() => setShowAddProduct(false)} className="text-gray-500 hover:text-gray-900 dark:text-white"><X size={18} /></button>
                        </div>
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                            <div>
                                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Nama Produk</label>
                                <input placeholder="e.g. Add Print" value={prodForm.name} onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))} className={`w-full ${inp}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Kategori</label>
                                    <select value={prodForm.category} onChange={e => setProdForm(f => ({ ...f, category: e.target.value }))} className={`w-full ${inp}`}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Tipe Harga</label>
                                    <select value={prodForm.tipe_harga} onChange={e => setProdForm(f => ({ ...f, tipe_harga: e.target.value }))} className={`w-full ${inp}`}>
                                        <option value="normal">Normal</option>
                                        <option value="bertingkat">Bertingkat</option>
                                    </select>
                                </div>
                            </div>

                            {prodForm.tipe_harga === 'normal' ? (
                                <div>
                                    <label className="block text-xs text-gray-500 font-bold uppercase tracking-wide mb-1.5">Harga (Rp)</label>
                                    <input type="number" placeholder="50000" min={0} value={prodForm.price} onChange={e => setProdForm(f => ({ ...f, price: e.target.value }))} className={`w-full ${inp}`} />
                                </div>
                            ) : (
                                <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 font-bold tracking-wide mb-1.5">Tier 1 (Qty 1)</label>
                                            <input type="number" placeholder="15000" min={0} value={prodForm.tier_1} onChange={e => setProdForm(f => ({ ...f, tier_1: e.target.value }))} className={`w-full ${inp}`} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 font-bold tracking-wide mb-1.5">Tier 2 (Qty 2)</label>
                                            <input type="number" placeholder="30000" min={0} value={prodForm.tier_2} onChange={e => setProdForm(f => ({ ...f, tier_2: e.target.value }))} className={`w-full ${inp}`} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 font-bold tracking-wide mb-1.5">Tier 3 (Qty 3)</label>
                                            <input type="number" placeholder="35000" min={0} value={prodForm.tier_3} onChange={e => setProdForm(f => ({ ...f, tier_3: e.target.value }))} className={`w-full ${inp}`} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 font-bold tracking-wide mb-1.5">Tiap Lebih (Qty &gt; 3)</label>
                                            <input type="number" placeholder="13000" min={0} value={prodForm.tier_lebih} onChange={e => setProdForm(f => ({ ...f, tier_lebih: e.target.value }))} className={`w-full ${inp}`} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowAddProduct(false)} className="flex-1 py-3 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/8">Batal</button>
                            <button onClick={saveProduct} className="flex-1 py-3 rounded-2xl bg-primary text-gray-900 dark:text-white font-bold hover:bg-red-700 shadow-lg shadow-primary/20">Simpan</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
/* ── Settings Page ──────────────────────────────── */
const Settings = () => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { crew, absensi } = useFinance();
    const [autoPrint, setAutoPrint] = useState(false);
    const [soundFX, setSoundFX] = useState(true);

    return (
        <>
            <div className="min-h-screen p-6 pb-16 max-w-2xl mx-auto">
                <div className="mb-8 flex items-center gap-4">
                    <div className="p-3 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <Shield size={24} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Settings</h1>
                        <p className="text-sm text-gray-500">System preferences & crew tools</p>
                    </div>
                </div>

                {/* CREW ON DUTY */}
                <Section title="Crew On Duty" icon={UserCheck} accent="text-green-400">
                    {absensi.length === 0 ? (
                        <div className="px-6 py-5 text-sm text-gray-600 flex items-center gap-2">
                            <Clock size={14} className="text-gray-700" />
                            Belum ada crew yang check-in hari ini
                        </div>
                    ) : (
                        absensi.map(a => (
                            <Row key={a.crewId} title={a.crewName} description={`${a.shiftLabel} · Check-in ${a.time}`}>
                                <Badge color={a.posisi === 'Intern' ? 'orange' : 'green'}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {a.posisi === 'Intern' ? 'INTERN' : 'CREW'}
                                </Badge>
                            </Row>
                        ))
                    )}
                </Section>

                {/* HARDWARE */}
                <Section title="Hardware & Printing" icon={Printer} accent="text-orange-400">
                    <div className="px-6 py-8 text-center">
                        <Printer size={32} className="text-orange-400/50 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">MacOS Exclusive Feature</h4>
                        <p className="text-xs text-gray-500">Hardware & Thermal Printing settings are available exclusively on the Mera OS macOS companion app.</p>
                    </div>
                </Section>

                {/* INTERFACE */}
                <Section title="Interface" icon={Monitor} accent="text-purple-400">
                    <Row title="Sound Effects" description="Suara untuk aksi di kasir & notifikasi">
                        <Toggle active={soundFX} onToggle={() => setSoundFX(p => !p)} />
                    </Row>
                    <Row title="Tema Tampilan" description={`Aktif: ${theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}`}
                        onClick={toggleTheme} chevron>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                            {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
                            {theme === 'dark' ? 'Dark' : 'Light'}
                        </div>
                    </Row>
                    <Row title="Versi Aplikasi"><Badge color="gray">v1.3.0 · Build 3031</Badge></Row>
                </Section>

                {/* OWNER TOOLS */}
                <OwnerToolsSection />

                {/* SYSTEM */}
                <Section title="System" icon={HardDrive} accent="text-gray-400">
                    <Row title="Hapus Cache Lokal" description="Reset data produk · akan reload dari CSV"
                        onClick={() => { if (window.confirm('Hapus cache dan reload?')) { localStorage.clear(); window.location.reload(); } }}
                        chevron danger>
                        <Trash2 size={15} className="text-red-600" />
                    </Row>
                    <Row title="Mera OS"><span className="text-xs text-gray-600">© 2026 Mera Selfstudios</span></Row>
                </Section>

                <div className="rounded-2xl p-5 border border-dashed border-white/8 text-center">
                    <Zap size={18} className="text-primary/40 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-600">Booking & Photobooth integration coming soon</p>
                </div>
            </div>
        </>
    );
};

export default Settings;
