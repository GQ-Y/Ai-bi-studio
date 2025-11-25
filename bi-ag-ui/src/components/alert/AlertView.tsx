import React, { useState } from 'react';
import { TechPanel } from '../ui/TechPanel';
import { AlertList } from './AlertList';
import type { AlertItem } from './AlertList';
import { AlertFilterPanel } from './AlertFilterPanel';
import { AlertDetail } from './AlertDetail';
import { DetailModal } from './DetailModal';
import { ActionModal } from './ActionModal';
import { AnimatePresence } from 'framer-motion';

export const AlertView: React.FC = () => {
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | undefined>(undefined);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);

  const handleActionSubmit = (data: any) => {
    console.log('Action submitted:', data, selectedAlert?.id);
    // 这里应该调用 API 提交处置结果
    // 模拟处理成功，关闭弹窗
    setIsActionOpen(false);
  };

  return (
    <div className="flex gap-4 h-full w-full relative">
      {/* 左侧：预警列表 (3/4 宽度) */}
      <div className="w-3/4 h-full flex flex-col min-w-0">
        <TechPanel title="全量预警事件列表" className="h-full">
           <AlertList 
             onSelect={setSelectedAlert} 
             onOpenDetail={(alert) => {
               setSelectedAlert(alert);
               setIsDetailOpen(true);
             }}
             selectedId={selectedAlert?.id} 
             viewMode="grid" 
           />
        </TechPanel>
      </div>

      {/* 右侧：操作与筛选面板 (1/4 宽度) */}
      <div className="w-1/4 h-full flex flex-col gap-4 shrink-0 min-w-[320px]">
        {/* 上半部分：高级筛选 */}
        <div className="shrink-0">
           <TechPanel title="高级检索" className="bg-slate-900/60">
              <AlertFilterPanel />
           </TechPanel>
        </div>

        {/* 下半部分：详情/处置 */}
        <div className="flex-1 min-h-0">
           <TechPanel title="事件处置详情" className="h-full bg-slate-900/60 p-0 overflow-hidden">
              <AlertDetail 
                alert={selectedAlert} 
                compactMode={true} 
                onOpenDetail={() => setIsDetailOpen(true)}
                onOpenAction={() => setIsActionOpen(true)}
              />
           </TechPanel>
        </div>
      </div>

      {/* 弹窗层 */}
      <AnimatePresence>
        {isDetailOpen && (
          <DetailModal 
            alert={selectedAlert} 
            isOpen={isDetailOpen} 
            onClose={() => setIsDetailOpen(false)} 
          />
        )}
        {isActionOpen && (
          <ActionModal 
            isOpen={isActionOpen} 
            onClose={() => setIsActionOpen(false)} 
            onSubmit={handleActionSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
