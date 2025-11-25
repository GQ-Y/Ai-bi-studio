import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// 轮巡配置接口
export interface PatrolConfig {
  isPatrolling: boolean;
  interval: number; // 分钟
  selectedCameras: string[];
  gridSize: 4 | 9;
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

  // 监控轮巡配置
  patrolConfig: PatrolConfig;
  setPatrolConfig: (config: Partial<PatrolConfig>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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

      // 默认轮巡配置
      patrolConfig: {
        isPatrolling: false,
        interval: 5,
        selectedCameras: [],
        gridSize: 4,
      },
      setPatrolConfig: (config) => set((state) => ({
        patrolConfig: { ...state.patrolConfig, ...config }
      })),
    }),
    {
      name: 'bi-agent-storage', // 本地存储的 key
      // 选择需要持久化的字段
      partialize: (state) => ({
        currentView: state.currentView,
        isNavOpen: state.isNavOpen,
        navPosition: state.navPosition,
        centerMode: state.centerMode,
        patrolConfig: state.patrolConfig,
      }),
    }
  )
);
