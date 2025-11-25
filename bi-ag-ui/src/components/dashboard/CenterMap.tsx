import React, { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, Maximize2 } from 'lucide-react';
import { TechPanel } from '../ui/TechPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { StationScene } from '../digital-twin/StationScene';

interface CenterMapProps {
  activeVideo?: string | null;
  onCloseVideo?: () => void;
}

const VIDEO_SOURCE = "http://192.168.1.210:18000/m4s/live/stream_3_0.mp4?play_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI3NjQwNDE3NTcsImlzcyI6InRzaW5nc2VlLWVhc3ljdnIifQ.2onoGTiix77kt44TCuzwtLF6RcXMdDXzrZPQRX5mIu8";

export const CenterMap: React.FC<CenterMapProps> = ({ activeVideo, onCloseVideo }) => {
  const [internalVideo, setInternalVideo] = useState<string | null>(null);
  const currentVideo = activeVideo || internalVideo;
  const handleClose = onCloseVideo || (() => setInternalVideo(null));
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (currentVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.error("Auto-play failed", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentVideo, isPlaying]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-950">
      {/* 3D Digital Twin Scene */}
      <div className="absolute inset-0 z-0">
        <StationScene />
      </div>

      {/* Video Overlay Modal */}
      <AnimatePresence>
        {currentVideo && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-8"
          >
            <TechPanel 
               className="w-full max-w-3xl h-[480px] shadow-2xl border-cyan-500/30" 
               title={`实时监控: ${currentVideo}`}
               rightContent={
                 <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setIsPlaying(!isPlaying)}
                     className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                     title={isPlaying ? "暂停" : "播放"}
                   >
                     {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                   </button>
                   <button onClick={handleClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                     <X size={18} />
                   </button>
                 </div>
               }
            >
               <div className="flex-1 bg-black relative overflow-hidden rounded-lg border border-white/5 h-full group">
                  <video 
                    ref={videoRef}
                    src={VIDEO_SOURCE}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                  
                  {/* Video Overlay Info */}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-green-400 flex items-center gap-2 border border-white/10">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     LIVE SIGNAL
                  </div>

                  <div className="absolute bottom-4 left-4 font-mono text-cyan-300/50 text-xs">
                     SIGNAL: OPTIMAL <br/>
                     CAM_ID: {currentVideo}
                  </div>
                  
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                     <button className="p-2 bg-black/50 backdrop-blur rounded-lg hover:bg-cyan-600/80 text-white transition-colors">
                        <Maximize2 size={16} />
                     </button>
                  </div>
               </div>
            </TechPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
