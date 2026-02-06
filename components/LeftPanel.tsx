import React, { useRef, useState, useMemo } from 'react';
import { Upload, Music, Image as ImageIcon, Copy, Clock, Trash2, GripVertical, Info } from 'lucide-react';
import { AudioTrack } from '../types';

interface LeftPanelProps {
  tracks: AudioTrack[];
  onAddTracks: (files: FileList) => void;
  onRemoveTrack: (id: string) => void;
  onReorderTracks: (fromIndex: number, toIndex: number) => void;
  onUploadBg: (file: File) => void;
  onUploadLogo: (file: File) => void;
  currentTrackId: string | null;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  tracks,
  onAddTracks,
  onRemoveTrack,
  onReorderTracks,
  onUploadBg,
  onUploadLogo,
  currentTrackId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = useMemo(() => {
    return tracks.reduce((acc, track) => acc + track.duration, 0);
  }, [tracks]);

  const handleCopyTimeline = () => {
    let currentTime = 0;
    const lines = tracks.map(track => {
      const mins = Math.floor(currentTime / 60).toString().padStart(2, '0');
      const secs = Math.floor(currentTime % 60).toString().padStart(2, '0');
      const line = `${mins}:${secs} ${track.name.replace(/\.[^/.]+$/, "")}`;
      currentTime += track.duration;
      return line;
    });
    navigator.clipboard.writeText(lines.join('\n'));
    alert('Timeline copied to clipboard!');
  };

  // DnD Handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const onDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    onReorderTracks(draggedIndex, index);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-10">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-1">
          Spectrum Studio
        </h1>
        <p className="text-xs text-slate-400">Local-First Video Editor</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Assets Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assets</h2>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => bgInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors group"
            >
              <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 mb-2" />
              <span className="text-xs text-slate-300">Background</span>
            </button>
            <input 
                type="file" 
                ref={bgInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onUploadBg(e.target.files[0])}
            />

            <button 
              onClick={() => logoInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors group"
            >
              <div className="relative">
                 <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-violet-400 mb-2" />
                 <div className="absolute -bottom-1 -right-1 bg-violet-500 rounded-full w-3 h-3 border-2 border-slate-800"></div>
              </div>
              <span className="text-xs text-slate-300">Logo</span>
            </button>
             <input 
                type="file" 
                ref={logoInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onUploadLogo(e.target.files[0])}
            />
          </div>
        </div>

        {/* Playlist Section */}
        <div className="space-y-3">
           <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Playlist</h2>
              {tracks.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/80 font-mono">
                  <Clock size={10} />
                  <span>Total: {formatDuration(totalDuration)}</span>
                </div>
              )}
            </div>
            <button 
              onClick={handleCopyTimeline}
              className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-400/10 px-2 py-1 rounded"
              disabled={tracks.length === 0}
            >
              <Copy size={12} /> Timeline
            </button>
           </div>

           <div className="space-y-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-lg text-slate-400 text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Upload size={16} /> Add Audio Files
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                multiple 
                accept="audio/*" 
                className="hidden"
                onChange={(e) => e.target.files && onAddTracks(e.target.files)}
              />
           </div>

           <div className="space-y-1 mt-2">
             {tracks.map((track, idx) => (
               <div 
                key={track.id} 
                draggable="true"
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDrop={(e) => onDrop(e, idx)}
                onDragEnd={onDragEnd}
                className={`flex items-center gap-2 p-2 rounded-md text-sm group relative transition-all duration-200 cursor-default ${
                    draggedIndex === idx ? 'opacity-40 scale-95' : 'opacity-100'
                } ${
                    dragOverIndex === idx ? 'border-t-2 border-cyan-400 pt-3' : 'border-t border-transparent'
                } ${
                    currentTrackId === track.id ? 'bg-violet-500/20 border-l-4 border-l-violet-500' : 'bg-slate-800'
                }`}
               >
                 <div className="text-slate-500 cursor-grab active:cursor-grabbing hover:text-slate-300 transition-colors">
                    <GripVertical size={14} />
                 </div>
                 <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center shrink-0">
                    <Music size={12} className={currentTrackId === track.id ? 'text-violet-400 animate-pulse' : 'text-slate-400'} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="truncate text-slate-200 font-medium">{track.name}</p>
                   <p className="text-xs text-slate-500 flex items-center gap-1">
                     <Clock size={10} /> {Math.floor(track.duration / 60)}:{(Math.floor(track.duration % 60)).toString().padStart(2, '0')}
                   </p>
                 </div>
                 <button 
                  onClick={(e) => { e.stopPropagation(); onRemoveTrack(track.id); }}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition-opacity"
                 >
                   <Trash2 size={14} />
                 </button>
               </div>
             ))}
             {tracks.length === 0 && (
               <div className="text-center py-6 px-4">
                 <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 mb-2">
                    <Music size={14} className="text-slate-600" />
                 </div>
                 <p className="text-xs text-slate-600">No tracks added yet.</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;