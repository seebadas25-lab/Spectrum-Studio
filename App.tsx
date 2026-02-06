import React, { useState, useEffect, useRef, useCallback } from 'react';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import BottomBar from './components/BottomBar';
import VisualizerCanvas, { VisualizerHandle } from './components/VisualizerCanvas';
import { AudioTrack, VisualSettings, DEFAULT_VISUAL_SETTINGS } from './types';

const App: React.FC = () => {
  // State: Assets
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  
  // State: Visuals
  const [settings, setSettings] = useState<VisualSettings>(DEFAULT_VISUAL_SETTINGS);

  // State: Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // State: Export (Recording)
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0); // Used for visual feedback mostly
  const [exportStatus, setExportStatus] = useState<string>('');

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerHandleRef = useRef<VisualizerHandle | null>(null);
  
  // Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Stabilize callbacks
  const handleCanvasRef = useCallback((ref: HTMLCanvasElement | null) => {
    if (ref) canvasRef.current = ref;
  }, []);

  const handleMountVisualizer = useCallback((handle: VisualizerHandle) => {
    visualizerHandleRef.current = handle;
  }, []);

  // --- Audio Initialization ---
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const ana = ctx.createAnalyser();
    ana.fftSize = 2048;
    ana.smoothingTimeConstant = 0.1;
    
    setAnalyser(ana);
    audioContextRef.current = ctx;

    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioElemRef.current = audio;

    const source = ctx.createMediaElementSource(audio);
    source.connect(ana);
    ana.connect(ctx.destination);

    return () => {
      ctx.close();
    };
  }, []);

  // --- Event Listeners ---
  useEffect(() => {
    const audio = audioElemRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    
    const handleEnded = () => {
      if (isExporting) {
        // Proceed to next track in playlist during export
        if (currentTrackIndex < tracks.length - 1) {
           setExportStatus(`Recording Track ${currentTrackIndex + 2}/${tracks.length}...`);
           playTrack(currentTrackIndex + 1);
        } else {
           stopRecording();
        }
      } else {
        // Normal Playback Ended
        setIsPlaying(false);
        if (currentTrackIndex < tracks.length - 1) {
           playTrack(currentTrackIndex + 1);
        }
      }
    };

    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [tracks, currentTrackIndex, isExporting]);

  const handleAddTracks = async (fileList: FileList) => {
    const newTracks: AudioTrack[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const getDuration = (f: File): Promise<number> => {
        return new Promise(resolve => {
           const audio = new Audio(URL.createObjectURL(f));
           audio.onloadedmetadata = () => resolve(audio.duration);
        });
      };
      const dur = await getDuration(file);
      newTracks.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        duration: dur
      });
    }
    setTracks(prev => {
        const updated = [...prev, ...newTracks];
        if (prev.length === 0 && updated.length > 0) {
           setCurrentTrackIndex(0);
           if(audioElemRef.current) audioElemRef.current.src = URL.createObjectURL(updated[0].file);
        }
        return updated;
    });
  };

  const playTrack = (index: number) => {
    if (index < 0 || index >= tracks.length) return;
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    const track = tracks[index];
    if (audioElemRef.current) {
        audioElemRef.current.src = URL.createObjectURL(track.file);
        audioElemRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(e => console.error("Playback failed:", e));
        setCurrentTrackIndex(index);
    }
  };

  const handleReorderTracks = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    setTracks(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      if (currentTrackIndex === fromIndex) {
        setCurrentTrackIndex(toIndex);
      } else if (fromIndex < currentTrackIndex && toIndex >= currentTrackIndex) {
        setCurrentTrackIndex(currentTrackIndex - 1);
      } else if (fromIndex > currentTrackIndex && toIndex <= currentTrackIndex) {
        setCurrentTrackIndex(currentTrackIndex + 1);
      }
      return result;
    });
  };

  const togglePlay = () => {
    if (!audioElemRef.current) return;
    if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }
    if (isPlaying) {
      audioElemRef.current.pause();
      setIsPlaying(false);
    } else {
       if (currentTrackIndex === -1 && tracks.length > 0) {
           playTrack(0);
           return;
       }
       audioElemRef.current.play().catch(e => console.error(e));
       setIsPlaying(true);
    }
  };

  // --- Real-time Recording Logic ---

  const handleExport = async () => {
    if (!canvasRef.current || tracks.length === 0) {
        alert("재생 목록에 트랙을 추가해주세요.");
        return;
    }

    const audioCtx = audioContextRef.current;
    const audioAnalyser = analyser;
    
    if (!audioCtx || !audioAnalyser) return;

    // 1. Prepare State
    setIsExporting(true);
    setIsPlaying(true);
    recordedChunksRef.current = [];
    setExportStatus('Starting Real-time Recording...');
    
    // 2. Setup Audio Capture
    const streamDest = audioCtx.createMediaStreamDestination();
    streamDestRef.current = streamDest;
    audioAnalyser.connect(streamDest);

    // 3. Setup Video Capture (Canvas Stream)
    const canvasStream = canvasRef.current.captureStream(60); 
    
    // 4. Combine Tracks
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...streamDest.stream.getAudioTracks()
    ]);

    // 5. Initialize MediaRecorder
    const mimeTypes = [
        'video/mp4;codecs=avc1,aac',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
    ];
    let selectedMimeType = '';
    for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
            selectedMimeType = mime;
            break;
        }
    }

    if (!selectedMimeType) {
        alert("이 브라우저에서는 비디오 녹화를 지원하지 않습니다.");
        setIsExporting(false);
        setIsPlaying(false);
        return;
    }

    console.log(`Using MIME type: ${selectedMimeType}`);
    
    // Configured via settings
    const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: settings.videoBitrate, // Dynamic bitrate
        audioBitsPerSecond: 192000 // 192 kbps
    });

    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
        }
    };

    recorder.onstop = () => {
        downloadRecording(selectedMimeType);
    };

    mediaRecorderRef.current = recorder;

    // 6. Start Playback & Recording
    recorder.start();
    
    // Start from the first track for the recording
    setExportStatus(`Recording Track 1/${tracks.length}...`);
    playTrack(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
    }
    
    // Cleanup Audio Graph
    if (streamDestRef.current && analyser) {
        analyser.disconnect(streamDestRef.current);
        streamDestRef.current = null;
    }

    setIsExporting(false);
    setIsPlaying(false);
    if (audioElemRef.current) audioElemRef.current.pause();
    setExportStatus('Finalizing...');
  };

  const downloadRecording = (mimeType: string) => {
    const blob = new Blob(recordedChunksRef.current, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    a.download = `spectrum_studio_live_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setExportStatus('');
    alert("녹화가 완료되었습니다!");
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200">
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel 
          tracks={tracks}
          currentTrackId={currentTrackIndex > -1 ? tracks[currentTrackIndex].id : null}
          onAddTracks={handleAddTracks}
          onRemoveTrack={(id) => {
             setTracks(prev => prev.filter(t => t.id !== id));
             if (tracks[currentTrackIndex]?.id === id) {
                 audioElemRef.current?.pause();
                 setCurrentTrackIndex(-1);
                 setIsPlaying(false);
             }
          }}
          onReorderTracks={handleReorderTracks}
          onUploadBg={(file) => setSettings(prev => ({ ...prev, bgUrl: URL.createObjectURL(file) }))}
          onUploadLogo={(file) => setSettings(prev => ({ ...prev, logoUrl: URL.createObjectURL(file) }))}
        />

        <div className="flex-1 bg-black relative flex items-center justify-center p-4 overflow-hidden">
            <div className="relative aspect-video w-full max-w-[1920px] max-h-full bg-slate-900 border border-slate-800 shadow-2xl rounded-lg overflow-hidden flex flex-col shadow-violet-900/20">
                 {isExporting && (
                    <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full" />
                            REC (실시간 녹화 중)
                        </div>
                        <div className="bg-black/80 backdrop-blur px-3 py-1 rounded border border-slate-700 text-[10px] font-mono text-cyan-400">
                           {exportStatus}
                        </div>
                    </div>
                 )}
                 
                 <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-slate-300">
                    1920x1080 (FHD)
                 </div>
                 
                 <VisualizerCanvas 
                    settings={settings}
                    analyser={analyser}
                    isPlaying={isPlaying || isExporting}
                    onCanvasRef={handleCanvasRef}
                    onMountHandle={handleMountVisualizer}
                 />
            </div>
        </div>

        <RightPanel 
           settings={settings}
           updateSettings={(s) => setSettings(prev => ({...prev, ...s}))}
           isExporting={isExporting}
           exportProgress={exportProgress}
           onExport={handleExport}
        />
      </div>

      <BottomBar 
        isPlaying={isPlaying}
        currentTrack={currentTrackIndex > -1 ? tracks[currentTrackIndex] : null}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlay}
        onNext={() => playTrack(currentTrackIndex + 1)}
        onPrev={() => playTrack(currentTrackIndex - 1)}
        onSeek={(t) => { if(audioElemRef.current) audioElemRef.current.currentTime = t; }}
      />
    </div>
  );
};

export default App;