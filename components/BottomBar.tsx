import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { AudioTrack } from '../types';

interface BottomBarProps {
  isPlaying: boolean;
  currentTrack: AudioTrack | null;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
}

const BottomBar: React.FC<BottomBarProps> = ({
  isPlaying,
  currentTrack,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek
}) => {
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center px-6 gap-6 z-20">
       {/* Track Info */}
       <div className="w-64 flex items-center gap-3">
         {currentTrack ? (
           <>
             <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-600 rounded flex items-center justify-center text-white font-bold text-xs">
                MP3
             </div>
             <div className="min-w-0">
               <h4 className="text-sm font-medium text-white truncate">{currentTrack.name}</h4>
               <p className="text-xs text-slate-400">Spectrum Studio</p>
             </div>
           </>
         ) : (
           <div className="text-slate-500 text-sm italic">Select a track to play</div>
         )}
       </div>

       {/* Player Controls */}
       <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-4">
             <button onClick={onPrev} className="text-slate-400 hover:text-white transition-colors"><SkipBack size={20} /></button>
             <button 
                onClick={onTogglePlay}
                className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition-transform"
             >
               {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
             </button>
             <button onClick={onNext} className="text-slate-400 hover:text-white transition-colors"><SkipForward size={20} /></button>
          </div>
          
          <div className="w-full max-w-2xl flex items-center gap-3 text-xs text-slate-400 font-mono">
             <span>{formatTime(currentTime)}</span>
             <input 
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
             />
             <span>{formatTime(duration)}</span>
          </div>
       </div>

       {/* Volume / Extra */}
       <div className="w-64 flex justify-end">
         <Volume2 className="text-slate-400" size={20} />
       </div>
    </div>
  );
};

export default BottomBar;
