import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { CameraMarker } from './CameraMarker';
import type { StationModelProps } from './types';

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

// --- Sub Component: City Environment ---
const CityContext: React.FC = () => {
  // Generate random surrounding buildings
  const buildings = useMemo(() => {
    const items = [];
    // Create a grid of buildings, excluding the center (station area)
    for(let x = -4; x <= 4; x++) {
      for(let z = -4; z <= 4; z++) {
        // Skip center area
        if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;
        
        // Random height
        const height = Math.random() * 15 + 5;
        const posX = x * 12 + (Math.random() - 0.5) * 4;
        const posZ = z * 12 + (Math.random() - 0.5) * 4;
        
        items.push({ position: [posX, height/2, posZ], size: [8, height, 8] });
      }
    }
    return items;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {buildings.map((b, i) => (
        <mesh key={i} position={b.position as any}>
          <boxGeometry args={b.size as any} />
          <meshStandardMaterial 
            color="#223344" 
            transparent 
            opacity={0.6} 
            roughness={0.1}
          />
          {/* Windows Effect (Simple Lines) */}
          <mesh position={[0, 0, 0]} scale={[1.01, 1, 1.01]}>
             <boxGeometry args={b.size as any} />
             <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.05} />
          </mesh>
        </mesh>
      ))}
      {/* Trees (Low Poly Cones) */}
      {[...Array(30)].map((_, i) => {
         const angle = Math.random() * Math.PI * 2;
         const radius = 25 + Math.random() * 20;
         return (
           <group key={`tree-${i}`} position={[Math.cos(angle)*radius, 0, Math.sin(angle)*radius]}>
              <mesh position={[0, 2, 0]}>
                 <coneGeometry args={[1.5, 4, 8]} />
                 <meshStandardMaterial color="#2d4c3b" />
              </mesh>
              <mesh position={[0, 0.5, 0]}>
                 <cylinderGeometry args={[0.3, 0.3, 1]} />
                 <meshStandardMaterial color="#3e2723" />
              </mesh>
           </group>
         )
      })}
    </group>
  );
};

// --- Sub Component: Train ---
const Train: React.FC<{ direction: 1 | -1; position: [number, number, number]; color: string }> = ({ direction, position, color }) => {
  const trainRef = useRef<Group>(null);
  useFrame((state, delta) => {
    if (trainRef.current) {
      const speed = 12 * direction; 
      trainRef.current.position.x += speed * delta;
      if (direction === 1 && trainRef.current.position.x > 50) trainRef.current.position.x = -50;
      else if (direction === -1 && trainRef.current.position.x < -50) trainRef.current.position.x = 50;
    }
  });
  return (
    <group ref={trainRef} position={position}>
      {[0, 1, 2, 3, 4].map(i => (
        <group key={i} position={[i * -4.2 * direction, 0.8, 0]}>
           <mesh castShadow>
             <boxGeometry args={[4, 1.6, 1.4]} />
             <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
           </mesh>
           <mesh position={[0, 0.2, 0.71]}>
             <planeGeometry args={[3, 0.6]} />
             <meshBasicMaterial color="#000" />
           </mesh>
        </group>
      ))}
    </group>
  )
}

const SafetyDoors: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
       <mesh position={[0, 2, 0]}>
         <boxGeometry args={[38, 0.2, 0.1]} />
         <meshStandardMaterial color="#ccc" />
       </mesh>
       {[...Array(12)].map((_, i) => (
         <group key={i} position={[(i - 5.5) * 3.2, 1, 0]}>
            <mesh position={[-0.8, 0, 0]}>
               <boxGeometry args={[1.4, 2, 0.05]} />
               <meshPhysicalMaterial color="#00ffff" transparent opacity={0.3} side={2} emissive="#00ffff" emissiveIntensity={0.2} />
            </mesh>
             <mesh position={[0.8, 0, 0]}>
               <boxGeometry args={[1.4, 2, 0.05]} />
               <meshPhysicalMaterial color="#00ffff" transparent opacity={0.3} side={2} emissive="#00ffff" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[1.6, 0, 0]}>
               <boxGeometry args={[0.2, 2, 0.1]} />
               <meshStandardMaterial color="#555" />
            </mesh>
         </group>
       ))}
    </group>
  )
}

export const StationModel: React.FC<StationModelProps> = ({ exploded, activeFloor, cameras, onCameraClick }) => {
  const groundRef = useRef<Group>(null);
  const b1GroupRef = useRef<Group>(null);
  const b2GroupRef = useRef<Group>(null);
  const [hoveredFloor, setHoveredFloor] = useState<'Ground' | 'B1' | 'B2' | null>(null);
  
  useFrame((state, delta) => {
    const speed = delta * 4;
    // Exploded logic
    if (groundRef.current) groundRef.current.position.y = lerp(groundRef.current.position.y, exploded ? 18 : 6, speed);
    if (b1GroupRef.current) b1GroupRef.current.position.y = lerp(b1GroupRef.current.position.y, exploded ? 6 : 0, speed);
    if (b2GroupRef.current) b2GroupRef.current.position.y = lerp(b2GroupRef.current.position.y, -6, speed);
  });

  const getLayerStyle = (floor: 'Ground' | 'B1' | 'B2') => {
    // 1. Navigation Button Focus
    if (activeFloor !== 'All' && activeFloor !== floor) {
      return { opacity: 0.05, emissiveIntensity: 0, visible: false }; // Hide others
    }

    // 2. Hover Focus (only in All + Exploded mode)
    const isHoveringSomething = hoveredFloor !== null;
    const isThisFloor = hoveredFloor === floor;
    
    let opacity = 1;
    let emissiveIntensity = 0;

    if (activeFloor === 'All' && exploded && isHoveringSomething) {
      if (isThisFloor) {
         opacity = 1;
         emissiveIntensity = 0.3;
      } else {
         opacity = 0.2;
         emissiveIntensity = 0;
      }
    }
    // If specific floor active, boost it
    if (activeFloor === floor) {
        emissiveIntensity = 0.2;
    }

    return { opacity, emissiveIntensity, visible: true };
  };

  const handlePointerOver = (e: any, floor: 'Ground' | 'B1' | 'B2') => {
    e.stopPropagation();
    if (exploded) setHoveredFloor(floor);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHoveredFloor(null);
  };

  const groundStyle = getLayerStyle('Ground');
  const b1Style = getLayerStyle('B1');
  const b2Style = getLayerStyle('B2');

  return (
    <group onPointerMissed={() => setHoveredFloor(null)}>
      
      {/* City Context - Only visible on Ground or All */}
      {(activeFloor === 'All' || activeFloor === 'Ground') && (
         <group position={[0, 5, 0]}>
           <CityContext />
         </group>
      )}

      {/* === Ground Level === */}
      <group 
        ref={groundRef} 
        position={[0, 6, 0]}
        visible={groundStyle.visible}
        onPointerOver={(e) => handlePointerOver(e, 'Ground')}
        onPointerOut={handlePointerOut}
      >
         <mesh receiveShadow>
           <boxGeometry args={[50, 0.5, 30]} />
           <meshStandardMaterial color="#445566" transparent opacity={groundStyle.opacity} emissive="#445566" emissiveIntensity={groundStyle.emissiveIntensity} />
         </mesh>
         {/* Crosswalk */}
         <mesh position={[12, 0.26, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[6, 30]} />
             <meshBasicMaterial color="#333" opacity={groundStyle.opacity} transparent />
         </mesh>
          <mesh position={[0, 0.26, 10]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[50, 6]} />
             <meshBasicMaterial color="#333" opacity={groundStyle.opacity} transparent />
         </mesh>
         
         {/* Entrance A */}
         <group position={[-12, 1.5, 5]}>
            <mesh>
               <boxGeometry args={[3, 3, 5]} />
               <meshStandardMaterial color="#8899aa" transparent opacity={groundStyle.opacity} />
            </mesh>
            <mesh position={[0, 2, 0]}>
               <boxGeometry args={[1, 0.5, 2]} />
               <meshBasicMaterial color="#00ff00" />
            </mesh>
         </group>

          {/* Entrance B */}
         <group position={[12, 1.5, -5]}>
            <mesh>
               <boxGeometry args={[3, 3, 5]} />
               <meshStandardMaterial color="#8899aa" transparent opacity={groundStyle.opacity} />
            </mesh>
         </group>

         {cameras.filter(c => c.floor === 'Ground').map(cam => (
          <CameraMarker key={cam.id} data={cam} onClick={onCameraClick} />
        ))}
      </group>

      {/* === B1 Concourse === */}
      <group 
        ref={b1GroupRef} 
        position={[0, 0, 0]}
        visible={b1Style.visible}
        onPointerOver={(e) => handlePointerOver(e, 'B1')}
        onPointerOut={handlePointerOut}
      >
        <mesh receiveShadow>
          <boxGeometry args={[40, 0.5, 20]} />
          <meshPhysicalMaterial 
            color="#2a4c7e" 
            transparent 
            opacity={b1Style.opacity * 0.95} 
            roughness={0.2} 
            emissive="#2a4c7e"
            emissiveIntensity={b1Style.emissiveIntensity + 0.1}
          />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[40.2, 2, 20.2]} />
          <meshStandardMaterial color="#00ffff" transparent opacity={b1Style.opacity * 0.1} wireframe />
        </mesh>
        {/* Gates */}
        <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[3, 3, 0.1, 32]} />
            <meshBasicMaterial color="#0088ff" opacity={b1Style.opacity * 0.4} transparent side={2} />
        </mesh>

        {cameras.filter(c => c.floor === 'B1').map(cam => (
          <CameraMarker key={cam.id} data={cam} onClick={onCameraClick} />
        ))}
      </group>

      {/* === B2 Platform === */}
      <group 
        ref={b2GroupRef} 
        position={[0, -6, 0]}
        visible={b2Style.visible}
        onPointerOver={(e) => handlePointerOver(e, 'B2')}
        onPointerOut={handlePointerOut}
      >
         <mesh receiveShadow>
          <boxGeometry args={[40, 0.5, 10]} />
          <meshPhysicalMaterial color="#334456" roughness={0.2} opacity={b2Style.opacity} transparent emissive="#334456" emissiveIntensity={b2Style.emissiveIntensity} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
           <boxGeometry args={[50, 0.5, 18]} />
           <meshStandardMaterial color="#1a1a1a" opacity={b2Style.opacity} transparent />
        </mesh>

        <group opacity={b2Style.opacity}>
          <SafetyDoors position={[0, 1, 4.8]} />
          <SafetyDoors position={[0, 1, -4.8]} />
          <Train direction={1} position={[-20, -0.5, 7]} color="#eee" />
          <Train direction={-1} position={[20, -0.5, -7]} color="#ccc" />
        </group>

        {cameras.filter(c => c.floor === 'B2').map(cam => (
          <CameraMarker key={cam.id} data={cam} onClick={onCameraClick} />
        ))}
      </group>
    </group>
  );
};
