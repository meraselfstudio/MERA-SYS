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

    const handleOwnerLogin = (e) => {
        e.preventDefault();
        // Simple hardcoded PIN for Owner (////) as per finance module)
        if (ownerPin === '1609') {
            login({
                id: 'owner',
                name: 'Owner',
                role: 'OWNER',
                shift: null,
            });
        } else {
            setShowError(true);
            setOwnerPin('');
            setTimeout(() => setShowError(false), 2000);
        }
    };

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
                    <div className="bg-surface-900 border border-white/10 p-8 rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <Lock size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Owner Access</h2>
                            <p className={`text-sm mt-1 transition-colors ${showError ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                {showError ? '❌ Try Again!' : 'Input PIN'}
                            </p>
                        </div>

                        <form onSubmit={handleOwnerLogin} className="space-y-4">
                            <input
                                type="password"
                                value={ownerPin}
                                onChange={e => setOwnerPin(e.target.value)}
                                placeholder="PIN"
                                autoFocus
                                className={`w-full bg-black/50 border rounded-xl px-4 py-3 text-center text-white text-xl tracking-[0.5em] focus:outline-none transition-colors ${showError ? 'border-red-500 shake' : 'border-white/10 focus:border-primary'
                                    }`}
                            />
                            <button
                                type="submit"
                                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <LogIn size={18} />
                                Enter System
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LockScreen;
