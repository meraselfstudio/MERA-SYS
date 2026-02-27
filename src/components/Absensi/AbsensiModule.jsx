import React, { useState, useRef, useEffect, memo } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, X, User, Clock, Home } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { supabase } from '../../lib/supabase';

// ─── KONSTANTA SHIFT (Sesuai Doc 4.2) ────────────────────────────────────────
// Weekday (Senin–Kamis): Full Day 12:00–21:00 = Rp 75.000
// Weekend (Jumat–Minggu): Half Shift = Rp 35.000 / Full Day = Rp 100.000
const SHIFTS = [
    { id: 'weekday_full', label: 'Weekday Full Day', time: '12:00 – 21:00', salary: 75000, isWeekend: false, startHour: 12, startMin: 0 },
    { id: 'weekend_shift1', label: 'Weekend Pagi', time: '09:00 – 15:00', salary: 35000, isWeekend: true, startHour: 9, startMin: 0 },
    { id: 'weekend_shift2', label: 'Weekend Malam', time: '15:00 – 21:00', salary: 35000, isWeekend: true, startHour: 15, startMin: 0 },
    { id: 'weekend_full', label: 'Weekend Full Day', time: '09:00 – 21:00', salary: 100000, isWeekend: true, startHour: 9, startMin: 0 },
];

// Rate denda per menit (Rp) — configurable (doc 4.3: dikonfigurasi di tabel pengaturan/settings)
const DENDA_PER_MENIT = 500;
// Grace period: 10 menit (doc 4.3)
const GRACE_PERIOD_MENIT = 10;

// Auto-pick the most likely shift based on current day & hour
const getAutoShift = (now = new Date()) => {
    const day = now.getDay(); // 0=Sun,1=Mon,...,6=Sat
    const hour = now.getHours();
    const isWeekend = day === 0 || day >= 5; // Fri/Sat/Sun
    if (!isWeekend) return SHIFTS.find(s => s.id === 'weekday_full');
    if (hour < 15) return SHIFTS.find(s => s.id === 'weekend_shift1');
    return SHIFTS.find(s => s.id === 'weekend_shift2');
};

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

const Header = memo(({ currentTime }) => (
    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none">
        <div>
            <h1 className="text-2xl font-black text-white tracking-wider">ABSENSI KREI</h1>
            <p className="text-[#D91636] text-sm font-semibold">Méra OS — Clock In System</p>
        </div>
        <div className="text-right">
            <div className="text-3xl text-white font-bold tracking-tight leading-none font-mono">
                {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-gray-400 text-sm mt-1">
                {format(currentTime, 'EEEE, dd MMMM yyyy', { locale: id })}
            </div>
        </div>
    </div>
));

const StepSelectCrew = memo(({ crew, onCrewSelect }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl w-full">
        {crew.filter(c => c.status_gaji !== 'RESIGNED').map((c) => (
            <button
                key={c.id}
                onClick={() => onCrewSelect(c)}
                className="group relative bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl hover:bg-[#111] transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-900/20 text-center flex flex-col items-center gap-4"
            >
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white text-white group-hover:text-[#D91636] transition-colors">
                    <User size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">{c.name}</h3>
                    <p className="text-gray-400 text-sm group-hover:text-gray-700">{c.posisi}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status_gaji === 'PRO' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {c.status_gaji}
                </span>
            </button>
        ))}
    </div>
));

const StableWebcam = memo(({ webcamRef, showShiftOverlay, selectedShift, onCapture }) => (
    <div className="w-full bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 relative">
        <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-[500px] object-cover"
            videoConstraints={{ facingMode: 'user' }}
        />
        {showShiftOverlay && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                <p className="text-white font-bold text-xl animate-pulse">Pilih Shift dulu ↗</p>
            </div>
        )}
        {selectedShift && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button
                    onClick={onCapture}
                    className="w-20 h-20 rounded-full bg-[#0a0a0a] border-4 border-white/10 hover:border-[#D91636] hover:scale-110 transition-all shadow-xl flex items-center justify-center group"
                >
                    <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-[#D91636] transition-colors" />
                </button>
            </div>
        )}
    </div>
));

const StepCaptureShift = memo(({ selectedCrew, selectedShift, webcamRef, onCapture, onShiftSelect, onCancel }) => (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-start">
        <div className={`flex-1 w-full ${selectedCrew?.posisi === 'Intern' ? 'mx-auto max-w-2xl' : ''}`}>
            <StableWebcam
                webcamRef={webcamRef}
                showShiftOverlay={!selectedShift && selectedCrew?.posisi !== 'Intern'}
                selectedShift={selectedShift}
                onCapture={onCapture}
            />
        </div>

        {selectedCrew?.posisi !== 'Intern' ? (
            <div className="w-full lg:w-96 space-y-4">
                <h2 className="text-white text-xl font-bold mb-4">
                    Halo, {selectedCrew?.name}! 👋<br />
                    <span className="text-gray-400 text-base font-normal">Pilih shift hari ini:</span>
                </h2>
                <div className="space-y-3">
                    {SHIFTS.map((shift) => {
                        const recommended = getAutoShift()?.id === shift.id;
                        return (
                            <button
                                key={shift.id}
                                onClick={() => onShiftSelect(shift)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedShift?.id === shift.id
                                    ? 'bg-[#D91636] text-white border-[#D91636] shadow-lg shadow-red-900/30'
                                    : 'bg-[#0a0a0a] text-gray-400 border-white/10 hover:bg-[#111] hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{shift.label}</span>
                                    {recommended && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-bold uppercase tracking-wide">Auto</span>
                                    )}
                                </div>
                                <div className="text-sm opacity-70 flex items-center gap-2 mt-1">
                                    <Clock size={14} /> {shift.time}
                                </div>
                                <div className="text-xs mt-1 opacity-60 font-mono">
                                    Rp {shift.salary.toLocaleString('id-ID')}
                                </div>
                            </button>
                        );
                    })}
                </div>
                <button onClick={onCancel} className="mt-8 text-gray-500 hover:text-white flex items-center gap-2">
                    <RefreshCw size={16} /> Ganti Kru
                </button>
            </div>
        ) : (
            <div className="absolute top-8 right-8">
                <button onClick={onCancel} className="text-white/50 hover:text-white flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                    <X size={16} /> Kembali
                </button>
            </div>
        )}
    </div>
));

const StepConfirm = memo(({ capturedImage, selectedCrew, selectedShift, onRetake, onConfirm, isUploading }) => (
    <div className="flex flex-col items-center w-full max-w-md animate-fade-in-up">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-8 border-4 border-white/10 w-full">
            <img src={capturedImage} alt="Captured" className="w-full" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-12">
                <div className="text-white font-bold text-xl">{selectedCrew?.name}</div>
                <div className="text-gray-300">{selectedShift?.label}</div>
                <div className="text-xs text-gray-400 font-mono mt-1">{format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full">
            <button
                onClick={onRetake}
                disabled={isUploading}
                className="py-4 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
                Foto Ulang
            </button>
            <button
                onClick={onConfirm}
                disabled={isUploading}
                className="py-4 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
                {isUploading ? <><RefreshCw size={16} className="animate-spin" /> Menyimpan...</> : 'Clock In! ✓'}
            </button>
        </div>
    </div>
));

const StepSuccess = memo(({ selectedCrew, salaryDetails, onFinish, hasOnLogin }) => (
    <div className="flex flex-col items-center w-full max-w-md animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-500/30">
            <Check className="w-12 h-12 text-white" strokeWidth={4} />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Selamat Bekerja!</h2>
        <p className="text-gray-400 mb-8">Semangat, {selectedCrew?.name}! 💪</p>

        <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 w-full mb-8">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Ringkasan Shift</div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Gaji Pokok</span>
                <span className="text-white font-mono">Rp {salaryDetails?.base.toLocaleString('id-ID')}</span>
            </div>
            {salaryDetails?.bonus > 0 && (
                <div className="flex justify-between items-center mb-2 text-green-400">
                    <span>Bonus Tim</span>
                    <span className="font-mono">+ Rp {salaryDetails?.bonus.toLocaleString('id-ID')}</span>
                </div>
            )}
            {salaryDetails?.denda > 0 && (
                <div className="flex justify-between items-center mb-2 text-red-400">
                    <span>Potongan Terlambat ({salaryDetails?.lateMins} mnt)</span>
                    <span className="font-mono">- Rp {salaryDetails?.denda.toLocaleString('id-ID')}</span>
                </div>
            )}
            <div className="border-t border-gray-700 mt-4 pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-white">Estimasi Total</span>
                <span className="text-xl font-bold text-[#D91636] font-mono">Rp {salaryDetails?.total.toLocaleString('id-ID')}</span>
            </div>
        </div>

        <button
            onClick={onFinish}
            className="w-full py-4 rounded-xl bg-white text-black font-black hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
            <Home size={18} />
            Mulai Bekerja
        </button>
    </div>
));

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const AbsensiModule = ({ onLogin }) => {
    const { crew, addAbsensi, updateCrew } = useFinance();
    const navigate = useNavigate();
    const [step, setStep] = useState('select-crew');
    const [selectedCrew, setSelectedCrew] = useState(null);
    const [selectedShift, setSelectedShift] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [salaryDetails, setSalaryDetails] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const webcamRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleCrewSelect = (crewMember) => {
        setSelectedCrew(crewMember);
        if (crewMember.posisi === 'Intern') {
            setSelectedShift({ id: 'intern', label: 'Intern', time: 'Unlimited', salary: 0 });
        } else {
            setSelectedShift(getAutoShift());
        }
        setStep('capture-shift');
    };

    const capture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);
        setStep('confirm');
    };

    const retake = () => {
        setCapturedImage(null);
        setStep('capture-shift');
    };

    /**
     * Hitung keterlambatan sesuai doc 4.3:
     * - Grace Period: 10 menit setelah jam shift dimulai
     * - Penalty: late_minutes × DENDA_PER_MENIT
     */
    const hitungDenda = (shift, now = new Date()) => {
        if (!shift || shift.id === 'intern') return { denda: 0, lateMins: 0 };

        const shiftStart = new Date(now);
        shiftStart.setHours(shift.startHour, shift.startMin, 0, 0);

        // Batas toleransi = jam shift + 10 menit
        const batasToleransi = new Date(shiftStart.getTime() + GRACE_PERIOD_MENIT * 60000);

        if (now <= batasToleransi) return { denda: 0, lateMins: 0 };

        const lateMins = Math.floor((now - batasToleransi) / 60000);
        return {
            denda: lateMins * DENDA_PER_MENIT,
            lateMins
        };
    };

    /**
     * Upload foto ke Google Drive via Apps Script (preferensi operasional)
     * URL publik disimpan ke Supabase DB untuk referensi
     */
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby87hCdRT1l8vXP7zYo6uLzSEAl52-ZrXhkzt3KaJzOmOhmnJYfW_Kbf-CdSf6R86QnbA/exec";

    const uploadPhotoToGoogleDrive = async (base64Image, crewId) => {
        const fileName = `absensi_${crewId}_${Date.now()}.jpg`;
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ filename: fileName, image: base64Image })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Gagal upload ke Google Drive');
        return result.url; // Public URL dari Google Drive
    };

    const confirmAbsensi = async () => {
        const base = selectedShift?.salary || 0;
        const { denda, lateMins } = hitungDenda(selectedShift, currentTime);
        const stats = { base, bonus: 0, denda, lateMins, total: base - denda };
        setSalaryDetails(stats);

        // Akumulasi denda ke data kru
        if (denda > 0 && selectedCrew?.id) {
            updateCrew(selectedCrew.id, 'denda', (selectedCrew.denda || 0) + denda);
        }

        setIsUploading(true);
        let publicUrl = null;

        try {
            // Upload foto ke Google Drive via Apps Script
            publicUrl = await uploadPhotoToGoogleDrive(capturedImage, selectedCrew?.id);
        } catch (err) {
            console.error('Gagal upload foto ke Google Drive:', err);
            // Lanjut tanpa foto — jangan block clock-in
        } finally {
            setIsUploading(false);
        }

        // Catat absensi lokal
        addAbsensi({
            crewId: selectedCrew?.id,
            crewName: selectedCrew?.name,
            posisi: selectedCrew?.posisi,
            shiftLabel: selectedShift?.label,
            photoUrl: publicUrl || null,
        });

        // Insert ke Supabase DB attendance
        try {
            await supabase.from('attendance').insert([{
                user_id: selectedCrew?.id,
                check_in: new Date().toISOString(),
                photo_url: publicUrl,
                shift_id: selectedShift?.id,
                late_minutes: lateMins,
                status: 'active'
            }]);
        } catch (err) {
            console.error('Gagal insert attendance DB:', err);
        }

        if (onLogin) {
            onLogin({ ...selectedCrew, shift: selectedShift, loginTime: new Date().toISOString() });
        } else {
            setStep('success');
        }
    };

    const finish = () => {
        if (onLogin) {
            onLogin({ ...selectedCrew, shift: selectedShift, loginTime: new Date().toISOString() });
        } else {
            navigate('/pos');
        }
    };

    return (
        <div className="h-screen bg-[#050505] relative overflow-hidden flex flex-col items-center justify-center font-sans selection:bg-[#D91636] selection:text-white">
            <Header currentTime={currentTime} />
            <div className="z-10 w-full flex-1 flex flex-col items-center justify-center p-6 pt-24">
                {step === 'select-crew' && (
                    <StepSelectCrew crew={crew} onCrewSelect={handleCrewSelect} />
                )}
                {step === 'capture-shift' && (
                    <StepCaptureShift
                        selectedCrew={selectedCrew}
                        selectedShift={selectedShift}
                        webcamRef={webcamRef}
                        onCapture={capture}
                        onShiftSelect={setSelectedShift}
                        onCancel={() => setStep('select-crew')}
                    />
                )}
                {step === 'confirm' && (
                    <StepConfirm
                        capturedImage={capturedImage}
                        selectedCrew={selectedCrew}
                        selectedShift={selectedShift}
                        isUploading={isUploading}
                        onRetake={retake}
                        onConfirm={confirmAbsensi}
                    />
                )}
                {step === 'success' && (
                    <StepSuccess
                        selectedCrew={selectedCrew}
                        salaryDetails={salaryDetails}
                        onFinish={finish}
                        hasOnLogin={!!onLogin}
                    />
                )}
            </div>
        </div>
    );
};

export default AbsensiModule;
