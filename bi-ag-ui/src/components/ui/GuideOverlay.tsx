import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'lucide-react';
import { useAppStore } from '../../store';

const steps = [
  {
    id: 'nav-show',
    title: '显示导航菜单',
    desc: '请尝试按下 Cmd + O',
    key: 'o',
    check: (store: any) => store.isNavOpen === true,
    type: 'action'
  },
  {
    id: 'nav-hide',
    title: '隐藏导航菜单',
    desc: '菜单已显示！再次按下 Cmd + O 将其隐藏',
    key: 'o',
    check: (store: any) => store.isNavOpen === false,
    type: 'verify'
  },
  {
    id: 'chat-show',
    title: '唤起 AI 助手',
    desc: '请按下 Cmd + K 唤起 AI 助手',
    key: 'k',
    check: (store: any) => store.centerMode === 'ai-chat',
    type: 'action'
  },
  {
    id: 'chat-hide',
    title: '关闭 AI 助手',
    desc: 'AI 助手已就绪。再次按下 Cmd + K 返回',
    key: 'k',
    check: (store: any) => store.centerMode !== 'ai-chat',
    type: 'verify'
  },
  {
    id: 'emergency-trigger',
    title: '触发紧急模式',
    desc: '请按下 Cmd + L 触发紧急广播',
    key: 'l',
    check: (store: any) => store.isEmergency === true,
    type: 'action'
  },
  {
    id: 'emergency-resolve',
    title: '解除紧急模式',
    desc: '请点击屏幕中央的“解除警报”按钮',
    key: '',
    check: (store: any) => store.isEmergency === false,
    type: 'verify'
  }
];

export const GuideOverlay: React.FC = () => {
  const { hasSeenGuide, setHasSeenGuide } = useAppStore();
  const store = useAppStore();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // 初始化显示逻辑
  useEffect(() => {
    if (!hasSeenGuide) {
      setIsVisible(true);
    }
  }, [hasSeenGuide]);

  // 监听状态变化以自动跳转下一步
  useEffect(() => {
    if (!isVisible) return;
    if (currentStepIndex >= steps.length) {
      // 全部完成
      const timer = setTimeout(() => {
        setHasSeenGuide(true);
        setIsVisible(false);
      }, 1500);
      return () => clearTimeout(timer);
    }

    const currentStep = steps[currentStepIndex];
    if (currentStep.check(store)) {
      // 稍微延迟一下，让用户看到状态变化
      const timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [store, currentStepIndex, isVisible, setHasSeenGuide]);

  if (!isVisible) return null;

  // 如果全部完成
  if (currentStepIndex >= steps.length) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-2">恭喜完成所有引导！</h2>
          <p className="text-slate-400">现在您可以自由使用系统了</p>
        </div>
      </motion.div>
    );
  }

  const step = steps[currentStepIndex];
  // 如果是 verify 类型的步骤（例如已经打开了菜单，需要去关闭），此时不应该有全屏遮罩，
  // 而是显示一个非模态的提示框，让用户能看到界面
  const isVerifyStep = step.type === 'verify';

  return (
    <AnimatePresence mode="wait">
      {isVerifyStep ? (
        // Verify Mode: 非模态提示条 (底部或适当位置)
        <motion.div
          key="verify-panel"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div className="bg-blue-600/90 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4">
            <div className="animate-pulse w-3 h-3 bg-white rounded-full" />
            <span className="text-lg font-medium">{step.desc}</span>
          </div>
        </motion.div>
      ) : (
        // Action Mode: 全屏遮罩聚焦
        <motion.div
          key="action-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-12 flex flex-col items-center text-center shadow-2xl">
            {/* 跳过按钮 */}
            <button 
              onClick={() => { setHasSeenGuide(true); setIsVisible(false); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-sm transition-colors"
            >
              跳过引导
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">{step.title}</h2>
              <p className="text-slate-400 text-lg">{step.desc}</p>
            </div>

            {/* Key Visual */}
            {step.key && (
              <div className="flex gap-4 items-center justify-center mb-8">
                <div className="h-20 px-6 min-w-[80px] bg-slate-800 border-b-4 border-slate-950 rounded-xl flex items-center justify-center text-slate-300">
                  <Command size={32} />
                </div>
                <span className="text-2xl text-slate-600 font-bold">+</span>
                <div className="w-20 h-20 bg-white border-b-4 border-slate-300 rounded-xl flex items-center justify-center text-3xl font-bold text-slate-900 uppercase animate-bounce">
                  {step.key}
                </div>
              </div>
            )}

            {/* Progress Dots */}
            <div className="flex gap-2 mt-4">
              {steps.filter(s => s.type === 'action').map((s, idx) => {
                // 计算当前大步骤的进度
                const currentActionIndex = Math.floor(currentStepIndex / 2);
                const isActive = idx === currentActionIndex;
                const isDone = idx < currentActionIndex;
                return (
                  <div 
                    key={s.id} 
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isActive ? 'bg-blue-500 scale-125' : isDone ? 'bg-green-500' : 'bg-slate-700'
                    }`} 
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
