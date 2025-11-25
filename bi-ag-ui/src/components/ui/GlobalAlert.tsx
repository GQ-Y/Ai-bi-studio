import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Clock, MapPin } from 'lucide-react';
import { useAppStore } from '../../store';

const VIDEO_SOURCE = "http://192.168.1.210:18000/m4s/live/stream_3_0.mp4?play_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI3NjQwNDE3NTcsImlzcyI6InRzaW5nc2VlLWVhc3ljdnIifQ.2onoGTiix77kt44TCuzwtLF6RcXMdDXzrZPQRX5mIu8";

export const GlobalAlert: React.FC = () => {
  const { alertNotification, setAlertNotification } = useAppStore();

  useEffect(() => {
    if (alertNotification) {
      const timer = setTimeout(() => {
        setAlertNotification(null);
      }, 5000); // 5秒后自动消失
      return () => clearTimeout(timer);
    }
  }, [alertNotification, setAlertNotification]);

  return (
    <AnimatePresence>
      {alertNotification && (
        <motion.div
          initial={{ x: "100%", opacity: 0, y: "-50%" }}
          animate={{ x: 0, opacity: 1, y: "-50%" }}
          exit={{ x: "100%", opacity: 0, y: "-50%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed right-4 top-1/2 z-[100] w-[40%] max-w-2xl bg-slate-900/90 border border-red-500/50 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-red-500/20 px-6 py-3 flex items-center justify-between border-b border-red-500/30">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} className="animate-pulse" />
              <span className="font-bold text-lg">系统预警通知</span>
            </div>
            <button 
              onClick={() => setAlertNotification(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex gap-6">
            {/* Image/Video Area */}
            <div className="w-1/2 aspect-video bg-black rounded-lg overflow-hidden border border-white/10 relative group">
              {/* 这里使用视频流模拟截图，或者可以使用 image */}
               <video 
                  src={VIDEO_SOURCE} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  muted 
                  loop
                  playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                  LIVE CAPTURE
                </div>
            </div>

            {/* Info Area */}
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight">
                  {alertNotification.title}
                </h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <MapPin size={14} className="text-blue-400" />
                  <span>{alertNotification.source}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Clock size={14} className="text-blue-400" />
                  <span>{alertNotification.time}</span>
                </div>
              </div>

              <div className="mt-auto">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded border text-sm font-medium ${
                  alertNotification.level === 'high' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                  alertNotification.level === 'medium' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' :
                  'bg-blue-500/10 border-blue-500/50 text-blue-400'
                }`}>
                  <span>风险等级:</span>
                  <span>
                    {alertNotification.level === 'high' ? '严重 (High)' :
                     alertNotification.level === 'medium' ? '警告 (Medium)' : '一般 (Low)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="h-1 bg-red-500"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

