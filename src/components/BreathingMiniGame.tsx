import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';
import { Wind, Heart, CheckCircle2 } from 'lucide-react';

interface BreathingMiniGameProps {
  onComplete: () => void;
  onCancel?: () => void;
  targetName: string;
}

export const BreathingMiniGame: React.FC<BreathingMiniGameProps> = ({
  onComplete,
  targetName,
}) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycle, setCycle] = useState<number>(1);
  const totalCycles = 3;
  const [secondsLeft, setSecondsLeft] = useState<number>(4);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (isFinished) return;

    if (phase === 'inhale' && secondsLeft === 4) {
      sound.playBreatheIn();
    } else if (phase === 'exhale' && secondsLeft === 4) {
      sound.playBreatheOut();
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Switch phase
          if (phase === 'inhale') {
            setPhase('hold');
            return 4;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return 4;
          } else {
            // cycle finished
            if (cycle >= totalCycles) {
              setIsFinished(true);
              sound.playSuccessFanfare();
              setTimeout(() => {
                onComplete();
              }, 1800);
              return 0;
            } else {
              setCycle((c) => c + 1);
              setPhase('inhale');
              return 4;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, cycle, secondsLeft, isFinished, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border-2 border-amber-400/60 rounded-2xl p-6 max-w-md w-full text-center shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Background aura */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/30 to-transparent pointer-events-none" />

        <div className="flex items-center justify-center gap-2 mb-2 text-amber-400 font-bold tracking-wider text-xs uppercase">
          <Wind className="w-4 h-4" />
          <span>Teknik Regulasi Emosi: Napas Balon 4-4-4</span>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          Bantu {targetName} Menenangkan Diri
        </h3>
        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          Saat panik, amigdala (otak siaga) membuat napas memburu. Tarik napas bersama untuk mengirim sinyal tenang ke otak!
        </p>

        {/* Interactive Breathing Sphere */}
        <div className="relative flex items-center justify-center h-48 mb-6">
          {/* Animated Circle */}
          <div
            className={`rounded-full flex items-center justify-center transition-all duration-1000 ${
              phase === 'inhale'
                ? 'w-40 h-40 bg-gradient-to-tr from-cyan-500 to-emerald-400 scale-100 shadow-[0_0_40px_rgba(6,182,212,0.6)]'
                : phase === 'hold'
                ? 'w-40 h-40 bg-gradient-to-tr from-amber-400 to-yellow-300 scale-105 shadow-[0_0_50px_rgba(245,158,11,0.7)]'
                : 'w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-500 scale-90 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
            }`}
          >
            <div className="text-center text-slate-950 font-black">
              <span className="text-3xl font-mono">{secondsLeft}</span>
              <span className="block text-[10px] uppercase font-bold tracking-widest mt-0.5">Detik</span>
            </div>
          </div>

          {/* Phase text label */}
          <div className="absolute -bottom-2 bg-slate-950/80 px-4 py-1 rounded-full border border-slate-700 text-xs font-semibold">
            {phase === 'inhale' && (
              <span className="text-cyan-300">Tarik Napas Perlahan (Meniup Balon Perut)...</span>
            )}
            {phase === 'hold' && (
              <span className="text-amber-300">Tahan Napas Sebentar...</span>
            )}
            {phase === 'exhale' && (
              <span className="text-blue-300">Hembuskan Lembut Lewat Mulut...</span>
            )}
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${
                step < cycle || (step === cycle && isFinished)
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : step === cycle
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              <Heart className="w-3 h-3" />
              <span>Putaran {step}</span>
            </div>
          ))}
        </div>

        {isFinished ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            <span>Kiki Merasa Tenang! Warna Plaza Pulih!</span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 italic">
            Ikuti irama lingkaran ini sampai 3 putaran selesai.
          </p>
        )}
      </div>
    </div>
  );
};
