
export type FleetType = 'VEHICLE' | 'EQUIPMENT';
export type FleetStatus = 'ACTIVE' | 'WORKSHOP' | 'OUT_OF_SERVICE' | 'STANDBY';
export type MaintenanceType = 'SERVICE' | 'REPAIR' | 'INSPECTION';
export type UserRole = 'manager' | 'staff';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
}

export interface UserDocument {
  id: string;
  name: string;
  email: string; // Added email
  role: UserRole;
  createdAt: string;
}

export interface FleetItem {
  id: string;
  type: FleetType;
  make: string;
  model: string;
  year: number;
  plateOrSerial: string;
  currentMeter: number; // KM for vehicles, Hours for equipment
  status: FleetStatus;
  category: string;
  location: string;
  assignedTo?: string;
  technicalDetails?: {
    engineType?: string;
    vin?: string;
    tireSize?: string;
    fuelType?: string;
  };
  // Cache fields for Dashboard performance
  lastServiceDate?: string;
  nextServiceDate?: string;
  nextServiceMeter?: number;
  
  // Status Tracking
  currentStatusSessionId?: string; // ID of the open status record (e.g. current workshop visit)
}

export interface MaintenanceRecord {
  id: string;
  fleetItemId: string;
  date: string;
  meterReading: number;
  type: MaintenanceType;
  description: string; // Used as "Job Done" for repairs
  complaint?: string;  // New field for the reported issue
  parts: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  nextDueMeter?: number;
  nextDueDate?: string;
  technician?: string; // The mechanic who did the work
  createdBy?: string;  // The system user who entered the data
  attachments?: string[]; 
  maintenanceItems?: string[]; // Array of selected checklist items
}

export interface StatusHistoryRecord {
  id: string;
  fleetItemId: string;
  status: FleetStatus;
  startTime: string; // ISO string
  endTime?: string; // ISO string (null if currently active)
  durationHours?: number; 
  notes?: string;
}

export interface Settings {
  categories: string[];
  locations: string[];
  jobTypes: string[];
  accessPin: string;
}

export interface AISuggestion {
  diagnosis: string;
  estimatedHours: number;
  recommendedParts: string[];
}
