import { SpectrumStyle } from './types';

export const COLOR_PALETTES = [
  { name: 'Random', start: 'RANDOM', end: 'RANDOM' },
  { name: 'Neon Sky', start: '#c084fc', end: '#db2777' }, // Purple 400 to Pink 600
  { name: 'Deep Sea', start: '#0ea5e9', end: '#2dd4bf' }, // Blue 500 to Teal 400
  { name: 'Aurora', start: '#4ade80', end: '#6366f1' },   // Green 400 to Indigo 500
  { name: 'Flame', start: '#f59e0b', end: '#dc2626' },    // Amber 500 to Red 600
  { name: 'Candy', start: '#f472b6', end: '#fb923c' },    // Pink 400 to Orange 400
  { name: 'Forest', start: '#84cc16', end: '#059669' },   // Lime 500 to Emerald 600
  { name: 'Twilight', start: '#1d4ed8', end: '#7e22ce' }, // Blue 700 to Purple 700
  { name: 'Pure', start: '#f8fafc', end: '#475569' },     // White to Slate 600
];

export const SPECTRUM_STYLES: { label: string; value: SpectrumStyle }[] = [
  { label: 'Classic Bars', value: 'BAR' },
  { label: 'Round Bars', value: 'ROUND_BAR' },
  { label: 'Waveform', value: 'WAVE' },
  { label: 'Circle Ring', value: 'CIRCLE' },
];

export const BG_FILTERS = [
  { label: 'Original', value: 'NONE' },
  { label: 'Darken', value: 'DARKEN' },
  { label: 'Vintage', value: 'VINTAGE' },
  { label: 'Blur', value: 'BLUR' },
];