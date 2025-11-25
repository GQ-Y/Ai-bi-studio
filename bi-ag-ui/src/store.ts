import { create } from 'zustand';

export type CenterMode = 'video-grid' | 'ai-chat' | 'map';
export type NavPosition = 'left' | 'top';
export type PageView = 'dashboard' | 'monitor' | 'alert' | 'patrol' | 'broadcast';

export interface AlertNotification {
  id: string;
  title: string;
  image: string;
  source: string;
  time: string;
  level: 'high' | 'medium' | 'low';
}

interface AppState {
  // 页面导航状态
  currentView: PageView;
  setCurrentView: (view: PageView) => void;

  // 侧边栏状态
  isNavOpen: boolean;
  navPosition: NavPosition;
  toggleNav: () => void;
  setNavPosition: (pos: NavPosition) => void;

  // 中间区域模式 (仅用于 Dashboard)
  centerMode: CenterMode;
  setCenterMode: (mode: CenterMode) => void;

  // 全局快捷键监听状态
  isCmdKPressed: boolean;

  // 紧急模式
  isEmergency: boolean;
  setEmergency: (active: boolean) => void;

  // 全局预警通知
  alertNotification: AlertNotification | null;
  setAlertNotification: (alert: AlertNotification | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard', // 默认为综合大屏
  setCurrentView: (view) => set({ currentView: view }),

  isNavOpen: false,
  navPosition: 'left', 
  toggleNav: () => set((state) => ({ isNavOpen: !state.isNavOpen })),
  setNavPosition: (pos) => set({ navPosition: pos }),

  centerMode: 'video-grid',
  setCenterMode: (mode) => set({ centerMode: mode }),

  isCmdKPressed: false,

  isEmergency: false,
  setEmergency: (active) => set({ isEmergency: active }),

  alertNotification: null,
  setAlertNotification: (alert) => set({ alertNotification: alert }),
}));
