import React, { useRef, useEffect, useImperativeHandle } from 'react';
import { VisualSettings, Particle } from '../types';

export interface VisualizerHandle {
    drawFrame: (frequencyData: Uint8Array) => void;
}

interface VisualizerCanvasProps {
  settings: VisualSettings;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  onCanvasRef: (canvas: HTMLCanvasElement | null) => void;
  onMountHandle?: (handle: VisualizerHandle) => void;
}

const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  settings,
  analyser,
  isPlaying,
  onCanvasRef,
  onMountHandle
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  
  const prevDataArrayRef = useRef<Float32Array | null>(null);

  // Initialize Particles
  useEffect(() => {
    if (settings.particlesEnabled) {
      const count = Math.floor(settings.particleIntensity * 100);
      particlesRef.current = Array.from({ length: count }).map(() => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.5 + 0.2,
      }));
    } else {
      particlesRef.current = [];
    }
  }, [settings.particlesEnabled, settings.particleIntensity]);

  // Load Background
  useEffect(() => {
    if (settings.bgUrl) {
      const img = new Image();
      img.src = settings.bgUrl;
      img.onload = () => { bgImageRef.current = img; };
    } else {
      bgImageRef.current = null;
    }
  }, [settings.bgUrl]);

  // Load Logo
  useEffect(() => {
    if (settings.logoUrl) {
      const img = new Image();
      img.src = settings.logoUrl;
      img.onload = () => { logoImageRef.current = img; };
    } else {
      logoImageRef.current = null;
    }
  }, [settings.logoUrl]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    onCanvasRef(canvas);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Use internal resolution
    canvas.width = 1920;
    canvas.height = 1080;

    const render = () => {
      frameCountRef.current++;
      const { width, height } = canvas;
      const hScale = height / 1080;
      
      // 1. Clear & Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      if (bgImageRef.current) {
        const img = bgImageRef.current;
        const ratio = Math.max(width / img.width, height / img.height);
        const nw = img.width * ratio;
        const nh = img.height * ratio;
        ctx.drawImage(img, (width - nw) / 2, (height - nh) / 2, nw, nh);
        
        if (settings.bgFilter === 'DARKEN') {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(0, 0, width, height);
        } else if (settings.bgFilter === 'VINTAGE') {
          ctx.fillStyle = 'rgba(255, 200, 150, 0.15)';
          ctx.fillRect(0, 0, width, height);
          const grad = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,0.6)');
          ctx.fillStyle = grad;
          ctx.fillRect(0,0,width,height);
        } else if (settings.bgFilter === 'BLUR') {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
            ctx.fillRect(0, 0, width, height);
        }
      } else {
        const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Audio Data Processing
      const barValues = new Float32Array(settings.barCount);
      
      if (analyser && isPlaying) {
        // Play Mode / Recording Mode
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const minFreq = 20;
        const maxFreq = 16000; 
        const sampleRate = analyser.context.sampleRate;

        for (let i = 0; i < settings.barCount; i++) {
          const targetFreq = minFreq * Math.pow(maxFreq / minFreq, i / settings.barCount);
          const binIndex = Math.floor((targetFreq * bufferLength * 2) / sampleRate);
          
          let sum = 0;
          const neighborCount = 1;
          let count = 0;
          for (let n = -neighborCount; n <= neighborCount; n++) {
            const idx = binIndex + n;
            if (idx >= 0 && idx < bufferLength) {
              sum += dataArray[idx];
              count++;
            }
          }
          barValues[i] = count > 0 ? sum / count : 0;
        }
      } else {
        // Idle Mode
        for (let i = 0; i < settings.barCount; i++) {
          const pulse = Math.sin(frameCountRef.current * 0.05) * 0.2 + 0.3;
          const wave = Math.sin(i * 0.15 + frameCountRef.current * 0.04) * 0.5 + 0.5;
          barValues[i] = (pulse * wave * 50); 
        }
      }

      // 3. Smoothing
      if (!prevDataArrayRef.current || prevDataArrayRef.current.length !== settings.barCount) {
        prevDataArrayRef.current = new Float32Array(settings.barCount);
      }
      
      for (let i = 0; i < settings.barCount; i++) {
        const newVal = barValues[i];
        const oldVal = prevDataArrayRef.current[i];
        const smoothFactor = 0.8;
        if (newVal > oldVal) {
          barValues[i] = newVal;
        } else {
          barValues[i] = oldVal * smoothFactor + newVal * (1 - smoothFactor);
        }
        prevDataArrayRef.current[i] = barValues[i];
      }

      // 4. Particles
      if (settings.particlesEnabled) {
        let bassEnergy = 0;
        for(let i=0; i<Math.min(10, barValues.length); i++) bassEnergy += barValues[i];
        bassEnergy /= 10;
        const speedBoost = 1 + (bassEnergy / 255) * 5;

        particlesRef.current.forEach(p => {
          p.x += p.vx * speedBoost;
          p.y += p.vy * speedBoost;
          if(p.x < 0) p.x = 1; if(p.x > 1) p.x = 0;
          if(p.y < 0) p.y = 1; if(p.y > 1) p.y = 0;
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.arc(p.x * width, p.y * height, p.size * hScale, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 5. Logo
      if (logoImageRef.current) {
        const img = logoImageRef.current;
        const lw = img.width * settings.logoScale * 0.4 * hScale;
        const lh = img.height * settings.logoScale * 0.4 * hScale;
        const lx = (settings.logoX / 100) * width - lw / 2;
        const ly = (settings.logoY / 100) * height - lh / 2;
        ctx.save();
        if (settings.logoRemoveBg) ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(img, lx, ly, lw, lh);
        ctx.restore();
      }

      // 6. Spectrum Rendering
      const cx = (settings.spectrumX / 100) * width;
      const cy = (settings.spectrumY / 100) * height;
      const barCount = settings.barCount;
      
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, settings.spectrumColorStart);
      gradient.addColorStop(1, settings.spectrumColorEnd);
      ctx.fillStyle = gradient;
      ctx.strokeStyle = gradient;

      if (settings.spectrumStyle === 'BAR' || settings.spectrumStyle === 'ROUND_BAR') {
        const gap = 2 * hScale; 
        const slotWidth = width / barCount;
        const actualBarWidth = Math.max(1.5, slotWidth - gap);

        for (let i = 0; i < barCount; i++) {
          const val = barValues[i];
          // Height scale adjusted for safety
          const barH = (val * settings.sensitivity * 0.4 * settings.spectrumScale * hScale) + 2;
          const x = i * slotWidth + (gap / 2);
          
          if (settings.spectrumStyle === 'ROUND_BAR') {
              ctx.beginPath();
              const radius = actualBarWidth / 2;
              ctx.moveTo(x + radius, cy - barH);
              ctx.lineTo(x + actualBarWidth - radius, cy - barH);
              ctx.quadraticCurveTo(x + actualBarWidth, cy - barH, x + actualBarWidth, cy - barH + radius);
              ctx.lineTo(x + actualBarWidth, cy);
              ctx.lineTo(x, cy);
              ctx.lineTo(x, cy - barH + radius);
              ctx.quadraticCurveTo(x, cy - barH, x + radius, cy - barH);
              ctx.fill();
          } else {
              ctx.fillRect(x, cy - barH, actualBarWidth, barH);
          }
        }
      } else if (settings.spectrumStyle === 'CIRCLE') {
        const baseRadius = 180 * settings.spectrumScale * hScale;
        let totalEnergy = 0;
        for(let i=0; i<barCount; i++) totalEnergy += barValues[i];
        const pulseScale = 1 + (totalEnergy / (barCount * 255)) * 0.3;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(pulseScale, pulseScale);
        for (let i = 0; i < barCount; i++) {
          const val = barValues[i];
          const barH = (val * settings.sensitivity * 0.22 * hScale); 
          ctx.rotate((Math.PI * 2) / barCount);
          ctx.fillRect(-1.5 * hScale, baseRadius, 3 * hScale, Math.max(2, barH));
        }
        ctx.restore();
      } else if (settings.spectrumStyle === 'WAVE') {
        ctx.lineWidth = 4 * hScale;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        const sw = width / (barCount - 1);
        for(let i = 0; i < barCount; i++) {
          const val = barValues[i];
          const bh = (val / 255) * 140 * settings.sensitivity * settings.spectrumScale * hScale;
          const x = i * sw;
          const y = cy - bh;
          if(i === 0) ctx.moveTo(x, y);
          else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      requestRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [settings, analyser, isPlaying]);

  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={1920}
        height={1080}
        className="w-full h-full object-contain"
      />
      {!analyser && !settings.bgUrl && (
         <div className="absolute inset-0 flex items-center justify-center text-slate-500 pointer-events-none">
           <div className="text-center">
             <p className="text-lg font-bold text-slate-400">Spectrum Studio Ready</p>
             <p className="text-sm">음악 파일을 추가하여 시작하세요</p>
           </div>
         </div>
      )}
    </div>
  );
};

export default VisualizerCanvas;