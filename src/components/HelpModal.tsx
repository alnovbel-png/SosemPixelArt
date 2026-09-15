import React from 'react';
import { X, BookOpen, Compass, Heart, Award, Sparkles, Download } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportOffline: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onExportOffline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3">
      <div className="bg-slate-900 border-2 border-amber-400/80 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base text-amber-300">
              Panduan Bermain & Sains Emosi (PSE)
            </h2>
          </div>
          <button
            id="close-help-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-200">
          <section className="space-y-2">
            <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              Tujuan & Mekanik Utama Game
            </h3>
            <p className="text-slate-300 leading-relaxed text-xs">
              Kamu menjelajahi <strong>Lembah Nada Rasa</strong> yang kehilangan warnanya akibat kabut kesalahpahaman.
              Gunakan <strong>Kompas Resonansi Emosi [Spasi]</strong> untuk melihat lapisan perasaan terdalam dari karakter.
              Setiap kali kamu membantu warga mengenali dan meregulasi emosinya, warna dan kehidupan kawasan tersebut akan pulih!
            </p>
          </section>

          <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2">
            <h3 className="font-bold text-cyan-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Kontrol Permainan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="font-bold text-amber-300 block">Keyboard & Mouse:</span>
                Klik Lantai: Berjalan otomatis ke lokasi<br />
                WASD / Panah: Berjalan manual<br />
                [E] / Enter / Klik NPC: Bicara & Interaksi<br />
                [Spasi]: Nyalakan Kompas Hati<br />
                [J]: Buka Jurnal PSE
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="font-bold text-amber-300 block">Layar Sentuh (Ponsel/Tablet):</span>
                Ketuk Lantai: Berjalan ke titik ketuk<br />
                D-Pad kiri: Navigasi arah manual<br />
                Tombol A: Bicara / Interaksi<br />
                Tombol HATI: Kompas Resonansi
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Sains Pembelajaran Sosial Emosional (PSE)
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700">
                <strong className="text-amber-200">1. Otak Amigdala vs Korteks Prefrontal:</strong> Saat kita marah atau cemas, amigdala menyala seperti sirene darurat. Melakukan napas berirama (4-4-4) mengirimkan sinyal oksigen agar otak berpikir jernih kembali.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700">
                <strong className="text-amber-200">2. Lapisan Emosi Gunung Es:</strong> Kemarahan seringkali adalah selimut dari perasaan sedih, malu, atau merasa tidak dihargai yang terkunci di dalam hati.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700">
                <strong className="text-amber-200">3. Validasi Perasaan:</strong> Mengatakan "Wajar kamu merasa sedih/takut" membuat orang lain merasa didengar dan membuka pintu kerjasama.
              </div>
            </div>
          </section>

          <section className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-xs text-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Mainkan Tanpa Internet (Offline)
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Unduh file game dalam satu berkas HTML yang bisa disimpan di laptop/flashdisk sekolah dan dimainkan kapan saja!
              </p>
            </div>
            <button
              id="help-download-offline-btn"
              onClick={() => {
                onExportOffline();
                onClose();
              }}
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 shadow"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File HTML</span>
            </button>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700 text-center">
          <button
            id="help-understood-btn"
            onClick={onClose}
            className="px-6 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
          >
            Mengerti & Lanjut Main
          </button>
        </div>
      </div>
    </div>
  );
};
