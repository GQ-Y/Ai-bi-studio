import React from 'react';
import { Html } from '@react-three/drei';
import type { CameraPoint } from './types';
import { Video, AlertTriangle, WifiOff } from 'lucide-react';

interface CameraMarkerProps {
  data: CameraPoint;
  onClick: (camera: CameraPoint) => void;
}

export const CameraMarker: React.FC<CameraMarkerProps> = ({ data, onClick }) => {
  const getIcon = () => {
    switch (data.status) {
      case 'warning': return <AlertTriangle size={16} className="text-orange-500" />;
      case 'offline': return <WifiOff size={16} className="text-gray-400" />;
      default: return <Video size={16} className="text-blue-400" />;
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'warning': return 'border-orange-500 bg-orange-900/80 text-orange-100';
      case 'offline': return 'border-gray-500 bg-gray-900/80 text-gray-300';
      default: return 'border-cyan-500 bg-cyan-900/80 text-cyan-100';
    }
  };

  return (
    <group position={data.position}>
      {/* Visual Marker in 3D space (a small sphere/box base) */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.05, 1, 8]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial 
          color={data.status === 'warning' ? 'orange' : data.status === 'offline' ? 'gray' : '#00ffff'} 
          emissive={data.status === 'warning' ? 'orange' : '#00ffff'}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* UI Overlay */}
      <Html position={[0, 2, 0]} center distanceFactor={15} occlude>
        <div 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm shadow-lg cursor-pointer transition-transform hover:scale-110 select-none whitespace-nowrap ${getStatusColor()}`}
          onClick={(e) => {
            e.stopPropagation();
            onClick(data);
          }}
        >
          {getIcon()}
          <span className="text-xs font-medium">{data.label}</span>
        </div>
      </Html>
    </group>
  );
};

