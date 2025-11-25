import React, { useState } from 'react';
import { X, Send, User, Upload, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [method, setMethod] = useState('dispatch');
  const [remark, setRemark] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
           <h3 className="text-lg font-bold text-white">事件处置工单</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
           <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">处置方式</label>
              <div className="grid grid-cols-3 gap-2">
                 {['dispatch', 'broadcast', 'ignore'].map(m => (
                   <button 
                     key={m}
                     onClick={() => setMethod(m)}
                     className={`py-2 rounded-lg text-xs border transition-all ${
                       method === m 
                         ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                         : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'
                     }`}
                   >
                     {m === 'dispatch' ? '派单处理' : m === 'broadcast' ? '远程喊话' : '误报忽略'}
                   </button>
                 ))}
              </div>
           </div>

           {method === 'dispatch' && (
             <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">指派人员</label>
                <select className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                   <option>自动分配 (推荐)</option>
                   <option>张三 (保安队长) - 空闲</option>
                   <option>李四 (巡逻员) - 距离100m</option>
                </select>
             </div>
           )}

           <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">处置备注</label>
              <textarea 
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="请输入详细的处理说明..."
                className="w-full h-24 bg-slate-800 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500/50 focus:outline-none resize-none"
              ></textarea>
           </div>

           <div className="flex items-center gap-2">
              <button className="flex-1 py-2 border border-dashed border-white/20 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-xs flex items-center justify-center gap-2">
                 <Upload size={14} /> 上传附件
              </button>
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">取消</button>
           <button 
             onClick={() => { onSubmit({ method, remark }); onClose(); }}
             className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2"
           >
             <CheckCircle size={16} /> 提交工单
           </button>
        </div>
      </motion.div>
    </div>
  );
};

