export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CheckInRecord {
  id: string;
  timestamp: string;
  checkOutTimestamp?: string; // New field for shift end
  location: Coordinates;
  postName: string; // e.g., "Posto Matinhos 01"
  shift?: 'MANHA' | 'TARDE'; // Shift definition
}

export interface VictimData {
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Outro';
  condition: string;
}

export interface IncidentReport {
  id: string;
  checkInId: string;
  timestamp: string;
  type: 'ORIENTACAO' | 'ADVERTENCIA' | 'AGUA_VIVA' | 'RESGATE' | 'AFOGAMENTO';
  count: number;
  drowningGrade?: 1 | 2 | 3 | 4 | 5 | 6; // Only for AFOGAMENTO
  victim?: VictimData; // Only for serious incidents
  notes?: string;
}

export interface TideEvent {
  time: string;
  height: string;
  type: 'Alta' | 'Baixa';
}

export interface WeatherInfo {
  temperature: string;
  condition: string; // e.g., "Ensolarado"
  tide: string; // Summary string
  tideEvents?: TideEvent[]; // Detailed table
  waveHeight: string;
  sunset?: string;
  uvIndex?: string;
  lastUpdated: string;
  sources: { title: string; uri: string }[];
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  FORM = 'FORM',
  HISTORY = 'HISTORY',
}