import React, { useState } from 'react';
import { VisualSettings, DEFAULT_VISUAL_SETTINGS } from '../types';
import { SPECTRUM_STYLES, COLOR_PALETTES, BG_FILTERS } from '../constants';
import { Sliders, Palette, Layout, Wand2, Settings, Download, Repeat, Shuffle, HardDrive } from 'lucide-react';

interface RightPanelProps {
  settings: VisualSettings;
  updateSettings: (newSettings: Partial<VisualSettings>) => void;
  isExporting: boolean;
  exportProgress: number;
  onExport: () => void;
}

type Tab = 'VISUAL' | 'EXPORT';

const BITRATE_OPTIONS = [
    { label: 'Low', value: 2500000, desc: 'Small File' },      // 2.5 Mbps
    { label: 'Medium', value: 5000000, desc: 'Balanced' },     // 5 Mbps
    { label: 'High', value: 8000000, desc: 'HD Quality' },     // 8 Mbps
    { label: 'Ultra', value: 15000000, desc: 'Max Detail' },   // 15 Mbps
];

const RightPanel: React.FC<RightPanelProps> = ({
  settings,
  updateSettings,
  isExporting,
  exportProgress,
  onExport
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('VISUAL');

  const getRandomHexColor = () => {
    const chars = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += chars[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handlePaletteClick = (palette: typeof COLOR_PALETTES[0]) => {
    if (palette.name === 'Random') {
      updateSettings({
        spectrumColorStart: getRandomHexColor(),
        spectrumColorEnd: getRandomHexColor()
      });
    } else {
      updateSettings({
        spectrumColorStart: palette.start,
        spectrumColorEnd: palette.end
      });
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-10 overflow-y-auto">
      {/* Tab Header */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('VISUAL')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'VISUAL' 
              ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Wand2 size={14} /> Visuals
        </button>
        <button
          onClick={() => setActiveTab('EXPORT')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'EXPORT' 
              ? 'text-violet-400 border-b-2 border-violet-400 bg-slate-800/50' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Settings size={14} /> Settings
        </button>
      </div>

      <div className="p-4 space-y-8 flex-1">
        
        {/* --- VISUAL TAB --- */}
        {activeTab === 'VISUAL' && (
          <>
            {/* Spectrum Style */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase">Spectrum Style</h3>
              <div className="grid grid-cols-2 gap-2">
                {SPECTRUM_STYLES.map(style => (
                  <button
                    key={style.value}
                    onClick={() => updateSettings({ spectrumStyle: style.value })}
                    className={`p-2 text-xs rounded border transition-all ${
                      settings.spectrumStyle === style.value
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Colors */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase flex items-center gap-2">
                <Palette size={12} /> Color Theme
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.name}
                    title={palette.name}
                    onClick={() => handlePaletteClick(palette)}
                    className="group relative flex flex-col items-center gap-1.5"
                  >
                    <div 
                      className="w-10 h-10 rounded-xl border-2 border-slate-700 group-hover:border-cyan-400 group-hover:scale-110 transition-all shadow-lg flex items-center justify-center overflow-hidden"
                      style={{ 
                        background: palette.name === 'Random' 
                          ? 'conic-gradient(from 0deg, red, orange, yellow, green, blue, purple, red)' 
                          : `linear-gradient(135deg, ${palette.start}, ${palette.end})` 
                      }}
                    >
                      {palette.name === 'Random' && <Shuffle size={16} className="text-white drop-shadow-md" />}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium group-hover:text-slate-300 transition-colors uppercase tracking-tight">
                      {palette.name}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400">Start Color</label>
                    <div className="flex items-center gap-2">
                        <input type="text" value={settings.spectrumColorStart} readOnly className="w-16 bg-slate-800 text-xs p-1 rounded text-center text-slate-300 font-mono" />
                        <input 
                            type="color" 
                            value={settings.spectrumColorStart}
                            onChange={(e) => updateSettings({ spectrumColorStart: e.target.value })}
                            className="w-6 h-6 rounded overflow-hidden cursor-pointer border-none p-0 bg-transparent"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400">End Color</label>
                    <div className="flex items-center gap-2">
                        <input type="text" value={settings.spectrumColorEnd} readOnly className="w-16 bg-slate-800 text-xs p-1 rounded text-center text-slate-300 font-mono" />
                        <input 
                            type="color" 
                            value={settings.spectrumColorEnd}
                            onChange={(e) => updateSettings({ spectrumColorEnd: e.target.value })}
                            className="w-6 h-6 rounded overflow-hidden cursor-pointer border-none p-0 bg-transparent"
                        />
                    </div>
                </div>
              </div>
            </section>

            {/* Adjustments */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase flex items-center gap-2">
                <Layout size={12} /> Layout & Physics
              </h3>
              
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Sensitivity</span>
                  <span>{settings.sensitivity.toFixed(1)}</span>
                </div>
                <input 
                    type="range" min="0.5" max="5.0" step="0.1" 
                    value={settings.sensitivity}
                    onChange={(e) => updateSettings({ sensitivity: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Position Y</span>
                  <span>{settings.spectrumY}%</span>
                </div>
                <input 
                    type="range" min="0" max="100" 
                    value={settings.spectrumY}
                    onChange={(e) => updateSettings({ spectrumY: parseInt(e.target.value) })}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Scale</span>
                  <span>{settings.spectrumScale.toFixed(1)}x</span>
                </div>
                <input 
                    type="range" min="0.2" max="2.0" step="0.1"
                    value={settings.spectrumScale}
                    onChange={(e) => updateSettings({ spectrumScale: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </section>

            {/* Effects */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase flex items-center gap-2">
                <Wand2 size={12} /> Effects
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Particles</span>
                    <button 
                      onClick={() => updateSettings({ particlesEnabled: !settings.particlesEnabled })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${settings.particlesEnabled ? 'bg-violet-600' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.particlesEnabled ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
                
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Logo Magic Remove</span>
                    <button 
                      onClick={() => updateSettings({ logoRemoveBg: !settings.logoRemoveBg })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${settings.logoRemoveBg ? 'bg-violet-600' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.logoRemoveBg ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block mb-2">Background Filter</span>
                  <div className="grid grid-cols-2 gap-2">
                      {BG_FILTERS.map(f => (
                        <button
                          key={f.value}
                          onClick={() => updateSettings({ bgFilter: f.value as any })}
                          className={`text-xs p-1 rounded border ${
                            settings.bgFilter === f.value 
                            ? 'bg-cyan-900/50 border-cyan-500 text-cyan-200' 
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* --- EXPORT SETTINGS TAB --- */}
        {activeTab === 'EXPORT' && (
          <>
             <section className="space-y-4">
               <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase flex items-center gap-2">
                 <HardDrive size={12} /> Video Quality (Compression)
               </h3>
               
               <div className="grid grid-cols-2 gap-2">
                  {BITRATE_OPTIONS.map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => updateSettings({ videoBitrate: opt.value })}
                        className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${
                            settings.videoBitrate === opt.value
                            ? 'bg-violet-600 border-violet-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                         <span className="text-xs font-bold">{opt.label}</span>
                         <span className="text-[10px] opacity-70">{opt.desc}</span>
                      </button>
                  ))}
               </div>
               
               <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700">
                     <span className="text-xs text-slate-300">Target Bitrate</span>
                     <span className="text-xs font-mono font-medium text-cyan-400">
                       {(settings.videoBitrate / 1000000).toFixed(1)} Mbps
                     </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700">
                     <span className="text-xs text-slate-300">Resolution</span>
                     <span className="text-xs font-mono font-medium text-cyan-400">1920 x 1080 (FHD)</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700">
                     <span className="text-xs text-slate-300">Frame Rate</span>
                     <span className="text-xs font-mono font-medium text-cyan-400">60 FPS</span>
                  </div>
               </div>
               
               <p className="text-[10px] text-slate-500 mt-2 p-2 bg-slate-800/50 rounded border border-slate-800/50">
                  <InfoIcon className="inline w-3 h-3 mr-1 align-text-bottom" />
                  Higher bitrates mean better quality but larger file sizes. "Medium" is recommended for YouTube/Instagram.
               </p>
             </section>
          </>
        )}
      </div>

      {/* Export Button (Always Visible) */}
      <div className="p-4 border-t border-slate-800 bg-slate-900 z-20">
          {isExporting ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white">
                <span>Rendering...</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={onExport}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-violet-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Export Playlist (MP4)
            </button>
          )}
      </div>
    </div>
  );
};

// Helper Icon component for the info text
const InfoIcon = ({ className }: { className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
);

export default RightPanel;