export interface AudioTrack {
  id: string;
  file: File;
  name: string;
  duration: number;
}

export type SpectrumStyle = 'BAR' | 'ROUND_BAR' | 'WAVE' | 'CIRCLE';

export interface VisualSettings {
  // Spectrum
  spectrumStyle: SpectrumStyle;
  spectrumColorStart: string;
  spectrumColorEnd: string;
  sensitivity: number;
  barWidth: number;
  barCount: number;
  
  // Placement
  spectrumX: number; // 0-100 percentage
  spectrumY: number; // 0-100 percentage
  spectrumScale: number;

  // Logo
  logoUrl: string | null;
  logoX: number;
  logoY: number;
  logoScale: number;
  logoRemoveBg: boolean; // Simulation flag

  // Background
  bgUrl: string | null;
  bgFilter: 'NONE' | 'VINTAGE' | 'DARKEN' | 'BLUR';
  
  // Effects
  particlesEnabled: boolean;
  particleIntensity: number;

  // Export Settings
  loopCount: number;
  videoBitrate: number; // Bits per second
}

export const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
  spectrumStyle: 'BAR',
  spectrumColorStart: '#8b5cf6', // Violet 500
  spectrumColorEnd: '#06b6d4',   // Cyan 500
  sensitivity: 1.5,
  barWidth: 5,
  barCount: 128, // Increased for 100% width density
  spectrumX: 50,
  spectrumY: 80,
  spectrumScale: 1.0,
  logoUrl: null,
  logoX: 50,
  logoY: 40,
  logoScale: 1.0,
  logoRemoveBg: false,
  bgUrl: null,
  bgFilter: 'DARKEN',
  particlesEnabled: true,
  particleIntensity: 0.5,
  loopCount: 1,
  videoBitrate: 8000000, // Default 8 Mbps (High)
};

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}