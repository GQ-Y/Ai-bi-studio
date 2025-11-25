export interface CameraPoint {
  id: string;
  label: string;
  status: 'normal' | 'warning' | 'offline';
  floor: 'Ground' | 'B1' | 'B2';
  position: [number, number, number]; // [x, y, z] relative to the floor center
}

export interface StationModelProps {
  exploded: boolean; 
  activeFloor: 'Ground' | 'B1' | 'B2' | 'All'; // Added this prop
  cameras: CameraPoint[];
  onCameraClick: (camera: CameraPoint) => void;
}
