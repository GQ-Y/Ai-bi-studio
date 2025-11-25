import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { StationModel } from './StationModel';
import type { CameraPoint } from './types';
import { Layers, Maximize2, Minimize2, Building2, ArrowDownToLine, TrainFront } from 'lucide-react';

// Updated Camera Data
const INITIAL_CAMERAS: CameraPoint[] = [
  // --- Ground Level ---
  { id: 'g-01', label: 'A出口球机', status: 'normal', floor: 'Ground', position: [-12, 2, 6] },
  { id: 'g-02', label: 'B出口球机', status: 'normal', floor: 'Ground', position: [12, 2, -6] },
  { id: 'g-03', label: '十字路口', status: 'normal', floor: 'Ground', position: [25, 4, 25] },

  // --- B1 Concourse ---
  { id: 'b1-01', label: '东安检', status: 'normal', floor: 'B1', position: [-15, 2, 0] },
  { id: 'b1-02', label: '西安检', status: 'warning', floor: 'B1', position: [15, 2, 0] },
  { id: 'b1-03', label: '东楼梯口', status: 'normal', floor: 'B1', position: [-8, 2, 3] },
  { id: 'b1-04', label: '西楼梯口', status: 'normal', floor: 'B1', position: [8, 2, -3] },
  { id: 'b1-05', label: '客服中心', status: 'offline', floor: 'B1', position: [0, 2, 0] },

  // --- B2 Platform ---
  { id: 'b2-01', label: '上行头端', status: 'normal', floor: 'B2', position: [-18, 2, 3] },
  { id: 'b2-02', label: '上行中部', status: 'normal', floor: 'B2', position: [0, 2, 3] },
  { id: 'b2-03', label: '上行尾端', status: 'normal', floor: 'B2', position: [18, 2, 3] },
  { id: 'b2-04', label: '下行头端', status: 'normal', floor: 'B2', position: [18, 2, -3] },
];

export const StationScene: React.FC = () => {
  const [exploded, setExploded] = useState(false);
  const [activeFloor, setActiveFloor] = useState<'Ground' | 'B1' | 'B2' | 'All'>('All');
  const [selectedCamera, setSelectedCamera] = useState<CameraPoint | null>(null);

  return (
    <div className="relative w-full h-full bg-black/90 overflow-hidden rounded-lg border border-white/10">
      {/* 3D Canvas */}
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[40, 30, 40]} fov={35} />
        
        {/* Lighting Setup */}
        <ambientLight intensity={0.6} />
        <hemisphereLight intensity={0.4} groundColor="#444" skyColor="#fff" />
        <pointLight position={[10, 20, 10]} intensity={1.5} castShadow distance={50} />
        <spotLight position={[-20, 40, -20]} angle={0.4} penumbra={1} intensity={2} color="#00aaff" distance={80} />
        {/* Add warm street lights */}
        <pointLight position={[20, 5, 20]} intensity={1} color="#ffaa00" distance={20} />

        <Suspense fallback={null}>
          <StationModel 
            exploded={exploded} 
            activeFloor={activeFloor}
            cameras={INITIAL_CAMERAS}
            onCameraClick={setSelectedCamera}
          />
          <Environment preset="city" />
        </Suspense>

        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2.1} 
          autoRotate={!selectedCamera} 
          autoRotateSpeed={0.3}
        />
      </Canvas>

      {/* Floor Navigation (Left Side) */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-3">
        {[
           { id: 'Ground', label: '地面入口', icon: Building2 },
           { id: 'B1', label: 'B1 站厅', icon: ArrowDownToLine },
           { id: 'B2', label: 'B2 站台', icon: TrainFront },
           { id: 'All', label: '全景展示', icon: Layers },
        ].map((item) => (
          <button
             key={item.id}
             onClick={() => setActiveFloor(item.id as any)}
             className={`flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-md transition-all w-40 border ${
               activeFloor === item.id 
                 ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                 : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
             }`}
          >
             <item.icon size={18} className={activeFloor === item.id ? 'text-cyan-300' : ''} />
             <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Controls (Right Top) */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setExploded(!exploded)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md border backdrop-blur-md transition-all ${
            exploded 
              ? 'bg-purple-500/20 border-purple-500 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
              : 'bg-black/40 border-white/20 text-gray-300 hover:bg-white/10'
          }`}
        >
          <Layers size={18} />
          <span>{exploded ? '合并视口' : '分层展开'}</span>
        </button>
      </div>

      {/* Camera Details */}
      {selectedCamera && (
        <div className="absolute bottom-4 right-4 w-72 bg-slate-950/90 border border-cyan-500/50 p-4 rounded-lg backdrop-blur-md animate-in slide-in-from-bottom-4 z-50 shadow-2xl">
          <div className="flex justify-between items-start mb-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <h3 className="text-cyan-400 font-bold">{selectedCamera.label}</h3>
            </div>
            <button onClick={() => setSelectedCamera(null)} className="text-gray-400 hover:text-white">
              <Minimize2 size={16} />
            </button>
          </div>
          
          <div className="relative aspect-video bg-black rounded border border-white/10 overflow-hidden mb-3 group cursor-pointer">
             {/* Fake Camera Feed Animation */}
             <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:200%_200%] animate-[gradient_3s_linear_infinite]"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-gray-500 font-mono">LIVE FEED CONNECTING...</span>
             </div>
             <div className="absolute bottom-1 left-2 text-[10px] text-green-500 font-mono">REC ●</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
            <div className="bg-white/5 p-2 rounded">
               <span className="text-gray-500 block">设备ID</span>
               {selectedCamera.id}
            </div>
             <div className="bg-white/5 p-2 rounded">
               <span className="text-gray-500 block">位置</span>
               {selectedCamera.floor}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
