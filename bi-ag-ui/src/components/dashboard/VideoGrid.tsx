import React from 'react';
import { TechPanel } from '../ui/TechPanel';
import { Maximize2 } from 'lucide-react';

const videos = [
  { id: 1, loc: '北门入口 CAM-01', status: 'LIVE' },
  { id: 2, loc: '2号仓库 CAM-03', status: 'LIVE' },
  { id: 3, loc: '东侧围栏 CAM-07', status: 'REC' },
  { id: 4, loc: '地下车库 CAM-12', status: 'LIVE' },
];

export const VideoGrid: React.FC = () => {
  return (
    <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-2 p-1">
      {videos.map((v) => (
        <div key={v.id} className="relative bg-black/80 border border-tech-panel-border rounded overflow-hidden group">
          {/* 模拟视频画面 */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="text-tech-text-dim opacity-20 group-hover:opacity-40 transition-opacity">
               <Maximize2 size={32} />
             </div>
             {/* 扫描线 */}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-tech-cyan/10 to-transparent h-[10%] animate-[scanline_3s_linear_infinite]"></div>
          </div>

          {/* 状态标 */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
             <span className="text-xs font-mono text-tech-cyan bg-black/50 px-1.5 py-0.5 border border-tech-cyan/30 rounded">
                {v.loc}
             </span>
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-1">
             <div className={`w-2 h-2 rounded-full ${v.status === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
             <span className="text-[10px] font-bold text-white tracking-wider">{v.status}</span>
          </div>
          
          {/* 角标装饰 */}
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-tech-cyan/50"></div>
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tech-cyan/50"></div>
        </div>
      ))}
    </div>
  );
};

