import React, { useState, useEffect, useRef } from 'react';
import { CheckInRecord, WeatherInfo, Coordinates } from '../types';
import { fetchCoastalConditions } from '../services/geminiService';
import * as L from 'leaflet';

interface DashboardProps {
  currentCheckIn: CheckInRecord | null;
  onCheckIn: (coords: Coordinates, postName: string) => void;
  onCheckOut: () => void;
}

// Structured Post Data with Coordinates (Simulated for Paraná Coast)
const POSTS_DATA = [
  { name: "PGV Trapiche", lat: -25.568, lng: -48.345 },
  { name: "PGV Pontal I", lat: -25.575, lng: -48.355 },
  { name: "PGV Pontal II", lat: -25.582, lng: -48.365 },
  { name: "PGV Assenodi", lat: -25.590, lng: -48.375 },
  { name: "PGV Atami Sul", lat: -25.605, lng: -48.390 },
  { name: "PGV Barrancos", lat: -25.615, lng: -48.405 },
  { name: "PGV Shangri-lá I", lat: -25.625, lng: -48.420 },
  { name: "PGV Ipanema I", lat: -25.645, lng: -48.440 },
  { name: "PGV Guarapari", lat: -25.660, lng: -48.460 },
  { name: "PGV Praia de Leste", lat: -25.680, lng: -48.480 },
  { name: "PGV Matinhos Central", lat: -25.818, lng: -48.535 },
  { name: "PGV Caiobá", lat: -25.835, lng: -48.545 },
  { name: "PGV Mansa", lat: -25.845, lng: -48.550 },
  { name: "PGV Guaratuba Central", lat: -25.885, lng: -48.575 },
  { name: "PGV Brejatuba", lat: -25.900, lng: -48.585 }
];

const WEATHER_CACHE_KEY = 'gv_weather_cache';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 Hour

export const Dashboard: React.FC<DashboardProps> = ({ currentCheckIn, onCheckIn, onCheckOut }) => {
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for Post Selection Modal
  const [isSelectingPost, setIsSelectingPost] = useState(false);
  const [tempCoords, setTempCoords] = useState<Coordinates | null>(null);
  const [selectedPost, setSelectedPost] = useState<string>("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Auto fetch weather if checked in or coords available
  useEffect(() => {
    if (currentCheckIn && !weather) {
      loadWeather(currentCheckIn.location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCheckIn]);

  // Initialize Map when modal opens
  useEffect(() => {
    if (isSelectingPost && mapContainerRef.current && !mapInstanceRef.current) {
      // Default center (Praia de Leste approx)
      const initialCenter: [number, number] = tempCoords 
        ? [tempCoords.latitude, tempCoords.longitude] 
        : [-25.680, -48.480];

      const map = L.map(mapContainerRef.current).setView(initialCenter, 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Custom Icon for Posts
      const postIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #1e3a8a; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // Custom Icon for User Location
      if (tempCoords) {
        const userIcon = L.divIcon({
          className: 'user-pos-icon',
          html: `<div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        L.marker([tempCoords.latitude, tempCoords.longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup("Sua Localização")
          .openPopup();
      }

      // Add Markers for all posts
      POSTS_DATA.forEach(post => {
        const marker = L.marker([post.lat, post.lng], { icon: postIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedPost(post.name);
          map.setView([post.lat, post.lng], 13);
        });
        marker.bindPopup(`<b>${post.name}</b>`);
      });

      mapInstanceRef.current = map;
    }

    // Cleanup map on unmount/close
    return () => {
      if (!isSelectingPost && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isSelectingPost, tempCoords]);

  // Sync selectedPost with Map popup if selected via list
  useEffect(() => {
    if (isSelectingPost && mapInstanceRef.current && selectedPost) {
      const post = POSTS_DATA.find(p => p.name === selectedPost);
      if (post) {
         // Optionally pan to selected post
         // mapInstanceRef.current.setView([post.lat, post.lng], 13);
      }
    }
  }, [selectedPost, isSelectingPost]);


  const loadWeather = async (coords: Coordinates, forceRefresh = false) => {
    // 1. Check Cache first (unless forced)
    if (!forceRefresh) {
      const cachedStr = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr);
          const now = Date.now();
          // Check if cache is valid (less than 1 hour old)
          if (now - cached.timestamp < CACHE_DURATION_MS) {
            setWeather(cached.data);
            return; // Exit, do not fetch API
          }
        } catch (e) {
          console.error("Error parsing weather cache", e);
          localStorage.removeItem(WEATHER_CACHE_KEY);
        }
      }
    }

    // 2. Fetch from API if no cache or forced
    setLoadingWeather(true);
    try {
      const data = await fetchCoastalConditions(coords);
      setWeather(data);
      
      // Save to cache
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: data
      }));

    } catch (e) {
      console.error(e);
      // Fallback for demo if API key missing or error
      const fallbackData: WeatherInfo = {
        temperature: "26°C",
        condition: "Parcialmente Nublado",
        tide: "Baixa: 10:30 (0.4m)",
        tideEvents: [
          { time: "04:15", height: "1.6m", type: "Alta" },
          { time: "10:30", height: "0.4m", type: "Baixa" },
          { time: "16:45", height: "1.5m", type: "Alta" },
          { time: "22:10", height: "0.5m", type: "Baixa" }
        ],
        waveHeight: "0.5m - 1.0m",
        lastUpdated: new Date().toLocaleTimeString(),
        sources: []
      };
      setWeather(fallbackData);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleCheckInClick = () => {
    setLoadingLoc(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada neste dispositivo.");
      setLoadingLoc(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        // Store coords temporarily and open selection modal
        setTempCoords(coords);
        setLoadingLoc(false);
        setIsSelectingPost(true);
      },
      (err) => {
        setError("Erro ao obter localização. Verifique as permissões.");
        setLoadingLoc(false);
      }
    );
  };

  const confirmPostSelection = () => {
    if (tempCoords && selectedPost) {
      onCheckIn(tempCoords, selectedPost);
      // Try to load weather immediately after check-in
      loadWeather(tempCoords);
      // Reset selection states
      setIsSelectingPost(false);
      setTempCoords(null);
      setSelectedPost("");
      // Ensure map is cleaned
      if(mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    }
  };

  const cancelSelection = () => {
    setIsSelectingPost(false);
    setTempCoords(null);
    setSelectedPost("");
    if(mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  };

  const handleInitialCheckOutClick = () => {
    const now = new Date();
    if (now.getHours() < 19) {
      setShowCheckoutModal(true);
    } else {
      onCheckOut();
    }
  };

  return (
    <div className="space-y-6">
      {/* Checkout Confirmation Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in duration-200">
             <div className="text-center mb-4">
               <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                 </svg>
               </div>
               <h3 className="text-lg font-bold text-gray-900">Encerrar Turno Antecipadamente?</h3>
               <p className="text-sm text-gray-500 mt-2">Ainda não são 19:00. Deseja realmente finalizar o serviço neste posto?</p>
             </div>
             <div className="flex gap-3">
               <button 
                 onClick={() => setShowCheckoutModal(false)}
                 className="flex-1 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold"
               >
                 Cancelar
               </button>
               <button 
                 onClick={() => {
                   setShowCheckoutModal(false);
                   onCheckOut();
                 }}
                 className="flex-1 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
               >
                 Sim, Finalizar
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Post Selection Modal */}
      {isSelectingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-military-900">Selecione seu Posto</h3>
                <p className="text-xs text-gray-500">Escolha no mapa ou na lista.</p>
              </div>
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                {selectedPost ? selectedPost : "Nenhum selecionado"}
              </div>
            </div>
            
            {/* Map Container */}
            <div className="h-64 bg-gray-100 relative w-full shrink-0 border-b border-gray-200">
               <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
            </div>

            {/* List Container */}
            <div className="p-2 overflow-y-auto flex-1 bg-gray-50">
              <div className="space-y-1">
                {POSTS_DATA.map((post) => (
                  <button
                    key={post.name}
                    onClick={() => setSelectedPost(post.name)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex justify-between items-center ${
                      selectedPost === post.name 
                        ? 'bg-military-900 text-white shadow-md transform scale-[1.02]' 
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-100'
                    }`}
                  >
                    <span>{post.name}</span>
                    {selectedPost === post.name && (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                       </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl flex gap-3">
              <button 
                onClick={cancelSelection}
                className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmPostSelection}
                disabled={!selectedPost}
                className={`flex-1 py-3 font-bold text-white rounded-lg shadow-md transition-all ${
                  selectedPost 
                    ? 'bg-military-900 hover:bg-military-800 active:scale-95' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Card */}
      <div className={`rounded-xl p-6 shadow-sm border ${currentCheckIn ? 'bg-white border-green-500' : 'bg-white border-gray-200'}`}>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Status do Serviço</h2>
        
        {currentCheckIn ? (
          <div>
            <div className="flex items-center gap-2 mb-4 text-green-700 bg-green-50 p-3 rounded-lg">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="font-semibold">EM SERVIÇO</span>
            </div>
            <p className="text-sm text-gray-600"><strong>Posto:</strong> {currentCheckIn.postName}</p>
            <p className="text-sm text-gray-600"><strong>Início:</strong> {new Date(currentCheckIn.timestamp).toLocaleString()}</p>
            
            <button 
              type="button"
              onClick={handleInitialCheckOutClick}
              className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow transition-colors"
            >
              Finalizar Turno
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">Você não está logado em um posto.</p>
            {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
            <button 
              type="button"
              onClick={handleCheckInClick}
              disabled={loadingLoc}
              className="w-full py-3 bg-military-900 hover:bg-military-800 text-white font-bold text-lg rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              {loadingLoc ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Localizando...
                </>
              ) : (
                "REALIZAR CHECK-IN"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Weather & Tide Card */}
      {currentCheckIn && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Condições Ambientais
            </h3>
            <button 
              type="button"
              onClick={() => loadWeather(currentCheckIn.location, true)} 
              className="text-blue-600 hover:text-blue-800"
              title="Atualizar agora"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loadingWeather ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="p-4">
            {loadingWeather ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ) : weather ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Temperatura</p>
                  <p className="text-2xl font-bold text-gray-800">{weather.temperature}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Ondas</p>
                  <p className="text-lg font-semibold text-gray-800">{weather.waveHeight}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Condição</p>
                  <p className="text-md text-gray-800 font-medium">{weather.condition}</p>
                </div>
                
                {/* Tide Section */}
                <div className="col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-600 uppercase tracking-wide font-bold mb-2">Tábua de Marés (Hoje)</p>
                  
                  {weather.tideEvents && weather.tideEvents.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {weather.tideEvents.map((event, idx) => (
                        <div key={idx} className="bg-white p-2 rounded shadow-sm border border-blue-100 flex flex-col items-center">
                          <span className={`text-xs font-bold ${event.type === 'Alta' ? 'text-blue-600' : 'text-orange-500'}`}>
                            {event.type === 'Alta' ? '▲' : '▼'} {event.type}
                          </span>
                          <span className="text-sm font-bold text-gray-800">{event.time}</span>
                          <span className="text-xs text-gray-500">{event.height}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-blue-900">{weather.tide}</p>
                  )}
                </div>
                
                {weather.sources && weather.sources.length > 0 && (
                  <div className="col-span-2 mt-2 pt-2 border-t border-gray-100">
                     <p className="text-[10px] text-gray-400 mb-1">Fontes:</p>
                     <ul className="text-[10px] text-blue-500 space-y-1">
                       {weather.sources.map((src, i) => (
                         <li key={i}><a href={src.uri} target="_blank" rel="noopener noreferrer" className="hover:underline truncate block">{src.title}</a></li>
                       ))}
                     </ul>
                  </div>
                )}
                
                <div className="col-span-2 mt-1">
                  <p className="text-[10px] text-gray-400 text-right">Atualizado às: {weather.lastUpdated}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Dados não disponíveis.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};