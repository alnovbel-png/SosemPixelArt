import { NPC, GameQuest, Item } from '../types/game';

export const TILE_SIZE = 32;
export const MAP_COLS = 36;
export const MAP_ROWS = 28;

// Tile types
export const TILE = {
  GRASS: 0,
  GRASS_FLOWERS: 1,
  PATH_STONE: 2,
  WATER: 3,
  WATER_DEEP: 4,
  WOOD_BRIDGE: 5,
  TREE_TRUNK: 6,
  TREE_TOP: 7,
  HOUSE_WALL: 8,
  HOUSE_ROOF: 9,
  FOUNTAIN: 10,
  FENCE: 11,
  FLOWER_BED: 12,
  TOWER_WALL: 13,
  SECRET_TREE: 14,
  CLIFF: 15,
};

// Map layout definition (28 rows x 36 cols)
// Generated with thoughtful zones: Plaza (center-west), River & Bridge (east), Forest (north-west), Tower (north-east)
export function generateMapLayout(): number[][] {
  const map: number[][] = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < MAP_COLS; c++) {
      // Borders are cliffs/fences
      if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
        row.push(TILE.CLIFF);
        continue;
      }

      // River flows vertically through columns 22 to 24
      if ((c === 22 || c === 23) && !(r >= 14 && r <= 16)) {
        row.push(TILE.WATER);
        continue;
      }

      // Wooden bridge over the river at r=14..16, c=21..24
      if ((c >= 21 && c <= 24) && (r >= 14 && r <= 16)) {
        row.push(TILE.WOOD_BRIDGE);
        continue;
      }

      // Clock Tower area (top right, r: 2..8, c: 26..33)
      if (r >= 3 && r <= 6 && c >= 28 && c <= 32) {
        row.push(r === 3 ? TILE.HOUSE_ROOF : TILE.TOWER_WALL);
        continue;
      }

      // Secret Sacred Tree in secluded forest grove (r: 3..5, c: 3..6)
      if (r === 4 && c === 4) {
        row.push(TILE.SECRET_TREE);
        continue;
      }

      // Forest zone (north-west: dense trees)
      if (r < 9 && c < 15 && !(r === 4 && c === 4) && !(r === 7 && c === 8)) {
        if ((r % 2 === 1 && c % 2 === 1) || (r === 2 && c === 8) || (r === 6 && c === 3)) {
          row.push(TILE.TREE_TRUNK);
          continue;
        }
      }

      // House in village (r: 18..21, c: 4..9)
      if (r >= 18 && r <= 20 && c >= 4 && c <= 8) {
        row.push(r === 18 ? TILE.HOUSE_ROOF : TILE.HOUSE_WALL);
        continue;
      }

      // Central Fountain Plaza (r: 13..15, c: 10..12)
      if (r === 14 && c === 11) {
        row.push(TILE.FOUNTAIN);
        continue;
      }

      // Stone paths connecting areas
      // Horizontal plaza path (r: 15, c: 3..21)
      if (r === 15 && c >= 3 && c <= 21) {
        row.push(TILE.PATH_STONE);
        continue;
      }
      // Vertical path to North Forest (c: 11, r: 8..15)
      if (c === 11 && r >= 8 && r <= 15) {
        row.push(TILE.PATH_STONE);
        continue;
      }
      // Path leading from bridge to Tower (r: 15..8, c: 24..30)
      if ((r === 15 && c >= 24 && c <= 30) || (c === 30 && r >= 7 && r <= 15)) {
        row.push(TILE.PATH_STONE);
        continue;
      }

      // Flower patches
      if ((r === 13 && c === 8) || (r === 16 && c === 14) || (r === 18 && c === 16) || (r === 12 && c === 19)) {
        row.push(TILE.FLOWER_BED);
        continue;
      }

      // Random grass with tiny flowers
      if ((r * 17 + c * 31) % 9 === 0) {
        row.push(TILE.GRASS_FLOWERS);
      } else {
        row.push(TILE.GRASS);
      }
    }
    map.push(row);
  }
  return map;
}

// Solid obstacles for collision
export function isTileSolid(tile: number): boolean {
  return (
    tile === TILE.CLIFF ||
    tile === TILE.WATER ||
    tile === TILE.TREE_TRUNK ||
    tile === TILE.HOUSE_WALL ||
    tile === TILE.HOUSE_ROOF ||
    tile === TILE.FOUNTAIN ||
    tile === TILE.FENCE ||
    tile === TILE.TOWER_WALL
  );
}

// Initial NPCs configuration
export const INITIAL_NPCS: NPC[] = [
  {
    id: 'kiki',
    name: 'Kiki',
    role: 'Tupai Pos Cilik',
    x: 8,
    y: 13,
    sprite: 'squirrel',
    facing: 'down',
    emotionProfile: {
      surfaceEmotion: 'cemas',
      deepEmotion: 'takut',
      reason: 'Surat-surat penting desa berhamburan saat kabut datang, takut mengecewakan semua orang!',
      selInsight: 'Kecemasan membuat napas pendek & pikiran kusut. Teknik Napas Balon membantu menenangkan detak jantung.',
      calmTechnique: 'napas_balon',
    },
    currentDialogueId: 'kiki_intro',
    isResolved: false,
  },
  {
    id: 'kakek_ranu',
    name: 'Kakek Ranu',
    role: 'Tukang Kayu & Penjaga Jembatan',
    x: 20,
    y: 15,
    sprite: 'old_man',
    facing: 'left',
    emotionProfile: {
      surfaceEmotion: 'marah',
      deepEmotion: 'kecewa',
      reason: 'Marah karena jembatan dituduh rusak karena kelalaiannya, padahal ia kesepian dan merasa tak dihargai.',
      selInsight: 'Kemarahan seringkali adalah "lapisan luar" pelindung dari rasa terluka atau merasa tidak dipedulikan.',
      calmTechnique: 'validasi',
    },
    currentDialogueId: 'ranu_intro',
    isResolved: false,
  },
  {
    id: 'bimo',
    name: 'Bimo',
    role: 'Murid Pembuat Jam (Kelas 4)',
    x: 7,
    y: 6,
    sprite: 'boy_glasses',
    facing: 'right',
    emotionProfile: {
      surfaceEmotion: 'sedih',
      deepEmotion: 'cemas',
      reason: 'Bersembunyi di hutan karena roda gigi utama jam desa jatuh dari tangannya. Takut dibilang ceroboh.',
      selInsight: 'Membuat kesalahan adalah bagian dari proses belajar. Bimo butuh dukungan untuk memisahkan "kesalahan tindakan" dari "harga diri".',
      calmTechnique: 'reframing',
    },
    currentDialogueId: 'bimo_intro',
    isResolved: false,
  },
  {
    id: 'prof_kotek',
    name: 'Prof. Kotek',
    role: 'Ayam Peneliti Emosi (Rahasia Lucu)',
    x: 16,
    y: 19,
    sprite: 'chicken_glasses',
    facing: 'down',
    emotionProfile: {
      surfaceEmotion: 'gembira',
      deepEmotion: 'tenang',
      reason: 'Mengamati tingkat stres warga dengan alat pengukur detak kokok!',
      selInsight: 'Tawa dan humor sehat memicu pelepasan endorfin yang menurunkan hormon stres kortisol.',
      calmTechnique: 'solusi_bersama',
    },
    currentDialogueId: 'kotek_intro',
    isResolved: false,
    isCustomSecret: true,
  },
  {
    id: 'penjaga_kabut',
    name: 'Sosok Kabut / Nenek Wilis',
    role: 'Penjaga Menara & Pustakawan Desa',
    x: 30,
    y: 8,
    sprite: 'spirit_elder',
    facing: 'down',
    emotionProfile: {
      surfaceEmotion: 'kecewa',
      deepEmotion: 'sedih',
      reason: 'Menutup menara dengan kabut abu-abu karena lelah melihat warga saling menyalahkan tanpa mendengar isi hati.',
      selInsight: 'Kebutuhan dasar manusia adalah didengar (heard) dan dipahami (understood). Empati membuka jalan rekonsiliasi.',
      calmTechnique: 'solusi_bersama',
    },
    currentDialogueId: 'tower_intro',
    isResolved: false,
  },
];

// Quests flow
export const INITIAL_QUESTS: GameQuest[] = [
  {
    id: 'quest_start',
    title: 'Gunakan Kompas Resonansi Hati',
    targetNPC: 'kiki',
    description: 'Bumi bergetar dan warna memudar! Ambil Kompas Hati yang bersinar di dekat Air Mancur lalu gunakan pada Kiki.',
    isCompleted: false,
    stepHint: 'Dekati Kiki di barat air mancur lalu tekan tombol Kompas Resonansi.',
  },
  {
    id: 'quest_bridge',
    title: 'Misteri Jembatan Terkunci',
    targetNPC: 'kakek_ranu',
    description: 'Kakek Ranu mengunci jembatan kayu ke timur. Kenali alasan kemarahannya dengan Kompas dan berikan respon empatik.',
    isCompleted: false,
    stepHint: 'Pergi ke timur menuju jembatan. Gunakan Resonansi Emosi untuk melihat luka batin Kakek Ranu.',
  },
  {
    id: 'quest_bimo',
    title: 'Jejak Roda Gigi di Hutan Sunyi',
    targetNPC: 'bimo',
    description: 'Bimo bersembunyi di hutan barat laut. Bantu dia mengatasi rasa takut bersalah agar ia berani menyerahkan roda gigi jam.',
    isCompleted: false,
    stepHint: 'Periksa pepohonan di sudut utara. Bicaralah pada Bimo dengan teknik pemisahan kesalahan.',
  },
  {
    id: 'quest_tower',
    title: 'Membuka Hati Menara Jam',
    targetNPC: 'penjaga_kabut',
    description: 'Bawa Roda Gigi Harmoni ke Menara Jam. Ungkap siapa sosok di balik kabut dan pulihkan warna Lembah Nada Rasa!',
    isCompleted: false,
    stepHint: 'Seberangi jembatan yang terbuka, menuju puncak menara jam di timur laut.',
  },
];

// Initial items
export const INITIAL_ITEMS: Item[] = [];

// Educational SEL Knowledge Nuggets (Kamus Cerdas Emosi)
export const SEL_GLOSSARY = [
  {
    title: 'Otak Siaga vs Otak Bijak',
    concept: 'Amigdala & Korteks Prefrontal',
    explanation: 'Saat kita panik atau marah besar, "Si Penjaga Siaga" (Amigdala) membunyikan alarm bahaya. Agar "Si Pemikir Bijak" (Korteks) bisa bekerja lagi, kita butuh napas perlahan dan ketenangan.',
    icon: '🧠',
  },
  {
    title: 'Gunung Es Emosi (Iceberg Emotion)',
    concept: 'Emosi Lapisan Luar vs Dalam',
    explanation: 'Marah seringkali hanya puncak gunung es yang terlihat di permukaan air. Di dasarnya, tersembunyi rasa kecewa, takut, sedih, atau merasa tidak dihargai.',
    icon: '🧊',
  },
  {
    title: 'Rumus Pesan-Aku (I-Message)',
    concept: 'Komunikasi Asertif Tanpa Menuduh',
    explanation: 'Alih-alih menuduh "Kamu selalu bikin salah!", katakan: "Aku merasa cemas ketika roda gigi hilang, karena kita butuh jam ini berbunyi tepat waktu. Bisakah kita cari bersama?"',
    icon: '💬',
  },
  {
    title: 'Teknik Napas Balon 4-4-4',
    concept: 'Regulasi Fisiologis Mandiri',
    explanation: 'Tarik napas 4 detik (bayangkan meniup balon besar di perut), tahan 4 detik, hembuskan perlahan 4 detik. Tubuh langsung memberi sinyal aman ke otak!',
    icon: '🎈',
  },
];
