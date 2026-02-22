import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Check, AlertTriangle, ShieldCheck, X, Camera, DollarSign, Wallet, CreditCard } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
const ShiftSummary = ({ onClose }) => {
    const { stats } = useFinance();
    const { logout, user } = useAuth();

    // Intern Flow: Skip to Face Scan (Step 3)
    // Check for both uppercase INTERN role and Intern posisi
    const isIntern = user?.role === 'INTERN' || user?.posisi === 'Intern';
    const [step, setStep] = useState(isIntern ? 3 : 1);
    const [physicalCash, setPhysicalCash] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const webcamRef = useRef(null);

    const formatRp = (val) => 'Rp ' + val.toLocaleString('id-ID');

    const handleCashVerification = (e) => {
        e.preventDefault();
        const diff = parseInt(physicalCash) - stats.cash;
        if (Math.abs(diff) > 1000) { // Allow small margin
            if (!window.confirm(`Ada selisih Rp ${diff.toLocaleString('id-ID')}. Lanjutkan?`)) return;
        }
        setStep(3);
    };

    const [isUploading, setIsUploading] = useState(false);

    const handleScan = async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);
        setIsUploading(true);

        try {
            // 1. Convert Base64 to Blob
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const fileName = `checkout_${user?.id}_${Date.now()}.jpg`;

            // 2. Upload to Supabase Storage (assuming bucket 'attendance_photos' exists)
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('attendance_photos')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                });

            if (uploadError) {
                console.error("Upload error details:", uploadError);
                throw uploadError;
            }

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('attendance_photos')
                .getPublicUrl(fileName);

            // 4. Update Attendance Record in DB
            // Assuming there's an active attendance record for this user today
            const { error: dbError } = await supabase
                .from('attendance')
                .update({
                    check_out: new Date().toISOString(),
                    photo_url: publicUrl,
                    status: 'completed'
                })
                .eq('user_id', user?.id)
                .eq('status', 'active');

            if (dbError) throw dbError;

        } catch (error) {
            console.error("Failed to upload face scan or update attendance:", error);
            alert(`Gagal mengunggah foto absen: ${error.message || 'Error tidak diketahui'}\n\nPastikan bucket 'attendance_photos' sudah dibuat di Supabase dan memiliki akses Public/Insert.\n\nSession ini tetap akan diakhiri.`);
        } finally {
            setIsUploading(false);
            logout();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-900 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-950">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">End of Shift</h2>
                        <p className="text-gray-400 text-sm">Hi {user?.name}, verifikasi shift anda.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-900 dark:text-white/50 hover:text-gray-900 dark:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto">
                    {/* Step 1: Revenue Summary */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl">
                                    <div className="text-emerald-500 mb-2"><DollarSign size={24} /></div>
                                    <div className="text-xs font-bold text-emerald-400 uppercase">Today Revenue</div>
                                    <div className="text-xl font-black text-gray-900 dark:text-white">{formatRp(stats.revenue)}</div>
                                </div>
                                <div className="p-4 bg-orange-900/20 border border-emerald-500/30 rounded-2xl">
                                    <div className="text-orange-500 mb-2"><Wallet size={24} /></div>
                                    <div className="text-xs font-bold text-orange-400 uppercase">Cash</div>
                                    <div className="text-xl font-black text-gray-900 dark:text-white">{formatRp(stats.cash)}</div>
                                </div>
                                <div className="p-4 bg-purple-900/20 border border-blue-500/30 rounded-2xl">
                                    <div className="text-purple-500 mb-2"><CreditCard size={24} /></div>
                                    <div className="text-xs font-bold text-purple-400 uppercase">QRIS</div>
                                    <div className="text-xl font-black text-gray-900 dark:text-white">{formatRp(stats.qris)}</div>
                                </div>
                            </div>

                            <div className="bg-surface-800 p-6 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Verifikasi Uang Tunai</h3>
                                <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                                    <label className="block text-sm text-gray-400 mb-2">Hitung jumlah uang tunai:</label>
                                    <input
                                        type="number"
                                        required
                                        autoFocus
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xl font-mono text-white focus:border-primary outline-none mb-4"
                                        placeholder="0"
                                        value={physicalCash}
                                        onChange={e => setPhysicalCash(e.target.value)}
                                    />
                                    <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all">
                                        Verifikasi
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Confirmation */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className={`p-6 rounded-2xl border ${parseInt(physicalCash) === stats.cash ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    {parseInt(physicalCash) === stats.cash
                                        ? <><Check className="text-green-500" /> PAS!</>
                                        : <><AlertTriangle className="text-red-500" /> FAILED!</>
                                    }
                                </h3>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-400">
                                        <span>System Cash:</span>
                                        <span className="text-gray-900 dark:text-white font-mono">{formatRp(stats.cash)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span>Real Cash:</span>
                                        <span className="text-gray-900 dark:text-white font-mono">{formatRp(parseInt(physicalCash || 0))}</span>
                                    </div>
                                    <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                                        <span className={parseInt(physicalCash) === stats.cash ? 'text-green-500' : 'text-red-500'}>Selisih:</span>
                                        <span className={parseInt(physicalCash) - stats.cash === 0 ? 'text-green-500' : 'text-red-500'}>
                                            {formatRp(parseInt(physicalCash || 0) - stats.cash)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleCashVerification} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                                <ShieldCheck size={20} /> Konfirmasi & Scan Wajah
                            </button>
                        </div>
                    )}

                    {/* Step 3: Face Scan */}
                    {step === 3 && (
                        <div className="flex flex-col items-center animate-fade-in-up">
                            {capturedImage ? (
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                        <Check className="text-gray-900 dark:text-white" size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Shift Berakhir</h3>
                                    <p className="text-gray-400">Logout berhasil...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-64 h-64 bg-black rounded-full overflow-hidden border-4 border-primary shadow-xl shadow-primary/20 mb-6 relative">
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-6 text-center">Posisikan wajah anda di dalam lingkaran untuk verifikasi checkout.</p>
                                    <button onClick={handleScan} className="px-8 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-all flex items-center gap-2">
                                        <Camera size={20} /> Verifikasi & Logout
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShiftSummary;
