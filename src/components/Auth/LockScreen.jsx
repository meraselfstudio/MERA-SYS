import React, { useState } from 'react';
import AbsensiModule from '../Absensi/AbsensiModule';
import { useAuth } from '../../context/AuthContext';
import { Lock, LogIn } from 'lucide-react';

const LockScreen = () => {
    const { login } = useAuth();
    const [showOwnerLogin, setShowOwnerLogin] = useState(false);
    const [ownerPin, setOwnerPin] = useState('');
    const [showError, setShowError] = useState(false);

    const handleCrewLogin = (crewData) => {
        // Map crew data to session format
        login({
            id: crewData.id,
            name: crewData.name,
            role: crewData.posisi?.toUpperCase() || 'CREW', // Map posisi to role (CREW or INTERN)
            posisi: crewData.posisi, // Keep original for reference
            shift: crewData.shift,
            photo: crewData.img // Assuming image is passed if available
        });
    };

    const tryPin = (p) => {
        if (p === '1609') {
            login({
                id: 'owner',
                name: 'Owner',
                role: 'OWNER',
                shift: null,
            });
        } else {
            setShowError(true);
            setOwnerPin('');
            setTimeout(() => setShowError(false), 500);
        }
    };

    const press = (d) => {
        if (ownerPin.length >= 4) return;
        setShowError(false);
        const next = ownerPin + d;
        setOwnerPin(next);
        if (next.length === 4) setTimeout(() => tryPin(next), 150);
    };

    const deep = { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' };

    return (
        <div className="relative h-screen w-full bg-black">
            {/* Main Attendance Module as Lock Screen */}
            <AbsensiModule onLogin={handleCrewLogin} />

            {/* Owner Login Toggle (Bottom Right) */}
            <div className="absolute bottom-6 right-6 z-50">
                <button
                    onClick={() => setShowOwnerLogin(true)}
                    className="p-3 rounded-full bg-white/5 text-gray-900 dark:text-white/20 hover:text-gray-900 dark:text-white hover:bg-white/10 transition-all"
                    title="Owner Login"
                >
                    <Lock size={16} />
                </button>
            </div>

            {/* Owner Login Modal */}
            {showOwnerLogin && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowOwnerLogin(false)}>
                    <div className={`w-80 rounded-3xl p-8 text-center ${showError ? 'animate-bounce' : ''}`}
                        onClick={e => e.stopPropagation()}
                        style={{ background: 'rgba(10,2,2,0.98)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.9)' }}>
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                            <Lock size={26} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Owner Access</h2>
                        <p className="text-xs text-gray-600 mb-7">Insert PIN</p>
                        <div className="flex justify-center gap-3 mb-2">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${i < ownerPin.length ? (showError ? 'bg-red-500 scale-110' : 'bg-primary scale-110') : 'bg-white/10'}`} />
                            ))}
                        </div>
                        {showError && <p className="text-red-400 text-xs mb-3 font-bold">WRONG PIN</p>}
                        {!showError && <div className="mb-3 h-5" />}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d, i) => (
                                <button key={i}
                                    onClick={() => d === '⌫' ? setOwnerPin(p => p.slice(0, -1)) : d !== '' && press(String(d))}
                                    className={`h-14 rounded-2xl font-bold text-xl transition-all active:scale-90 ${d === '' ? 'invisible' : 'text-white hover:bg-white/8 active:bg-white/15'}`}
                                    style={d !== '' ? deep : {}}>
                                    {d}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => tryPin(ownerPin)} disabled={ownerPin.length < 4}
                            className="w-full py-3 bg-primary hover:bg-red-700 text-white font-bold rounded-2xl transition-all disabled:opacity-30 flex justify-center items-center gap-2">
                            <LogIn size={18} /> Login
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LockScreen;
