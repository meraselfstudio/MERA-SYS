import React, { useState, useRef, useEffect, memo } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, X, User, Clock, Home } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { supabase } from '../../lib/supabase';



// Weekday = Senin–Kamis (getDay 1–4), Weekend = Jumat–Minggu (getDay 5,6,0)
const SHIFTS = [
    { id: 'weekday_full', label: 'Weekday Full Time', time: '12:00 – 21:00', salary: 75000, isWeekend: false },
    { id: 'weekend_shift1', label: 'Weekend Shift 1', time: '09:00 – 15:00', salary: 35000, isWeekend: true },
    { id: 'weekend_shift2', label: 'Weekend Shift 2', time: '15:00 – 21:00', salary: 35000, isWeekend: true },
    { id: 'weekend_full', label: 'Weekend Full Time', time: '09:00 – 21:00', salary: 100000, isWeekend: true },
];

// Auto-pick the most likely shift based on current day & hour
const getAutoShift = (now = new Date()) => {
    const day = now.getDay();  // 0=Sun,1=Mon,...,6=Sat
    const hour = now.getHours();
    const isWeekend = day === 0 || day >= 5; // Fri/Sat/Sun
    if (!isWeekend) return SHIFTS.find(s => s.id === 'weekday_full');
    if (hour < 15) return SHIFTS.find(s => s.id === 'weekend_shift1');
    return SHIFTS.find(s => s.id === 'weekend_shift2');
};


// ─── SUB-COMPONENTS extracted OUTSIDE parent to prevent re-mount on re-render ───

const Header = memo(({ currentTime }) => (
    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none">
        <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-wider">UNLOCK SYSTEM</h1>
            <p className="text-primary-light text-sm">Méra OS System</p>
        </div>
        <div className="text-right">
            <div className="text-3xl text-gray-900 dark:text-white font-bold tracking-tight leading-none">
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
        {crew.map((c) => (
            <button
                key={c.id}
                onClick={() => onCrewSelect(c)}
                className="group relative bg-[#0a0a0a] backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-[#111] transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 text-center flex flex-col items-center gap-4"
            >
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                    <User size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{c.name}</h3>
                    <p className="text-gray-400 text-sm group-hover:text-gray-900 dark:text-white/80">{c.posisi}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status_gaji === 'PRO' ? 'bg-green-500/20 text-green-400 group-hover:text-white' : 'bg-yellow-500/20 text-yellow-400 group-hover:text-white'}`}>
                    {c.status_gaji}
                </span>
            </button>
        ))}
    </div>
));

// Stable webcam component that NEVER re-mounts unless explicitly unmounted
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
                <p className="text-gray-900 dark:text-white font-bold text-xl animate-pulse">Pilih Shift</p>
            </div>
        )}
        {selectedShift && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button
                    onClick={onCapture}
                    className="w-20 h-20 rounded-full bg-[#0a0a0a] border-4 border-white/10 hover:border-primary hover:scale-110 transition-all shadow-xl flex items-center justify-center group"
                >
                    <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-primary transition-colors"></div>
                </button>
            </div>
        )}
    </div>
));

const StepCaptureShift = memo(({ selectedCrew, selectedShift, webcamRef, onCapture, onShiftSelect, onCancel }) => (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-start">
        {/* Webcam — stable, never re-mounts */}
        <div className={`flex-1 w-full ${selectedCrew?.posisi === 'Intern' ? 'mx-auto max-w-2xl' : ''}`}>
            <StableWebcam
                webcamRef={webcamRef}
                showShiftOverlay={!selectedShift && selectedCrew?.posisi !== 'Intern'}
                selectedShift={selectedShift}
                onCapture={onCapture}
            />
        </div>

        {/* Shift Selection — hidden for Interns */}
        {selectedCrew?.posisi !== 'Intern' ? (
            <div className="w-full lg:w-96 space-y-4">
                <h2 className="text-gray-900 dark:text-white text-xl font-bold mb-4">
                    Hello, {selectedCrew?.name}!<br />
                    <span className="text-gray-400 text-base font-normal"></span>
                </h2>
                <div className="space-y-3">
                    {SHIFTS.map((shift) => {
                        const recommended = getAutoShift()?.id === shift.id;
                        return (
                            <button
                                key={shift.id}
                                onClick={() => onShiftSelect(shift)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedShift?.id === shift.id
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                                    : 'bg-[#0a0a0a] text-gray-400 border-white/10 hover:bg-[#111]'
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
                            </button>
                        );
                    })}
                </div>
                <button onClick={onCancel} className="mt-8 text-gray-500 hover:text-gray-900 dark:text-white flex items-center gap-2">
                    <RefreshCw size={16} /> Cancel
                </button>
            </div>
        ) : (
            <div className="absolute top-8 right-8">
                <button onClick={onCancel} className="text-white/50 hover:text-white flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                    <X size={16} /> Cancel
                </button>
            </div>
        )}
    </div>
));

const StepConfirm = memo(({ capturedImage, selectedCrew, selectedShift, onRetake, onConfirm }) => (
    <div className="flex flex-col items-center w-full max-w-md animate-fade-in-up">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-8 border-4 border-white/10 w-full">
            <img src={capturedImage} alt="Captured" className="w-full" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-12">
                <div className="text-gray-900 dark:text-white font-bold text-xl">{selectedCrew?.name}</div>
                <div className="text-gray-300">{selectedShift?.label}</div>
                <div className="text-xs text-gray-400 font-mono mt-1">{format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full">
            <button
                onClick={onRetake}
                className="py-4 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors"
            >
                Retake Photo!
            </button>
            <button
                onClick={onConfirm}
                className="py-4 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all"
            >
                Unlock System!
            </button>
        </div>
    </div>
));

const StepSuccess = memo(({ selectedCrew, salaryDetails, onFinish, hasOnLogin }) => (
    <div className="flex flex-col items-center w-full max-w-md animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-500/30">
            <Check className="w-12 h-12 text-gray-900 dark:text-white" strokeWidth={4} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">System Unlocked!</h2>
        <p className="text-gray-400 mb-8">Smile! - {selectedCrew?.name}.</p>

        <div className="bg-[#0a0a0a] backdrop-blur-md border border-gray-800 rounded-2xl p-6 w-full mb-8">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Your Work</div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Salary</span>
                <span className="text-gray-900 dark:text-white font-mono">Rp {salaryDetails?.base.toLocaleString('id-ID')}</span>
            </div>
            {salaryDetails?.bonus > 0 && (
                <div className="flex justify-between items-center mb-2 text-green-400">
                    <span>Bonus</span>
                    <span className="font-mono">+ Rp {salaryDetails?.bonus.toLocaleString('id-ID')}</span>
                </div>
            )}
            {salaryDetails?.denda > 0 && (
                <div className="flex justify-between items-center mb-2 text-red-400">
                    <span>Cut</span>
                    <span className="font-mono">- Rp {salaryDetails?.denda.toLocaleString('id-ID')}</span>
                </div>
            )}
            <div className="border-t border-gray-700 mt-4 pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-xl font-bold text-primary font-mono">Rp {salaryDetails?.total.toLocaleString('id-ID')}</span>
            </div>
        </div>

        <button
            onClick={onFinish}
            className="w-full py-4 rounded-xl bg-white text-black font-black hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
            <div className={hasOnLogin ? "animate-spin mr-2" : ""}>
                {hasOnLogin ? <RefreshCw size={18} /> : <Home size={18} />}
            </div>
            {hasOnLogin ? "Enter System..." : "Back to Home"}
        </button>
    </div>
));

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AbsensiModule = ({ onLogin }) => {
    const { crew, addAbsensi } = useFinance();
    const navigate = useNavigate();
    const [step, setStep] = useState('select-crew');
    const [selectedCrew, setSelectedCrew] = useState(null);
    const [selectedShift, setSelectedShift] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [salaryDetails, setSalaryDetails] = useState(null);
    const webcamRef = useRef(null);

    // Clock only updates currentTime — does NOT cause webcam re-mount
    // because the webcam lives in a memoized component outside the parent
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleCrewSelect = (crew) => {
        setSelectedCrew(crew);
        if (crew.posisi === 'Intern') {
            setSelectedShift({ id: 'intern', label: 'Intern Shift', time: 'Unlimited', salary: 0 });
        } else {
            // Auto-pick shift based on current day/time
            setSelectedShift(getAutoShift());
        }
        setStep('capture-shift');
    };

    const handleShiftSelect = (shift) => {
        setSelectedShift(shift);
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

    const confirmAbsensi = async () => {
        const base = selectedShift?.salary || 0;
        const bonus = selectedShift?.id.includes('weekend') ? 10000 : 0;
        const denda = 0;
        const stats = { base, bonus, denda, total: base + bonus - denda };
        setSalaryDetails(stats);

        try {
            // 1. Convert Base64 capturedImage to Blob
            const res = await fetch(capturedImage);
            const blob = await res.blob();
            const fileName = `login_${selectedCrew?.id}_${Date.now()}.jpg`;

            // 2. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('attendance_photos')
                .upload(fileName, blob, { contentType: 'image/jpeg' });

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('attendance_photos')
                .getPublicUrl(fileName);

            // 4. Record attendance locally
            addAbsensi({
                crewId: selectedCrew?.id,
                crewName: selectedCrew?.name,
                posisi: selectedCrew?.posisi,
                shiftLabel: selectedShift?.label,
                photoUrl: publicUrl
            });

            // 5. Insert to Supabase DB so checkout has a row to update
            const { error: insertError } = await supabase.from('attendance').insert([{
                user_id: selectedCrew?.id,
                check_in: new Date().toISOString(),
                photo_url: publicUrl,
                status: 'active'
            }]);

            if (insertError) console.error("Failed to insert attendance into DB:", insertError);
        } catch (err) {
            console.error("Failed to upload login photo to Supabase:", err);
            // Fallback: still record attendance locally if image fails
            addAbsensi({
                crewId: selectedCrew?.id,
                crewName: selectedCrew?.name,
                posisi: selectedCrew?.posisi,
                shiftLabel: selectedShift?.label,
            });

            // Still try to insert to Supabase DB so checkout works even without photo
            await supabase.from('attendance').insert([{
                user_id: selectedCrew?.id,
                check_in: new Date().toISOString(),
                status: 'active'
            }]);
        }

        // Direct Login -> Bypass StepSuccess (Salary UI)
        if (onLogin) {
            onLogin({ ...selectedCrew, shift: selectedShift, loginTime: new Date().toISOString() });
        } else {
            navigate('/pos');
        }
    };

    const finish = () => {
        if (onLogin) {
            onLogin({ ...selectedCrew, shift: selectedShift, loginTime: new Date().toISOString() });
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="h-screen bg-[#050505] relative overflow-hidden flex flex-col items-center justify-center font-sans selection:bg-primary selection:text-white">
            <Header currentTime={currentTime} />
            <div className="z-10 w-full flex-1 flex flex-col items-center justify-center p-6">
                {step === 'select-crew' && (
                    <StepSelectCrew crew={crew} onCrewSelect={handleCrewSelect} />
                )}
                {step === 'capture-shift' && (
                    <StepCaptureShift
                        selectedCrew={selectedCrew}
                        selectedShift={selectedShift}
                        webcamRef={webcamRef}
                        onCapture={capture}
                        onShiftSelect={handleShiftSelect}
                        onCancel={() => setStep('select-crew')}
                    />
                )}
                {step === 'confirm' && (
                    <StepConfirm
                        capturedImage={capturedImage}
                        selectedCrew={selectedCrew}
                        selectedShift={selectedShift}
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
