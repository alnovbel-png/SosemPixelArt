export type EmotionType = 'marah' | 'sedih' | 'cemas' | 'takut' | 'kecewa' | 'tenang' | 'gembira' | 'haru';

export interface EmotionProfile {
  surfaceEmotion: EmotionType;
  deepEmotion: EmotionType;
  reason: string;
  selInsight: string; // Wawasan ilmiah/psikologis ramah anak
  calmTechnique: 'napas_balon' | 'validasi' | 'reframing' | 'solusi_bersama';
}

export interface ChoiceOption {
  id: string;
  text: string;
  impactScore: number;
  resultDialogueId: string;
  branchTag?: string;
  givesItem?: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  speakerRole: string;
  portrait: string; // identifier for pixel face
  text: string;
  thoughtBubble?: string; // Apa yang dipikirkan dalam hati
  emotionAura?: EmotionType;
  choices?: ChoiceOption[];
  nextId?: string;
  triggerBreathing?: boolean;
  triggerColorRestoreZone?: string;
  triggerQuestProgress?: string;
  soundEffect?: string;
  givesItem?: string;
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  sprite: string;
  facing: 'down' | 'up' | 'left' | 'right';
  emotionProfile: EmotionProfile;
  currentDialogueId: string;
  isResolved: boolean;
  isCustomSecret?: boolean;
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  description: string;
  foundLocation: string;
}

export interface GameQuest {
  id: string;
  title: string;
  targetNPC: string;
  description: string;
  isCompleted: boolean;
  stepHint: string;
}

export interface ZoneColorStatus {
  plaza: boolean;    // Alun-alun & Air Mancur
  bridge: boolean;   // Jembatan Kayu & Kakek Ranu
  forest: boolean;   // Hutan Sunyi & Bimo
  tower: boolean;    // Menara Jam & Penjaga Kabut
}

export interface PlayerStats {
  empathyScore: number;
  resonanceUses: number;
  calmTechniquesMastered: number;
  secretsFound: number;
  unlockedBadges: string[];
}
