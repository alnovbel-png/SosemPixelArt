import React from 'react';
import { Compass, Volume2, VolumeX, BookOpen, Download, HelpCircle } from 'lucide-react';

interface VirtualControlsProps {
  onDirectionPress: (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => void;
  onActionPress: () => void;
  onCompassToggle: () => void;
  isCompassActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenJournal: () => void;
  onOpenHelp: () => void;
  onExportOffline: () => void;
  isDialogueOpen?: boolean;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onDirectionPress,
  onActionPress,
  onCompassToggle,
  isCompassActive,
  isMuted,
  onToggleMute,
  onOpenJournal,
  onOpenHelp,
  onExportOffline,
  isDialogueOpen = false,
}) => {
  return (
    <>
      {/* Top Bar Controls - High contrast, non-overlapping header */}
      <div className="fixed top-2.5 sm:top-3 left-2.5 sm:left-4 right-2.5 sm:right-4 flex items-center justify-between z-30 pointer-events-none gap-2">
        {/* Left: App Title / Quest Tag */}
        <div className="bg-slate-950/95 border border-slate-800 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-xl backdrop-blur-md pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-xs sm:text-sm">🧭</span>
          <span className="font-pixel text-[9px] sm:text-[10px] text-amber-400 font-bold tracking-tight">
            Lembah Nada Rasa
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-400 text-[11px] hidden md:inline font-medium">PSE Kelas 4</span>
        </div>

        {/* Center: Compass Toggle Button (Integrated in Header - No More Overlap!) */}
        <div className="pointer-events-auto">
          <button
            id="toggle-resonance-btn"
            onClick={onCompassToggle}
            title="Aktifkan Kompas Resonansi Hati [Spasi]"
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl border shadow-lg backdrop-blur-md transition flex items-center gap-1.5 text-xs font-semibold ${
              isCompassActive
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.6)] font-bold'
                : 'bg-slate-950/90 text-amber-300 border-amber-500/40 hover:bg-slate-900'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isCompassActive ? 'animate-spin' : ''}`} />
            <span className="font-pixel text-[8px] sm:text-[9px]">
              {isCompassActive ? 'KOMPAS AKTIF' : 'KOMPAS HATI'}
            </span>
            <span className="hidden lg:inline text-[10px] text-slate-400 font-mono">
              [Spasi]
            </span>
          </button>
        </div>

        {/* Right: Sound, Journal, Offline Export & Help */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <button
            id="top-journal-btn"
            onClick={onOpenJournal}
            title="Buka Jurnal Kompas Hati & Tas [J]"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-950/90 border border-amber-500/50 hover:bg-slate-900 text-amber-300 shadow-lg backdrop-blur-md transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline text-xs">Jurnal</span>
          </button>

          <button
            id="top-offline-btn"
            onClick={onExportOffline}
            title="Unduh Game Offline (.html tunggal)"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 hover:bg-emerald-900 text-emerald-300 shadow-lg backdrop-blur-md transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline text-xs">Unduh</span>
          </button>

          <button
            id="top-help-btn"
            onClick={onOpenHelp}
            title="Panduan Kontrol & Fakta Sains PSE"
            className="p-1.5 sm:p-2 rounded-xl bg-slate-950/90 border border-slate-700 hover:bg-slate-900 text-slate-300 shadow-lg backdrop-blur-md transition"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            id="top-sound-btn"
            onClick={onToggleMute}
            title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-950/90 border border-slate-700 hover:bg-slate-900 text-slate-300 shadow-lg backdrop-blur-md transition"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* On-Screen Mobile D-Pad (Hidden when dialogue is open to prevent clutter) */}
      {!isDialogueOpen && (
        <div className="fixed bottom-4 left-4 z-30 flex flex-col items-center pointer-events-auto select-none sm:hidden">
          <div className="grid grid-cols-3 gap-1.5 w-32 h-32 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div />
            <button
              id="dpad-up"
              onTouchStart={() => onDirectionPress('up', true)}
              onTouchEnd={() => onDirectionPress('up', false)}
              onMouseDown={() => onDirectionPress('up', true)}
              onMouseUp={() => onDirectionPress('up', false)}
              className="bg-slate-800 active:bg-amber-500 rounded-lg text-slate-200 active:text-slate-950 font-bold flex items-center justify-center text-lg border border-slate-700"
            >
              ▲
            </button>
            <div />

            <button
              id="dpad-left"
              onTouchStart={() => onDirectionPress('left', true)}
              onTouchEnd={() => onDirectionPress('left', false)}
              onMouseDown={() => onDirectionPress('left', true)}
              onMouseUp={() => onDirectionPress('left', false)}
              className="bg-slate-800 active:bg-amber-500 rounded-lg text-slate-200 active:text-slate-950 font-bold flex items-center justify-center text-lg border border-slate-700"
            >
              ◀
            </button>
            <div className="bg-slate-900/60 rounded-lg flex items-center justify-center text-[9px] text-slate-500 font-mono">
              PAD
            </div>
            <button
              id="dpad-right"
              onTouchStart={() => onDirectionPress('right', true)}
              onTouchEnd={() => onDirectionPress('right', false)}
              onMouseDown={() => onDirectionPress('right', true)}
              onMouseUp={() => onDirectionPress('right', false)}
              className="bg-slate-800 active:bg-amber-500 rounded-lg text-slate-200 active:text-slate-950 font-bold flex items-center justify-center text-lg border border-slate-700"
            >
              ▶
            </button>

            <div />
            <button
              id="dpad-down"
              onTouchStart={() => onDirectionPress('down', true)}
              onTouchEnd={() => onDirectionPress('down', false)}
              onMouseDown={() => onDirectionPress('down', true)}
              onMouseUp={() => onDirectionPress('down', false)}
              className="bg-slate-800 active:bg-amber-500 rounded-lg text-slate-200 active:text-slate-950 font-bold flex items-center justify-center text-lg border border-slate-700"
            >
              ▼
            </button>
            <div />
          </div>
        </div>
      )}

      {/* On-Screen Mobile Action Buttons */}
      {!isDialogueOpen && (
        <div className="fixed bottom-4 right-4 z-30 flex items-center gap-3 pointer-events-auto select-none sm:hidden">
          {/* Button B: Resonance Compass */}
          <button
            id="btn-compass-mobile"
            onClick={onCompassToggle}
            className={`w-13 h-13 rounded-full border-2 flex flex-col items-center justify-center text-xs font-bold shadow-lg transition active:scale-95 ${
              isCompassActive
                ? 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-slate-900/90 text-amber-300 border-amber-400/70'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[8px] font-pixel">HATI</span>
          </button>

          {/* Button A: Interact / Speak */}
          <button
            id="btn-action-mobile"
            onClick={onActionPress}
            className="w-14 h-14 rounded-full bg-emerald-600 active:bg-emerald-400 text-white active:text-slate-950 border-2 border-emerald-300 flex flex-col items-center justify-center text-xs font-bold shadow-xl active:scale-95 transition"
          >
            <span className="text-base font-black">A</span>
            <span className="text-[8px] font-pixel">AKSI</span>
          </button>
        </div>
      )}

      {/* Desktop Keyboard Hints (Bottom Left) */}
      <div className="hidden sm:flex fixed bottom-3 left-3 z-30 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 gap-3 backdrop-blur-sm pointer-events-none">
        <span>
          <strong className="text-slate-200">WASD / Panah:</strong> Jalan
        </span>
        <span>
          <strong className="text-slate-200">[E / Enter]:</strong> Bicara / Interaksi
        </span>
        <span>
          <strong className="text-slate-200">[Spasi]:</strong> Kompas Resonansi
        </span>
        <span>
          <strong className="text-slate-200">[J]:</strong> Jurnal PSE
        </span>
      </div>
    </>
  );
};
