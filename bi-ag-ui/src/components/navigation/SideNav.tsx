import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Cctv, Activity, Megaphone, LayoutDashboard, Settings, ArrowLeftToLine, ArrowUpToLine } from 'lucide-react';
import { useAppStore } from '../../store';
import { twMerge } from 'tailwind-merge';

const menuItems = [
  { id: 'monitor', label: '监控中心', icon: Cctv, color: 'text-cyber-primary' },
  { id: 'alert', label: '预警中心', icon: ShieldAlert, color: 'text-cyber-accent' },
  { id: 'patrol', label: '巡查治理', icon: Activity, color: 'text-cyber-secondary' },
  { id: 'broadcast', label: '广播喊话', icon: Megaphone, color: 'text-white' },
];

export const SideNav: React.FC = () => {
  const { isNavOpen, navPosition, setNavPosition } = useAppStore();

  const variants = {
    left: {
      open: { x: 0, width: 260, opacity: 1 },
      closed: { x: -260, width: 0, opacity: 0 },
    },
    top: {
      open: { y: 0, height: 90, opacity: 1 },
      closed: { y: -90, height: 0, opacity: 0 },
    }
  };

  const isLeft = navPosition === 'left';

  return (
    <motion.div
      initial={false}
      animate={isNavOpen ? 'open' : 'closed'}
      variants={isLeft ? variants.left : variants.top}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className={twMerge(
        "fixed z-[100] bg-cyber-bg/90 backdrop-blur-xl border-cyber-primary/30 flex shadow-[0_0_50px_rgba(0,0,0,0.8)]",
        isLeft ? "left-0 top-0 bottom-0 border-r flex-col" : "top-0 left-0 right-0 border-b items-center px-8"
      )}
    >
      {/* 装饰背景 */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none"></div>

      {/* Logo Area */}
      <div className={twMerge("flex items-center gap-3 text-white p-8 relative", !isLeft && "p-0 mr-12")}>
        <div className="w-10 h-10 bg-cyber-primary text-black flex items-center justify-center rounded clip-tech-corner font-black text-xl">AG</div>
        <div className="flex flex-col">
           <span className="font-bold text-lg tracking-widest">CONTROL</span>
           <span className="text-[10px] text-cyber-primary tracking-[0.3em]">PANEL</span>
        </div>
      </div>

      {/* Menu Items */}
      <div className={twMerge("flex gap-4", isLeft ? "flex-col px-6 w-full mt-4" : "flex-row items-center flex-1")}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={twMerge(
              "relative flex items-center gap-4 p-4 transition-all group overflow-hidden bg-white/5 border border-white/10 hover:border-cyber-primary/50",
              "clip-tech-corner hover:bg-cyber-primary/10"
            )}
          >
            <item.icon size={24} className={`${item.color} drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]`} />
            <span className="font-bold text-white tracking-wider group-hover:translate-x-1 transition-transform">{item.label}</span>
            
            {/* Active Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyber-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom"></div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className={twMerge("p-6 mt-auto w-full flex justify-between border-t border-white/10", !isLeft && "mt-0 border-t-0 border-l ml-auto w-auto pl-8")}>
         <button 
           onClick={() => setNavPosition(isLeft ? 'top' : 'left')}
           className="p-2 text-cyber-primary hover:bg-cyber-primary/20 rounded transition-colors"
         >
           {isLeft ? <ArrowUpToLine size={20} /> : <ArrowLeftToLine size={20} />}
         </button>
         <button className="p-2 text-white/50 hover:text-white transition-colors">
           <Settings size={20} />
         </button>
      </div>
    </motion.div>
  );
};
