import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store';
import { VideoGrid } from './VideoGrid';
import { CenterMap } from './CenterMap';
import { TechPanel } from '../ui/TechPanel';
import { Sparkles } from 'lucide-react';

export const CenterPanel: React.FC = () => {
  const { centerMode } = useAppStore();

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-tech-panel-border bg-tech-bg/50 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {centerMode === 'video-grid' && (
          <motion.div 
            key="video"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="h-full w-full"
          >
            <VideoGrid />
          </motion.div>
        )}

        {centerMode === 'map' && (
          <motion.div 
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            <CenterMap />
          </motion.div>
        )}

        {centerMode === 'ai-chat' && (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-full w-full p-4 flex flex-col"
          >
             <TechPanel title="AI 智能安防助手" className="h-full border-tech-cyan/50 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                <div className="flex-1 flex flex-col items-center justify-center text-tech-text-dim">
                   <div className="w-24 h-24 rounded-full bg-tech-cyan/10 border border-tech-cyan flex items-center justify-center mb-6 relative">
                      <Sparkles size={40} className="text-tech-cyan animate-pulse" />
                      <div className="absolute inset-0 border border-tech-cyan rounded-full animate-[ping_3s_linear_infinite] opacity-30"></div>
                   </div>
                   <h3 className="text-xl text-white font-bold mb-2">AG-COPILOT 已就绪</h3>
                   <p className="max-w-md text-center mb-8">您可以通过语音或文字指令控制大屏，例如：“切换到监控模式”、“查看北门预警详情”。</p>
                   
                   {/* 模拟对话流 */}
                   <div className="w-full max-w-2xl bg-black/30 rounded p-4 border border-tech-panel-border min-h-[200px]">
                      <div className="text-sm text-tech-cyan mb-2">[System] Copilot initialized.</div>
                      <div className="text-sm text-white">User: 帮我调取北门监控</div>
                      <div className="text-sm text-tech-cyan mt-1">AI: 收到指令，正在为您切换至北门实时画面... (Function Call: switchCamera('north-gate'))</div>
                   </div>
                </div>
             </TechPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

