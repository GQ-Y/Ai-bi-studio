import { create } from 'zustand';

export type CenterMode = 'video-grid' | 'ai-chat' | 'map';
export type NavPosition = 'left' | 'top';

interface AppState {
  // 侧边栏状态
  isNavOpen: boolean;
  navPosition: NavPosition;
  toggleNav: () => void;
  setNavPosition: (pos: NavPosition) => void;

  // 中间区域模式
  centerMode: CenterMode;
  setCenterMode: (mode: CenterMode) => void;

  // 全局快捷键监听状态
  isCmdKPressed: boolean;
}

export const useAppStore = create<AppState>((set) => ({
  isNavOpen: false, // 默认隐藏
  navPosition: 'left', // 默认左侧
  toggleNav: () => set((state) => ({ isNavOpen: !state.isNavOpen })),
  setNavPosition: (pos) => set({ navPosition: pos }),

  centerMode: 'video-grid', // 默认 4宫格视频
  setCenterMode: (mode) => set({ centerMode: mode }),

  isCmdKPressed: false,
}));

