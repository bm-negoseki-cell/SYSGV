import React, { useState, useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { IncidentReport, CheckInRecord } from '../types';

interface SupervisorDashboardProps {
  onLogout: () => void;
}

const POSTS_DATA = [
  { name: "PGV Trapiche", lat: -25.56519356155389, lng: -48.35321716428566 },
  { name: "PGV Pontal I", lat: -25.57757657078022, lng: -48.34880579635122 },
  { name: "PGV Pontal II", lat: -25.58264151938106, lng: -48.35340143593928 },
  { name: "PGV Assenodi", lat: -25.58958777642791, lng: -48.36733777343531 },
  { name: "PGV Atami Sul", lat: -25.60247263076977, lng: -48.38964690918546 },
  { name: "PGV Barrancos", lat: -25.61901579721866, lng: -48.410556823831215 },
  { name: "PGV AVM", lat: -25.62084425950107, lng: -48.41340062315657 },
  { name: "PGV Shangri-lá I", lat: -25.6240088701395, lng: -48.41588828539593 },
  { name: "PGV Shangri-lá II", lat: -25.6268377187241, lng: -48.41932134094845 },
  { name: "PGV Shangri-lá III", lat: -25.6301186654416, lng: -48.42172244975259 },
  { name: "PGV Carmeri", lat: -25.6344757024554, lng: -48.42593257550901 },
  { name: "PGV Marissol", lat: -25.64044362879902, lng: -48.43015252435411 },
  { name: "PGV Grajaú", lat: -25.64542027295532, lng: -48.43375404310149 },
  { name: "PGV Leblon", lat: -25.64910852400968, lng: -48.43644806182558 },
  { name: "PGV Ipanema I", lat: -25.65255132461099, lng: -48.43837863673453 },
  { name: "PGV Ipanema II", lat: -25.65610262805518, lng: -48.44158736632654 },
  { name: "PGV Ipanema III", lat: -25.65799114421812, lng: -48.44251886360949 },
  { name: "PGV Ipanema IV", lat: -25.661916006032964, lng: -48.444474788166204 },
  { name: "PGV Guarapari", lat: -25.67396444970978, lng: -48.45172210114295 },
  { name: "PGV Primavera", lat: -25.67672270520033, lng: -48.45370791510518 },
  { name: "PGV Sta. Terezinha I", lat: -25.68006697620728, lng: -48.456756380861 },
  { name: "PGV Sta. Terezinha II", lat: -25.68377369680623, lng: -48.4589194663884 },
  { name: "PGV Canoas I", lat: -25.68744885419532, lng: -48.46095254563711 },
  { name: "PGV Canoas II", lat: -25.68951441528883, lng: -48.46318449622606 },
  { name: "PGV Canoas III", lat: -25.69150969060577, lng: -48.46387638686038 },
  { name: "PGV Privê", lat: -25.6935007829624, lng: -48.4653040199155 },
  { name: "PGV Leste I", lat: -25.69634364004095, lng: -48.46674596932468 },
  { name: "PGV Leste II", lat: -25.69875255668344, lng: -48.46867867617856 },
  { name: "PGV Leste III", lat: -25.70030333079169, lng: -48.46911633895276 },
  { name: "PGV Banestado", lat: -25.70434196570441, lng: -48.47180635473367 },
  { name: "PGV Jd. Canadá", lat: -25.70745547575332, lng: -48.47407953093817 },
  { name: "PGV Monções I", lat: -25.71065193937143, lng: -48.47615540790889 },
  { name: "PGV Monções II", lat: -25.71369093689567, lng: -48.47806326893424 }
];

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ onLogout }) => {
  const [activeCheckIns, setActiveCheckIns] = useState<CheckInRecord[]>([]);
  const [allIncidents, setAllIncidents] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const simulateData = () => {
      const localCheckIns = JSON.parse(localStorage.getItem('gv_checkins') || '[]');
      const activeOnes = localCheckIns.filter((c: any) => !c.checkOutTimestamp);
      setActiveCheckIns(activeOnes);
      setAllIncidents(JSON.parse(localStorage.getItem('gv_reports') || '[]'));
      setIsLoading(false);
    };
    simulateData();
  }, []);

  useEffect(() => {
    if (!isLoading && mapContainerRef.current && !mapInstanceRef.current) {
      // Timeout para garantir que o container do mapa tenha dimensões reais após animação
      const timer = setTimeout(() => {
        if (!mapContainerRef.current) return;

        const map = L.map(mapContainerRef.current);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        const markersGroup = L.featureGroup();

        POSTS_DATA.forEach(post => {
          const isActive = activeCheckIns.some(c => c.postName === post.name);
          
          const iconHtml = `
            <div style="
              background-color: ${isActive ? '#22c55e' : '#64748b'}; 
              width: 14px; height: 14px; 
              border-radius: 50%; 
              border: 2px solid white; 
              box-shadow: 0 0 10px ${isActive ? 'rgba(34,197,94,0.6)' : 'rgba(0,0,0,0.2)'};
            "></div>`;

          const icon = L.divIcon({
            className: 'custom-icon',
            html: iconHtml,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });

          const marker = L.marker([post.lat, post.lng], { icon })
            .addTo(map)
            .bindPopup(`
              <div class="text-xs">
                <p class="font-bold">${post.name}</p>
                <p class="text-[10px] ${isActive ? 'text-green-600 font-bold' : 'text-gray-400'}">
                  ${isActive ? 'ATIVO' : 'VAZIO'}
                </p>
              </div>
            `);
          
          marker.addTo(markersGroup);
        });

        // Enquadra todos os postos perfeitamente na tela
        if (markersGroup.getLayers().length > 0) {
          map.invalidateSize();
          map.fitBounds(markersGroup.getBounds(), { padding: [30, 30] });
        } else {
          map.setView([-25.650, -48.440], 11);
        }

        mapInstanceRef.current = map;
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isLoading, activeCheckIns]);

  const stats = {
    totalActive: activeCheckIns.length,
    totalRescues: allIncidents.filter(i => i.type === 'RESGATE' || i.type === 'AFOGAMENTO').length,
    totalPrev: allIncidents.filter(i => i.type === 'ORIENTACAO' || i.type === 'ADVERTENCIA').length
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Painel de Supervisão
          </h2>
          <button 
            onClick={onLogout}
            className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            SAIR
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
            <p className="text-[10px] font-bold text-blue-800 uppercase">GVs Ativos</p>
            <p className="text-2xl font-black text-blue-900">{stats.totalActive}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
            <p className="text-[10px] font-bold text-red-800 uppercase">Resgates</p>
            <p className="text-2xl font-black text-red-600">{stats.totalRescues}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
            <p className="text-[10px] font-bold text-green-800 uppercase">Prevenções</p>
            <p className="text-2xl font-black text-green-700">{stats.totalPrev}</p>
          </div>
        </div>

        <div className="h-72 rounded-lg overflow-hidden border border-gray-200 mb-4 shadow-inner">
          <div ref={mapContainerRef} className="h-full w-full"></div>
        </div>

        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 px-1">Situação dos Postos</h3>
        <div className="space-y-2 overflow-y-auto max-h-60 no-scrollbar pb-2">
          {POSTS_DATA.map(post => {
            const checkIn = activeCheckIns.find(c => c.postName === post.name);
            return (
              <div key={post.name} className={`p-3 rounded-lg border flex justify-between items-center transition-all ${checkIn ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${checkIn ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-gray-400'}`}></div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{post.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{checkIn ? `Em serviço desde ${new Date(checkIn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Posto Vazio'}</p>
                  </div>
                </div>
                {checkIn ? (
                  <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">ATIVO</span>
                ) : (
                  <span className="bg-gray-400 text-white text-[10px] font-bold px-2 py-1 rounded">---</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};