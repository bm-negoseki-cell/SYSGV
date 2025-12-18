export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CheckInRecord {
  id: string;
  timestamp: string;
  checkOutTimestamp?: string;
  location: Coordinates;
  postName: string;
  shift?: 'MANHA' | 'TARDE';
  userName?: string; // Added for supervisor to know who is there
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
  drowningGrade?: 1 | 2 | 3 | 4 | 5 | 6;
  victim?: VictimData;
  notes?: string;
}

export interface TideEvent {
  time: string;
  height: string;
  type: 'Alta' | 'Baixa';
}

export interface WeatherInfo {
  temperature: string;
  condition: string;
  tide: string;
  tideEvents?: TideEvent[];
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
  SUPERVISOR = 'SUPERVISOR'
}