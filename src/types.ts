export type FontFamily = "sans" | "serif" | "mono" | "random";

export interface FreewriteSettings {
  defaultDuration: number;
  folderName: string;
  noBackspace: boolean;
  disableSpellcheck: boolean;
  defaultFontSize: number;
  defaultFontFamily: FontFamily;
}

export const DEFAULT_SETTINGS: FreewriteSettings = {
  defaultDuration: 900,
  folderName: "Freewrite",
  noBackspace: false,
  disableSpellcheck: true,
  defaultFontSize: 18,
  defaultFontFamily: "sans",
};

export const FREEWRITE_VIEW_TYPE = "freewrite-view";

export const FONT_SIZES = [16, 18, 20, 22, 24, 26];

export const FONT_FAMILIES: Record<FontFamily, string> = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  mono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
  random: "",
};

export const RANDOM_FONTS = [
  "Georgia, serif",
  "Garamond, serif",
  "'Palatino Linotype', Palatino, serif",
  "'Book Antiqua', serif",
  "Baskerville, serif",
];

export const PLACEHOLDER_TEXTS = [
  "Begin writing...",
  "What's on your mind?",
  "Just start...",
  "Don't think, just write...",
  "The page is yours...",
  "Let it flow...",
  "Start anywhere...",
  "Write freely...",
];

export const TIMER_PRESETS = [
  { label: "5m",  seconds: 300 },
  { label: "10m", seconds: 600 },
  { label: "15m", seconds: 900 },
  { label: "25m", seconds: 1500 },
];
