import React, { useState } from 'react';
import { TechPanel } from '../ui/TechPanel';
import { MapPin, X, Maximize2, Globe, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const cameraPoints = [
  { id: 1, x: '30%', y: '40%', label: 'Zone A: 北门' },
  { id: 2, x: '50%', y: '50%', label: 'Zone B: 广场' },
  { id: 3, x: '70%', y: '30%', label: 'Zone C: 仓库' },
];

interface CenterMapProps {
  activeVideo?: string | null;
  onCloseVideo?: () => void;
}

export const CenterMap: React.FC<CenterMapProps> = ({ activeVideo, onCloseVideo }) => {
  const [internalVideo, setInternalVideo] = useState<string | null>(null);
  const currentVideo = activeVideo || internalVideo;
  const handleClose = onCloseVideo || (() => setInternalVideo(null));

  return (
    <div className="relative w-full h-full overflow-hidden bg-black/20">
      {/* 3D 旋转地球背景 (CSS 模拟) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-30 pointer-events-none">
         <div className="w-full h-full border border-cyber-primary/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
         <div className="absolute top-[10%] left-[10%] w-[80%] h-[80%] border border-cyber-secondary/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
         <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] border border-white/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
         {/* 经纬线网格 */}
         <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_50%,rgba(0,240,255,0.1)_100%)]"></div>
      </div>

      {/* 悬浮 UI 层 */}
      <div className="absolute inset-0 z-10">
        {/* 瞄准准星 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyber-primary/20">
           <Crosshair size={400} strokeWidth={0.5} />
        </div>

        {cameraPoints.map((point) => (
          <div 
            key={point.id}
            className="absolute cursor-pointer group z-20"
            style={{ left: point.x, top: point.y }}
            onClick={() => setInternalVideo(`CAM-${point.id}`)}
          >
            <div className="relative flex items-center justify-center w-12 h-12">
               <div className="absolute inset-0 bg-cyber-primary/30 rounded-full animate-ping"></div>
               <div className="relative z-10 p-2 bg-black border-2 border-cyber-primary rounded-full text-cyber-primary hover:bg-cyber-primary hover:text-black transition-colors shadow-[0_0_20px_#00f0ff]">
                 <MapPin size={20} />
               </div>
               {/* 连接线 */}
               <div className="absolute top-full left-1/2 w-[1px] h-12 bg-gradient-to-b from-cyber-primary to-transparent"></div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-black/80 border border-cyber-primary text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity clip-tech-corner">
              {point.label}
            </div>
          </div>
        ))}
      </div>

      {/* 视频弹窗 */}
      <AnimatePresence>
        {currentVideo && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-8"
          >
            <TechPanel className="w-full max-w-4xl h-[500px]" title={`正在连接: ${currentVideo}`} variant="alert">
               <button onClick={handleClose} className="absolute top-4 right-4 text-white hover:text-cyber-accent">
                 <X size={24} />
               </button>
               <div className="flex-1 bg-black relative overflow-hidden border border-white/10">
                  <div className="absolute inset-0 flex items-center justify-center text-cyber-primary/50">
                     <Maximize2 size={64} />
                  </div>
                  <div className="absolute bottom-4 left-4 font-mono text-cyber-primary text-sm">
                     SIGNAL: STRONG <br/>
                     LAT: 34.0522 N <br/>
                     LNG: 118.2437 W
                  </div>
                  {/* 干扰噪点 */}
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 animate-pulse"></div>
               </div>
            </TechPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
