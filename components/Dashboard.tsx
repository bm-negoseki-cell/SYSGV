import React, { useState, useEffect, useRef } from 'react';
import { CheckInRecord, WeatherInfo, Coordinates, TideEvent } from '../types';
import { fetchCoastalConditions } from '../services/geminiService';
import * as L from 'leaflet';

interface DashboardProps {
  currentCheckIn: CheckInRecord | null;
  onCheckIn: (coords: Coordinates, postName: string) => void;
  onCheckOut: () => void;
}

// Structured Post Data with Exact Coordinates provided by user
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

const WEATHER_CACHE_KEY = 'gv_weather_cache';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 Hour
// Update interval: 2 Hours (as requested)
const UPDATE_INTERVAL_MS = 2 * 60 * 60 * 1000; 
const MAX_DISTANCE_METERS = 250; // Radius for allowed check-in (Visual only now)

// Haversine formula to calculate distance between two points in meters
const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

export const Dashboard: React.FC<DashboardProps> = ({ currentCheckIn, onCheckIn, onCheckOut }) => {
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for Post Selection Modal
  const [isSelectingPost, setIsSelectingPost] = useState(false);
  const [tempCoords, setTempCoords] = useState<Coordinates | null>(null);
  const [selectedPost, setSelectedPost] = useState<string>("");
  const [selectionError, setSelectionError] = useState<string | null>(null); // New state for modal errors
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutWarningMsg, setCheckoutWarningMsg] = useState("");
  
  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Logic: Update weather on Check-In and then every 2 hours
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (currentCheckIn) {
      // 1. Initial Load (immediate if no data)
      if (!weather) {
        loadWeather(currentCheckIn.location);
      }

      // 2. Set interval to refresh every 2 hours
      intervalId = setInterval(() => {
        console.log("Auto-refreshing weather data (2 hour interval)...");
        loadWeather(currentCheckIn.location, true); // Force refresh ignores cache
      }, UPDATE_INTERVAL_MS);
    }

    // Cleanup: Clear interval when component unmounts OR when currentCheckIn changes (e.g., checkout)
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCheckIn]);

  // Initialize Map when modal opens
  useEffect(() => {
    if (isSelectingPost && mapContainerRef.current && !mapInstanceRef.current) {
      
      // FIX: Add delay to allow modal animation to finish before calculating map size/bounds
      // Increased to 500ms to be absolutely sure container has final dimensions
      const initTimer = setTimeout(() => {
        if (!mapContainerRef.current) return;

        const map = L.map(mapContainerRef.current);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Custom Icon for Posts - Standard Blue
        const postIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #2563eb; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        // Custom Icon for User Location - Red
        if (tempCoords) {
          const userIcon = L.divIcon({
            className: 'user-pos-icon',
            html: `<div style="background-color: #dc2626; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          L.marker([tempCoords.latitude, tempCoords.longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup("Sua Localização")
            .openPopup();
          
          // Draw a circle indicating the allowed area
          L.circle([tempCoords.latitude, tempCoords.longitude], {
            color: 'green',
            fillColor: '#22c55e',
            fillOpacity: 0.1,
            radius: MAX_DISTANCE_METERS
          }).addTo(map);
        }

        // Create Markers and Calculate Bounds
        const markersGroup = L.featureGroup();
        
        if (tempCoords) {
           L.marker([tempCoords.latitude, tempCoords.longitude]).addTo(markersGroup);
        }

        // Add Markers for all posts
        POSTS_DATA.forEach(post => {
          const marker = L.marker([post.lat, post.lng], { icon: postIcon }).addTo(map);
          marker.addTo(markersGroup); // Add to group for bounds calculation
          marker.on('click', () => {
            setSelectedPost(post.name);
            setSelectionError(null); // Clear error on new selection
            map.setView([post.lat, post.lng], 13);
          });
          marker.bindPopup(`<b>${post.name}</b>`);
        });

        // Fit map to show all markers (User + All Posts)
        // This ensures PGV Primavera and all others are visible
        if (markersGroup.getLayers().length > 0) {
          // IMPORTANT FIX: Invalidate size BEFORE fitting bounds. 
          // This tells Leaflet the container size has changed (animation finished)
          map.invalidateSize();
          map.fitBounds(markersGroup.getBounds(), { padding: [50, 50] });
        } else {
          // Fallback center if something goes wrong
          map.invalidateSize();
          map.setView([-25.650, -48.440], 11);
        }

        mapInstanceRef.current = map;
      }, 500); // 500ms delay matches typical modal transition + safety buffer

      // Cleanup map on unmount/close
      return () => {
        clearTimeout(initTimer);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, [isSelectingPost, tempCoords]);

  // Sync selectedPost with Map popup if selected via list
  useEffect(() => {
    if (isSelectingPost) {
      // Clear error when changing selection via list
      setSelectionError(null);
    }
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
        sunset: "18:30",
        uvIndex: "5 - Moderado",
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
        setSelectionError(null);
      },
      (err) => {
        setError("Erro ao obter localização. Verifique as permissões.");
        setLoadingLoc(false);
      }
    );
  };

  const confirmPostSelection = () => {
    if (tempCoords && selectedPost) {
      // GEOFENCING CHECK
      const targetPost = POSTS_DATA.find(p => p.name === selectedPost);
      if (!targetPost) return;

      const distance = getDistanceFromLatLonInMeters(
        tempCoords.latitude, 
        tempCoords.longitude, 
        targetPost.lat, 
        targetPost.lng
      );

      // DISABLED FOR TESTING - UNCOMMENT TO RE-ENABLE GEOFENCING
      /*
      if (distance > MAX_DISTANCE_METERS) {
        setSelectionError(`Você está a ${Math.round(distance)} metros deste posto. O limite para check-in é de ${MAX_DISTANCE_METERS} metros.`);
        return;
      }
      */
      console.log(`[TESTING] Distance to post: ${Math.round(distance)}m. Allowed.`);

      onCheckIn(tempCoords, selectedPost);
      // Try to load weather immediately after check-in
      loadWeather(tempCoords);
      // Reset selection states
      setIsSelectingPost(false);
      setTempCoords(null);
      setSelectedPost("");
      setSelectionError(null);
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
    setSelectionError(null);
    if(mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  };

  const handleInitialCheckOutClick = () => {
    if (!currentCheckIn) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    let isEarly = false;
    let requiredTimeMsg = "";

    // Determine Logic based on Shift
    if (currentCheckIn.shift === 'MANHA') {
        // Manhã: Ends at 13:30. Warning before 13:30.
        if (currentHour < 13 || (currentHour === 13 && currentMin < 30)) {
            isEarly = true;
            requiredTimeMsg = "13:30";
        }
    } else {
        // Tarde (Default): Ends at 19:00. Warning before 19:00.
        if (currentHour < 19) {
            isEarly = true;
            requiredTimeMsg = "19:00";
        }
    }

    if (isEarly) {
      setCheckoutWarningMsg(`Ainda não são ${requiredTimeMsg}.`);
      setShowCheckoutModal(true);
    } else {
      onCheckOut();
    }
  };

  // Helper to filter tide events for display
  // Expanded range to ensure user sees tides before shift start and after shift end (06:00 - 21:00)
  const getShiftTideEvents = (events: TideEvent[] | undefined) => {
    if (!events) return [];
    return events.filter(e => {
      // Assuming e.time is "HH:MM"
      return e.time >= "06:00" && e.time <= "21:00";
    });
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
               <p className="text-sm text-gray-500 mt-2">{checkoutWarningMsg} Deseja realmente finalizar o serviço neste posto?</p>
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
                <h3 className="text-lg font-bold text-blue-900">Selecione seu Posto</h3>
                <p className="text-xs text-gray-500">Escolha no mapa ou na lista.</p>
              </div>
              <div className="text-xs text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-100">
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
                        ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' 
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

            <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl flex flex-col gap-3">
              {selectionError && (
                <div className="bg-red-50 text-red-700 p-2 rounded text-xs font-bold border border-red-200 text-center animate-pulse">
                  {selectionError}
                </div>
              )}
              <div className="flex gap-3 w-full">
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
                      ? 'bg-blue-600 hover:bg-blue-700 active:scale-95' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Card */}
      <div className={`rounded-xl p-6 shadow-sm border ${currentCheckIn ? 'bg-white border-blue-900' : 'bg-white border-gray-200'}`}>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Status do Serviço</h2>
        
        {currentCheckIn ? (
          <div>
            <div className="flex items-center gap-2 mb-4 text-green-700 bg-green-50 p-3 rounded-lg">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="font-semibold">EM SERVIÇO ({currentCheckIn.shift || 'N/A'})</span>
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
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
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
              className="text-blue-800 hover:text-blue-900"
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
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Condição</p>
                  <p className="text-lg font-medium text-gray-800">{weather.condition}</p>
                </div>

                <div className="col-span-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Ondas</p>
                  <p className="text-lg font-semibold text-gray-800">{weather.waveHeight}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Índice UV</p>
                  <p className="text-lg font-semibold text-gray-800">{weather.uvIndex || '--'}</p>
                </div>

                <div className="col-span-2 flex justify-between items-center bg-orange-50 p-2 rounded border border-orange-100">
                   <div className="flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                     </svg>
                     <span className="text-sm font-medium text-orange-800">Pôr do Sol</span>
                   </div>
                   <span className="text-lg font-bold text-orange-900">{weather.sunset || '--:--'}</span>
                </div>
                
                {/* Tide Section */}
                <div className="col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-900 uppercase tracking-wide font-bold mb-2">Tábua de Marés (Turno: 08:00 - 19:00)</p>
                  
                  {weather.tideEvents && getShiftTideEvents(weather.tideEvents).length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {getShiftTideEvents(weather.tideEvents).map((event, idx) => (
                        <div key={idx} className="bg-white p-2 rounded shadow-sm border border-blue-100 flex flex-col items-center">
                          <span className={`text-xs font-bold ${event.type === 'Alta' ? 'text-blue-900' : 'text-orange-600'}`}>
                            {event.type === 'Alta' ? '▲' : '▼'} {event.type}
                          </span>
                          <span className="text-sm font-bold text-gray-800">{event.time}</span>
                          <span className="text-xs text-gray-500">{event.height}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                       <p className="text-sm text-gray-600 mb-1">Nenhum evento de maré no horário do turno.</p>
                       <p className="text-xs text-gray-400">Resumo: {weather.tide}</p>
                    </div>
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