import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { LogIn, LogOut, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/* ── helpers ─────────────────────────────────────── */
const INTERN_KEY = 'intern_sessions';
const loadSessions = () => { try { return JSON.parse(localStorage.getItem(INTERN_KEY)) || []; } catch { return []; } };
const saveSessions = (s) => localStorage.setItem(INTERN_KEY, JSON.stringify(s));

const pad = (n) => String(n).padStart(2, '0');

/* ── LiveClock ───────────────────────────────────── */
const LiveClock = () => {
    const [now, setNow] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    return (
        <div className="text-center select-none">
            <div className="text-6xl font-black font-mono text-gray-900 dark:text-white tracking-tight">
                {pad(h)}<span className="opacity-50 animate-pulse">:</span>{pad(m)}<span className="opacity-30 text-4xl">:{pad(s)}</span>
            </div>
            <div className="text-gray-500 text-sm mt-2">
                {format(now, 'EEEE, dd MMMM yyyy', { locale: localeId })}
            </div>
        </div>
    );
};

/* ── Main Page ───────────────────────────────────── */
const AbsensiPage = () => {
    const { crew, addAbsensi } = useFinance();
    const navigate = useNavigate();
    const interns = crew.filter(c => c.posisi === 'Intern' || c.status_gaji === 'INTERN');

    const [sessions, setSessions] = useState(loadSessions);
    const [step, setStep] = useState('select'); // 'select' | 'confirm-in' | 'confirm-out' | 'done'
    const [selectedIntern, setSelectedIntern] = useState(null);
    const [action, setAction] = useState(null); // 'in' | 'out'
    const [result, setResult] = useState(null);

    const todayStr = new Date().toISOString().slice(0, 10);

    // Check if intern has active session today
    const getSession = (internId) => sessions.find(s => s.internId === internId && s.date === todayStr && !s.checkout);
    const hasClockedIn = (internId) => !!getSession(internId);

    const selectIntern = (intern) => {
        setSelectedIntern(intern);
        setAction(hasClockedIn(intern.id) ? 'out' : 'in');
        setStep('confirm');
    };

    const confirm = () => {
        const now = new Date();
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

        if (action === 'in') {
            const session = {
                id: `IS-${Date.now()}`,
                internId: selectedIntern.id,
                internName: selectedIntern.name,
                date: todayStr,
                checkin: timeStr,
                checkout: null,
            };
            const next = [...sessions, session];
            setSessions(next);
            saveSessions(next);

            // Record in FinanceContext attendance
            addAbsensi({
                crewId: selectedIntern.id,
                crewName: selectedIntern.name,
                posisi: selectedIntern.posisi,
                shiftLabel: 'Intern Shift',
            });

            setResult({ action: 'in', name: selectedIntern.name, time: timeStr });
        } else {
            const existing = getSession(selectedIntern.id);
            if (existing) {
                const next = sessions.map(s => s.id === existing.id ? { ...s, checkout: timeStr } : s);
                setSessions(next);
                saveSessions(next);
            }
            setResult({ action: 'out', name: selectedIntern.name, time: timeStr });
        }
        setStep('done');
    };

    const reset = () => {
        setStep('select');
        setSelectedIntern(null);
        setAction(null);
        setResult(null);
    };

    /* ── RENDER ────────────────────────────────────── */
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at top, rgba(120,0,20,0.18) 0%, #050505 60%)' }}>

            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)' }} />
            </div>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 px-6 py-5 flex items-center justify-between z-10">
                <button onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors">
                    <ArrowLeft size={14} /> Dashboard
                </button>
                <div className="text-xs text-gray-700 font-mono uppercase tracking-widest">MERA OS · INTERN LOGIN</div>
            </div>

            <div className="z-10 w-full max-w-md flex flex-col items-center gap-8">

                {/* Clock */}
                <LiveClock />

                {/* Screen: SELECT */}
                {step === 'select' && (
                    <div className="w-full space-y-3">
                        <p className="text-center text-xs text-gray-600 uppercase tracking-widest font-bold mb-4">Pilih Identitas</p>
                        {interns.length === 0 && (
                            <p className="text-center text-gray-700 text-sm">Belum ada intern terdaftar</p>
                        )}
                        {interns.map(intern => {
                            const active = hasClockedIn(intern.id);
                            const session = getSession(intern.id);
                            return (
                                <button key={intern.id} onClick={() => selectIntern(intern)}
                                    className={`w-full flex items-center px-5 py-4 rounded-2xl border transition-all group ${active
                                            ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10'
                                            : 'border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15'
                                        }`}>
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${active ? 'bg-green-500/20 text-green-400' : 'bg-white/8 text-gray-400'
                                        }`}>
                                        {intern.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 ml-4 text-left">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{intern.name}</p>
                                        <p className={`text-xs mt-0.5 ${active ? 'text-green-400' : 'text-gray-600'}`}>
                                            {active ? `● Check-in ${session?.checkin}` : '○ Belum check-in'}
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${active
                                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                            : 'bg-green-500/10 border-green-500/20 text-green-400'
                                        }`}>
                                        {active ? <LogOut size={12} /> : <LogIn size={12} />}
                                        {active ? 'Clock Out' : 'Clock In'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Screen: CONFIRM */}
                {step === 'confirm' && selectedIntern && (
                    <div className="w-full flex flex-col items-center gap-6">
                        {/* Big avatar */}
                        <div className={`w-28 h-28 rounded-full flex items-center justify-center text-5xl font-black border-4 ${action === 'in'
                                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                : 'bg-red-500/10 border-red-500/30 text-red-300'
                            }`}>
                            {selectedIntern.name.charAt(0)}
                        </div>

                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{selectedIntern.name}</p>
                            <p className="text-sm text-gray-500 mt-1">Intern · {action === 'in' ? 'Clock In sekarang?' : 'Clock Out sekarang?'}</p>
                        </div>

                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${action === 'in'
                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                            <Clock size={14} />
                            {action === 'in' ? 'CLOCK IN' : 'CLOCK OUT'}
                        </div>

                        <div className="flex gap-4 w-full max-w-xs">
                            <button onClick={reset}
                                className="flex-1 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-gray-400 font-bold hover:bg-white/8 transition-all">
                                Batal
                            </button>
                            <button onClick={confirm}
                                className={`flex-1 py-3.5 rounded-2xl font-bold text-white transition-all shadow-lg ${action === 'in'
                                        ? 'bg-green-600 hover:bg-green-500 shadow-green-900/30'
                                        : 'bg-red-600 hover:bg-red-500 shadow-red-900/30'
                                    }`}>
                                {action === 'in' ? 'Check In ✓' : 'Check Out ✓'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Screen: DONE */}
                {step === 'done' && result && (
                    <div className="w-full flex flex-col items-center gap-6">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${result.action === 'in' ? 'bg-green-500/15 text-green-400' : 'bg-blue-500/15 text-blue-400'
                            }`}>
                            {result.action === 'in' ? <LogIn size={40} /> : <LogOut size={40} />}
                        </div>

                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {result.action === 'in' ? 'Selamat Datang!' : 'Sampai Jumpa!'}
                            </p>
                            <p className="text-lg text-gray-400 mt-1 font-bold">{result.name}</p>
                            <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-600">
                                <Clock size={14} />
                                <span>{result.action === 'in' ? 'Check-in' : 'Check-out'} pada <span className="text-gray-900 dark:text-white font-mono font-bold">{result.time}</span></span>
                            </div>
                        </div>

                        <button onClick={reset}
                            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary hover:bg-red-700 text-white font-bold shadow-lg shadow-primary/20 transition-all">
                            Selesai <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                {/* Today's log strip */}
                {sessions.filter(s => s.date === todayStr).length > 0 && step === 'select' && (
                    <div className="w-full">
                        <p className="text-[10px] text-gray-700 uppercase tracking-widest mb-2 text-center">Log Hari Ini</p>
                        <div className="space-y-1.5">
                            {sessions.filter(s => s.date === todayStr).map(s => (
                                <div key={s.id} className="flex items-center px-4 py-2.5 rounded-xl border border-white/6 bg-white/2 text-xs">
                                    <div className="w-6 h-6 rounded-full bg-white/8 text-gray-900 dark:text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                        {s.internName.charAt(0)}
                                    </div>
                                    <span className="ml-3 text-gray-400 flex-1">{s.internName}</span>
                                    <span className="text-green-400 font-mono">{s.checkin}</span>
                                    {s.checkout && <><span className="text-gray-700 mx-2">→</span><span className="text-red-400 font-mono">{s.checkout}</span></>}
                                    {!s.checkout && <span className="ml-3 text-[9px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-full">ACTIVE</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AbsensiPage;
