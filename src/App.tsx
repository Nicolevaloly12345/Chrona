import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, 
  Navigation, 
  Clock, 
  AlertTriangle, 
  Map as MapIcon, 
  ChevronRight, 
  Zap, 
  Info,
  MapPin,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Trophy,
  Plus,
  ThumbsUp,
  CloudRain,
  Sun,
  Cloud,
  Snowflake,
  Calendar,
  User,
  Medal,
  Coins,
  LocateFixed,
  Wind,
  Droplets,
  Sunrise,
  Sunset,
  Thermometer,
  Umbrella,
  Eye,
  Waves,
  Gauge,
  Compass,
  Globe,
  Coffee,
  Fuel,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bell,
  Film,
  Utensils,
  Trash2,
  Gift,
  Mail,
  Music,
  Crown,
  AlertOctagon,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import YouTube from 'react-youtube';

import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  Timestamp,
  handleFirestoreError,
  OperationType,
  type User as FirebaseUser
} from './firebase';
import { 
  MOCK_LOCATIONS, 
  fetchRealRoute, 
  fetchAllRoutes,
  BADGES, 
  MOCK_LEADERBOARD, 
  MOCK_CALENDAR_EVENTS,
  MOCK_TRIP_HISTORY,
  type Location, 
  type Route, 
  type Incident,
  type Badge,
  type LeaderboardUser,
  type CarType,
  type CalendarEvent,
  type TripRecord,
  CAR_TYPES
} from './constants';
import { predictTravelTime, extractVoiceIntent, type PredictionResult, type VoiceIntent } from './services/geminiService';

// Fix Leaflet default icon issue
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const VOICE_LOCALES = [
  { id: 'es-ES', label: 'Español (España)', flag: '🇪🇸' },
  { id: 'es-MX', label: 'Español (México)', flag: '🇲🇽' },
  { id: 'es-CO', label: 'Español (Colombia)', flag: '🇨🇴' },
  { id: 'es-AR', label: 'Español (Argentina)', flag: '🇦🇷' },
  { id: 'es-CL', label: 'Español (Chile)', flag: '🇨🇱' },
  { id: 'es-PE', label: 'Español (Perú)', flag: '🇵🇪' },
  { id: 'es-VE', label: 'Español (Venezuela)', flag: '🇻🇪' },
  { id: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { id: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { id: 'en-AU', label: 'English (Australia)', flag: '🇦🇺' },
  { id: 'en-CA', label: 'English (Canada)', flag: '🇨🇦' },
  { id: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
  { id: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { id: 'pt-PT', label: 'Português (Portugal)', flag: '🇵🇹' },
  { id: 'fr-FR', label: 'Français (France)', flag: '🇫🇷' },
  { id: 'fr-CA', label: 'Français (Canada)', flag: '🇨🇦' },
  { id: 'de-DE', label: 'Deutsch (Deutschland)', flag: '🇩🇪' },
  { id: 'it-IT', label: 'Italiano (Italia)', flag: '🇮🇹' },
  { id: 'ja-JP', label: '日本語 (日本)', flag: '🇯🇵' },
  { id: 'zh-CN', label: '中文 (中国)', flag: '🇨🇳' },
  { id: 'zh-HK', label: '中文 (香港)', flag: '🇭🇰' },
  { id: 'zh-TW', label: '中文 (台灣)', flag: '🇹🇼' },
  { id: 'ru-RU', label: 'Русский (Россия)', flag: '🇷🇺' },
  { id: 'ko-KR', label: '한국어 (대한민국)', flag: '🇰🇷' },
  { id: 'ar-SA', label: 'العربية (السعودية)', flag: '🇸🇦' },
  { id: 'hi-IN', label: 'हिन्दी (भारत)', flag: '🇮🇳' },
];

const IncidentIcon = (type: string) => {
  const colors: Record<string, string> = {
    'accident': '#ef4444',
    'roadworks': '#3b82f6',
    'hazard': '#f59e0b',
    'police': '#0ea5e9'
  };
  const color = colors[type] || '#ef4444';
  
  return L.divIcon({
    html: `<div class="p-1 rounded-full border-2 border-white shadow-lg" style="background-color: ${color}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const CarIcon = (rotation: number, carType: CarType) => {
  const getIconPath = (icon: string) => {
    switch (icon) {
      case 'sport':
        return '<path d="M21 11L18 8H6L3 11V16H5V18H7V16H17V18H19V16H21V11ZM17 11H7L8.5 9H15.5L17 11Z"/>';
      case 'truck':
        return '<path d="M20 8H17V4H3C1.9 4 1 4.9 1 6V17H3C3 18.66 4.34 20 6 20S9 18.66 9 17H15C15 18.66 16.34 20 18 20S21 18.66 21 17H23V12L20 8ZM6 18.5C5.17 18.5 4.5 17.83 4.5 17S5.17 15.5 6 15.5 7.5 16.17 7.5 17 6.83 18.5 6 18.5ZM18 18.5C17.17 18.5 16.5 17.83 16.5 17S17.17 15.5 18 15.5 19.5 16.17 19.5 17 18.83 18.5 18 18.5ZM17 12V9.5H19.5L21.4 12H17Z"/>';
      case 'bus':
        return '<path d="M4 16c0 .55.45 1 1 1h1c.55 0 1-.45 1-1s-.45-1-1-1H5c-.55 0-1 .45-1 1zm12 0c0 .55.45 1 1 1h1c.55 0 1-.45 1-1s-.45-1-1-1h-1c-.55 0-1 .45-1 1zM8 13h8V5H8v8zm9-8h3c.55 0 1 .45 1 1v10c0 1.1-.9 2-2 2h-1c0 1.1-.9 2-2 2s-2-.9-2-2H9c0 1.1-.9 2-2 2s-2-.9-2-2H4c-1.1 0-2-.9-2-2V6c0-.55.45-1 1-1h3c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2z"/>';
      case 'ufo':
        return '<path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 10c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zM2 13h3v2H2v-2zm17 0h3v2h-3v-2zM7.17 14.92l-2.12 2.12-1.41-1.41 2.12-2.12 1.41 1.41zm12.5 0l2.12 2.12-1.41 1.41-2.12-2.12 1.41-1.41z"/>';
      case 'rocket':
        return '<path d="M13.13 22.19L11.5 18.35L9.87 22.19L11.5 21.42L13.13 22.19ZM13 2H10V11H13V2ZM18 10V11H15V10H18ZM8 10V11H5V10H8ZM11.5 12C10.12 12 9 13.12 9 14.5V17H14V14.5C14 13.12 12.88 12 11.5 12Z"/>';
      default: // car
        return '<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM6.5 16C5.67 16 5 15.33 5 14.5C5 13.67 5.67 13 6.5 13C7.33 13 8 13.67 8 14.5C8 15.33 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5C16 13.67 16.67 13 17.5 13C18.33 13 19 13.67 19 14.5C19 15.33 18.33 16 17.5 16ZM5 11L6.5 7H17.5L19 11H5Z"/>';
    }
  };

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-6 bg-black/10 rounded-[100%] blur-sm translate-y-4"></div>
        <div class="absolute w-10 h-10 bg-emerald-500/20 rounded-full animate-ping"></div>
        <div class="relative p-2 rounded-xl shadow-lg border-2 border-white transition-all duration-500 hover:scale-110" style="background-color: ${carType.color}; transform: rotate(${rotation}deg); animation: carBounce 2s infinite ease-in-out">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            ${getIconPath(carType.icon)}
            {/* Friendly eyes */}
            <circle cx="9" cy="14.5" r="1.5" fill="black" />
            <circle cx="15" cy="14.5" r="1.5" fill="black" />
            {/* Friendly smile */}
            <path d="M10 17.5C10 17.5 11 18.5 12 18.5C13 18.5 14 17.5 14 17.5" stroke="black" stroke-width="1" stroke-linecap="round" />
            {/* CHRONA Logo */}
            <path d="M11 7L10 10H13L12 13" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
            {/* Headlights */}
            <circle cx="6" cy="7" r="1" fill="#fbbf24" class="animate-pulse" />
            <circle cx="18" cy="7" r="1" fill="#fbbf24" class="animate-pulse" />
            {/* Smart Sensor */}
            <circle cx="12" cy="5" r="1.5" fill="#10b981" class="animate-pulse" />
            <path d="M12 5V3" stroke="#10b981" stroke-width="0.5" />
          </svg>
        </div>
      </div>
    `,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const MapController = ({ center, zoom, route, carPosition, followCar }: { center: [number, number], zoom: number, route?: Route | null, carPosition?: [number, number] | null, followCar: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    if (carPosition && followCar) {
      map.setView(carPosition, map.getZoom(), {
        animate: true,
        duration: 0.5
      });
    } else if (route && route.coordinates.length > 0 && !carPosition) {
      const bounds = L.latLngBounds(route.coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (!route && !carPosition) {
      map.setView(center, zoom);
    }
  }, [center, zoom, route, carPosition, followCar, map]);

  useEffect(() => {
    // Aggressive fix for "squares" issue
    // We call it multiple times to catch any layout shifts or animations
    const invalidate = () => {
      map.invalidateSize();
    };

    // Initial invalidations
    invalidate();
    const timer1 = setTimeout(invalidate, 100);
    const timer2 = setTimeout(invalidate, 500);
    const timer3 = setTimeout(invalidate, 1000);

    // Also handle window resize
    window.addEventListener('resize', invalidate);
    
    // Create a ResizeObserver to detect when the map container itself changes size
    const resizeObserver = new ResizeObserver(() => {
      invalidate();
    });
    
    const mapContainer = map.getContainer();
    if (mapContainer) {
      resizeObserver.observe(mapContainer);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', invalidate);
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
};

const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const getWeatherIcon = (code: number, size = 24) => {
  if (code === 0 || code === 1) return <Sun size={size} className="text-amber-500" />;
  if (code === 2 || code === 3) return <Cloud size={size} className="text-slate-400" />;
  if (code >= 51 && code <= 67 || code >= 80 && code <= 82 || code >= 95) return <CloudRain size={size} className="text-blue-500" />;
  if (code >= 71 && code <= 77 || code >= 85 && code <= 86) return <Snowflake size={size} className="text-sky-300" />;
  return <Cloud size={size} className="text-slate-400" />;
};

const getWeatherLabel = (code: number) => {
  if (code === 0 || code === 1) return 'Despejado';
  if (code === 2 || code === 3) return 'Nublado';
  if (code >= 51 && code <= 67 || code >= 80 && code <= 82 || code >= 95) return 'Lluvia';
  if (code >= 71 && code <= 77 || code >= 85 && code <= 86) return 'Nieve';
  return 'Nublado';
};

const WeatherDashboard = ({ data, locationName, isConnected, onConnect, isConnecting, userLocation }: { data: any, locationName?: string, isConnected: boolean, onConnect: () => void, isConnecting: boolean, userLocation: [number, number] }) => {
  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <Cloud size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" />
      </div>
      <p className="text-sm font-medium tracking-wide">Actualizando pronóstico...</p>
    </div>
  );

  const current = data.current_weather;
  const hourly = data.hourly;
  const daily = data.daily;

  const now = new Date();
  const currentHour = now.getHours();
  
  const next24Hours = hourly.time.slice(currentHour, currentHour + 24).map((time: string, i: number) => ({
    time: i === 0 ? 'Ahora' : new Date(time).toLocaleTimeString([], { hour: '2-digit', hour12: false }),
    temp: hourly.temperature_2m[currentHour + i],
    code: hourly.weathercode[currentHour + i],
    precip: hourly.precipitation_probability[currentHour + i]
  }));

  const next7Days = daily.time.map((time: string, i: number) => ({
    date: i === 0 ? 'Hoy' : new Date(time).toLocaleDateString('es-ES', { weekday: 'short' }),
    max: daily.temperature_2m_max[i],
    min: daily.temperature_2m_min[i],
    code: daily.weathercode[i]
  }));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 pb-10"
    >
      {/* Connection Status Banner */}
      {!isConnected ? (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 text-slate-800 shadow-xl shadow-slate-200/50 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center p-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Windy_logo.svg/1200px-Windy_logo.svg.png" alt="Windy Logo" className="w-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1">
                Conectar con <span className="text-red-500">Windy Radar</span>
              </h3>
              <p className="text-[10px] text-slate-500">Sincroniza el radar profesional en vivo dentro de tu app.</p>
            </div>
          </div>
          <button 
            onClick={onConnect}
            disabled={isConnecting}
            className="w-full bg-red-500 text-white font-bold py-3 rounded-2xl text-xs hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-200"
          >
            {isConnecting ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Conectando radar...
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Activar Radar en Vivo
              </>
            )}
          </button>
        </motion.div>
      ) : (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-3 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center text-white">
              <ShieldCheck size={14} />
            </div>
            <span className="text-[10px] font-bold text-red-600">Sincronizado con Windy</span>
          </div>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Windy_logo.svg/1200px-Windy_logo.svg.png" alt="Windy" className="h-4 opacity-50" referrerPolicy="no-referrer" />
        </div>
      )}

      {isConnected ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-[600px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white"
        >
          <iframe 
            src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km/h&zoom=10&overlay=wind&product=ecmwf&level=surface&lat=${userLocation[0]}&lon=${userLocation[1]}&detailLat=${userLocation[0]}&detailLon=${userLocation[1]}&detail=true`}
            className="w-full h-full border-none"
            title="Windy Weather Radar"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </motion.div>
      ) : (
        <>
          {/* Main Header */}
          <div className="text-center py-8 space-y-1">
            <h2 className="text-3xl font-medium text-slate-900">{locationName || 'Tu Ubicación'}</h2>
            <div className="text-7xl font-light tracking-tighter text-slate-900 ml-4">
              {Math.round(current.temperature)}°
            </div>
            <p className="text-lg font-medium text-slate-500 capitalize">
              {getWeatherLabel(current.weathercode)}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-900">
              <span>Máx: {Math.round(daily.temperature_2m_max[0])}°</span>
              <span>Mín: {Math.round(daily.temperature_2m_min[0])}°</span>
            </div>
          </div>

          {/* Hourly Forecast Card */}
          <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
              <Clock size={12} />
              Pronóstico por hora
            </div>
            <div className="flex gap-6 overflow-x-auto pb-2 no-scrollbar">
              {next24Hours.map((h: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-3 min-w-[45px]">
                  <span className="text-[10px] font-bold text-slate-900">{h.time}</span>
                  <div className="h-8 flex items-center">
                    {getWeatherIcon(h.code, 20)}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-slate-900">{Math.round(h.temp)}°</span>
                    {h.precip > 0 && (
                      <span className="text-[8px] font-bold text-blue-500">{h.precip}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7-Day Forecast Card */}
          <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
              <Calendar size={12} />
              Pronóstico de 7 días
            </div>
            <div className="space-y-4">
              {next7Days.map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between group">
                  <span className="text-sm font-bold text-slate-900 w-10 capitalize">{d.date}</span>
                  <div className="flex items-center justify-center flex-1">
                    {getWeatherIcon(d.code, 20)}
                  </div>
                  <div className="flex items-center gap-3 w-24 justify-end">
                    <span className="text-sm font-bold text-slate-400">{Math.round(d.min)}°</span>
                    <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden relative">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-blue-400 to-amber-400"
                        style={{ 
                          left: '20%', 
                          right: '20%' 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{Math.round(d.max)}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Grid of Details */}
      <div className="grid grid-cols-2 gap-4">
        {/* UV Index (Simulated) */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Sun size={12} /> Índice UV
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">3</div>
            <div className="text-sm font-medium text-slate-500">Moderado</div>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-green-400 to-yellow-400"></div>
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Droplets size={12} /> Humedad
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{hourly.relative_humidity_2m[currentHour]}%</div>
            <div className="text-xs text-slate-500">El punto de rocío es de 12° ahora.</div>
          </div>
        </div>

        {/* Wind */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Wind size={12} /> Viento
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900">{current.windspeed}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">km/h</div>
            </div>
            <Compass size={32} className="text-slate-200" />
          </div>
        </div>

        {/* Visibility (Simulated) */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Eye size={12} /> Visibilidad
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">10 km</div>
            <div className="text-xs text-slate-500">Está perfectamente despejado.</div>
          </div>
        </div>

        {/* Pressure (Simulated) */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Gauge size={12} /> Presión
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-slate-900">1014</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">hPa</div>
          </div>
        </div>

        {/* Feels Like */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Thermometer size={12} /> Sensación
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{Math.round(current.temperature + 1)}°</div>
            <div className="text-xs text-slate-500">Similar a la temperatura real.</div>
          </div>
        </div>
      </div>

      {/* Sun Details */}
      <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Sunrise size={12} /> Amanecer
            </div>
            <div className="text-xl font-bold text-slate-900">
              {new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Sunset size={12} /> Atardecer
            </div>
            <div className="text-xl font-bold text-slate-900">
              {new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
          </div>
        </div>
        <div className="h-12 w-full relative overflow-hidden">
          <div className="absolute inset-0 border-b border-slate-200"></div>
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-full h-24 border-2 border-amber-200 rounded-full border-dashed opacity-50"></div>
          <Sun size={16} className="absolute left-1/4 top-0 text-amber-400 -translate-y-1/2" />
        </div>
      </div>
    </motion.div>
  );
};

const getTabIcon = (tab: string) => {
  switch(tab) {
    case 'nav': return <MapIcon size={14} />;
    case 'incidents': return <AlertTriangle size={14} />;
    case 'weather': return <Cloud size={14} />;
    case 'social': return <User size={14} />;
    case 'garage': return <Zap size={14} />;
    case 'rewards': return <Trophy size={14} />;
    case 'calendar': return <Calendar size={14} />;
    case 'history': return <Clock size={14} />;
    case 'profile': return <User size={14} />;
    default: return null;
  }
};

export default function App() {
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isTrafficWarningVisible, setIsTrafficWarningVisible] = useState(false);
  const [isRestPlannerEnabled, setIsRestPlannerEnabled] = useState(true);
  const [continuousDrivingTime, setContinuousDrivingTime] = useState(0); // in minutes
  const [showFatigueWarning, setShowFatigueWarning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(true);
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const [showWakeWordFlash, setShowWakeWordFlash] = useState(false);
  const [wakeWordTranscript, setWakeWordTranscript] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  
  // Search states
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<Location[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Location[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [followCar, setFollowCar] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [eta, setEta] = useState<string>("");
  const [remainingDist, setRemainingDist] = useState<number>(0);
  const [routeIncidents, setRouteIncidents] = useState<Incident[]>([]);

  // Calculate ETA and remaining distance
  useEffect(() => {
    if (isNavigating && selectedRoute) {
      const progress = currentRouteIndex / selectedRoute.coordinates.length;
      const remainingTime = Math.max(1, Math.round(selectedRoute.duration * (1 - progress)));
      const remainingD = Math.max(0.1, selectedRoute.distance * (1 - progress));
      
      const now = new Date();
      now.setMinutes(now.getMinutes() + remainingTime);
      setEta(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setRemainingDist(remainingD);
    }
  }, [isNavigating, currentRouteIndex, selectedRoute]);

  // Generate mock incidents when route is found
  useEffect(() => {
    if (selectedRoute) {
      const types = ['accident', 'roadworks', 'hazard'];
      const newIncidents: Incident[] = [];
      // Add 2-3 incidents along the route
      for (let i = 0; i < 3; i++) {
        const idx = Math.floor(Math.random() * (selectedRoute.coordinates.length - 10)) + 5;
        newIncidents.push({
          id: `route-inc-${i}`,
          type: types[Math.floor(Math.random() * types.length)] as any,
          lat: selectedRoute.coordinates[idx][0],
          lng: selectedRoute.coordinates[idx][1],
          description: 'Reportado recientemente',
          timestamp: Date.now(),
          confirmations: Math.floor(Math.random() * 50),
          reportedBy: 'CHRONA Bot'
        });
      }
      setRouteIncidents(newIncidents);
    } else {
      setRouteIncidents([]);
    }
  }, [selectedRoute]);

  const fetchPlaces = async (query: string) => {
    if (query.length < 3) return [];
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      return data.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      })) as Location[];
    } catch (error) {
      console.error("Error fetching places:", error);
      return [];
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (originQuery && originQuery !== origin?.name) {
        setIsSearchingOrigin(true);
        const results = await fetchPlaces(originQuery);
        setOriginSuggestions(results);
        setIsSearchingOrigin(false);
      } else {
        setOriginSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [originQuery, origin]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (destQuery && destQuery !== destination?.name) {
        setIsSearchingDest(true);
        const results = await fetchPlaces(destQuery);
        setDestSuggestions(results);
        setIsSearchingDest(false);
      } else {
        setDestSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [destQuery, destination]);

  // New features state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isReporting, setIsReporting] = useState(false);
  const [reportType, setReportType] = useState<'accident' | 'roadworks' | 'hazard' | 'police'>('accident');
  const [reportDesc, setReportDesc] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [arrivalTime, setArrivalTime] = useState('09:30');
  
  // Waze-like features
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [routeType, setRouteType] = useState<'fastest' | 'shortest' | 'eco'>('fastest');
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Music Player State
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [musicSearchResults, setMusicSearchResults] = useState<any[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const youtubePlayerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const searchMusic = async (query: string) => {
    if (!query.trim()) {
      setMusicSearchResults([]);
      return;
    }
    setIsSearchingMusic(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=5&media=music`);
      const data = await res.json();
      setMusicSearchResults(data.results || []);
    } catch (e) {
      console.error("Error searching music", e);
    }
    setIsSearchingMusic(false);
  };

  const togglePlay = () => {
    if (youtubePlayerRef.current) {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo();
      } else {
        youtubePlayerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        if (youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime) {
          setAudioProgress(youtubePlayerRef.current.getCurrentTime());
        }
      }, 1000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [weather, setWeather] = useState('Sunny');
  const [weatherData, setWeatherData] = useState<{ temp: number, condition: string } | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setIsFetchingWeather(true);
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode,relative_humidity_2m,wind_speed_10m,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`);
      const data = await response.json();
      const code = data.current_weather.weathercode;
      const temp = data.current_weather.temperature;
      
      let condition = 'Sunny';
      if (code === 0 || code === 1) condition = 'Sunny';
      else if (code === 2 || code === 3) condition = 'Cloudy';
      else if (code >= 51 && code <= 67 || code >= 80 && code <= 82 || code >= 95) condition = 'Rainy';
      else if (code >= 71 && code <= 77 || code >= 85 && code <= 86) condition = 'Snowy';
      else condition = 'Cloudy';

      setWeather(condition);
      setWeatherData({ temp, condition });
      setForecastData(data);
    } catch (error) {
      console.error("Error fetching weather:", error);
    } finally {
      setIsFetchingWeather(false);
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchWeather(userLocation[0], userLocation[1]);
    }
  }, [userLocation, fetchWeather]);
  const [isWeatherConnected, setIsWeatherConnected] = useState(false);
  const [isConnectingWeather, setIsConnectingWeather] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState('es-ES');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const t = useCallback((key: string, params?: any) => {
    const translations: any = {
      'es': {
        attention: `Atención: ${params?.type || 'incidente'} reportado a quinientos metros.`,
        destination: 'Has llegado a tu destino. CHRONA te desea un excelente día.',
        recalculating: 'Desvío detectado. Recalculando ruta más rápida.',
        turnLeft: 'Gira a la izquierda en doscientos metros.',
        turnRight: 'Gira a la derecha en cien metros.',
        goStraight: 'Continúa recto por un kilómetro.',
        trafficAnalysis: `Hay un retraso de ${params?.delay} ${params?.delay === 1 ? 'minuto' : 'minutos'} por tráfico en esta ruta.`,
        calculatingRoute: `Entendido, calculando la mejor ruta hacia ${params?.destination}.`,
        locationNotFound: `Lo siento, no pude encontrar la ubicación: ${params?.destination}. ¿Podrías ser más específico?`,
        searchError: `Hubo un problema al buscar ${params?.destination}. Por favor, intenta de nuevo.`,
        destinationNotUnderstood: "No entendí el destino. ¿A dónde te gustaría ir?",
        trafficReport: `El tráfico en la ruta actual es ${params?.level}. Hay un retraso estimado de ${params?.delay} minutos.`,
        noRouteSelected: "Primero debes seleccionar una ruta para consultar el tráfico.",
        departureRecommendation: `Para llegar a tiempo, te recomiendo salir a las ${params?.time}.`,
        noDepartureCalculated: "Aún no he calculado tu hora de salida. Por favor, indica tu destino primero.",
        searchingServices: `Buscando ${params?.service || 'servicios'} cercanos en tu ruta.`,
        restStopsPlanned: `He planeado ${params?.count} paradas de descanso. La primera es en ${params?.distance} kilómetros.`,
        noRestStopsNeeded: "Para este viaje no se requieren paradas de descanso obligatorias, pero recuerda parar si te sientes cansado.",
        processingError: "Lo siento, tuve un problema al procesar tu solicitud.",
        micDenied: "El acceso al micrófono ha sido denegado.",
        fatigueWarning: "Advertencia de fatiga del conductor. Has estado conduciendo por más de 3 horas. Recomendamos tomar un descanso de 15 a 20 minutos.",
        handsFreeEnabled: "Modo manos libres activado. Di 'Asistente' para hablar conmigo.",
        preparingNavigation: `Preparando navegación para tu evento: ${params?.title}`,
      },
      'en': {
        attention: `Attention: ${params?.type || 'incident'} reported five hundred meters ahead.`,
        destination: 'You have arrived at your destination. CHRONA wishes you a great day.',
        recalculating: 'Detour detected. Recalculating the fastest route.',
        turnLeft: 'Turn left in two hundred meters.',
        turnRight: 'Turn right in one hundred meters.',
        goStraight: 'Continue straight for one kilometer.',
        trafficAnalysis: `There is a ${params?.delay} minute delay due to traffic on this route.`,
        calculatingRoute: `Understood, calculating the best route to ${params?.destination}.`,
        locationNotFound: `I'm sorry, I couldn't find the location: ${params?.destination}. Could you be more specific?`,
        searchError: `There was a problem searching for ${params?.destination}. Please try again.`,
        destinationNotUnderstood: "I didn't understand the destination. Where would you like to go?",
        trafficReport: `Traffic on the current route is ${params?.level}. There is an estimated delay of ${params?.delay} minutes.`,
        noRouteSelected: "You must first select a route to check traffic.",
        departureRecommendation: `To arrive on time, I recommend leaving at ${params?.time}.`,
        noDepartureCalculated: "I haven't calculated your departure time yet. Please indicate your destination first.",
        searchingServices: `Searching for nearby ${params?.service || 'services'} on your route.`,
        restStopsPlanned: `I've planned ${params?.count} rest stops. The first one is in ${params?.distance} kilometers.`,
        noRestStopsNeeded: "No mandatory rest stops are required for this trip, but remember to stop if you feel tired.",
        processingError: "I'm sorry, I had a problem processing your request.",
        micDenied: "Microphone access has been denied.",
        fatigueWarning: "Driver fatigue warning. You have been driving for more than 3 hours. We recommend taking a 15 to 20 minute break.",
        handsFreeEnabled: "Hands-free mode activated. Say 'Assistant' to talk to me.",
        preparingNavigation: `Preparing navigation for your event: ${params?.title}`,
      },
      'pt': {
        attention: `Atenção: ${params?.type || 'incidente'} relatado a quinhentos metros.`,
        destination: 'Você chegou ao seu destino. CHRONA deseja a você um excelente dia.',
        recalculating: 'Desvio detectado. Recalculando a rota mais rápida.',
        turnLeft: 'Vire à esquerda em duzentos metros.',
        turnRight: 'Vire à direita em cem metros.',
        goStraight: 'Siga em frente por um quilômetro.',
        trafficAnalysis: `Há um atraso de ${params?.delay} minutos devido ao tráfego nesta rota.`,
        calculatingRoute: `Entendido, calculando a melhor rota para ${params?.destination}.`,
        locationNotFound: `Sinto muito, não consegui encontrar o local: ${params?.destination}. Você poderia ser mais específico?`,
        searchError: `Houve um problema ao procurar por ${params?.destination}. Por favor, tente novamente.`,
        destinationNotUnderstood: "Não entendi o destino. Para onde você gostaria de ir?",
        trafficReport: `O tráfego na rota atual está ${params?.level}. Há um atraso estimado de ${params?.delay} minutos.`,
        noRouteSelected: "Você deve primeiro selecionar uma rota para verificar o tráfego.",
        departureRecommendation: `Para chegar a tempo, recomendo sair às ${params?.time}.`,
        noDepartureCalculated: "Ainda não calculei seu horário de partida. Por favor, indique seu destino primeiro.",
        searchingServices: `Procurando por ${params?.service || 'serviços'} próximos em sua rota.`,
        restStopsPlanned: `Planejei ${params?.count} paradas de descanso. A primeira é em ${params?.distance} quilômetros.`,
        noRestStopsNeeded: "Não são necessárias paradas de descanso obrigatórias para esta viagem, mas lembre-se de parar se se sentir cansado.",
        processingError: "Sinto muito, tive um problema ao processar seu pedido.",
        micDenied: "O acesso ao microfone foi negado.",
        fatigueWarning: "Aviso de fadiga do motorista. Você está dirigindo há mais de 3 horas. Recomendamos fazer uma pausa de 15 a 20 minutos.",
        handsFreeEnabled: "Modo mãos-livres ativado. Diga 'Assistente' para falar comigo.",
        preparingNavigation: `Preparando navegação para o seu evento: ${params?.title}`,
      },
      'fr': {
        attention: `Attention : ${params?.type || 'incident'} signalé à cinq cents mètres.`,
        destination: 'Vous êtes arrivé à destination. CHRONA vous souhaite une excellente journée.',
        recalculating: 'Déviation détectée. Recalcul de l\'itinéraire le plus rapide.',
        turnLeft: 'Tournez à gauche dans deux cents mètres.',
        turnRight: 'Tournez à droite dans cent mètres.',
        goStraight: 'Continuez tout droit sur un kilomètre.',
        trafficAnalysis: `Il y a un retard de ${params?.delay} minutes dû au trafic sur cet itinéraire.`,
        calculatingRoute: `Compris, calcul du meilleur itinéraire vers ${params?.destination}.`,
        locationNotFound: `Désolé, je n'ai pas pu trouver le lieu : ${params?.destination}. Pourriez-vous être plus précis ?`,
        searchError: `Un problème est survenu lors de la recherche de ${params?.destination}. Veuillez réessayer.`,
        destinationNotUnderstood: "Je n'ai pas compris la destination. Où aimeriez-vous aller ?",
        trafficReport: `Le trafic sur l'itinéraire actuel est ${params?.level}. Il y a un retard estimé de ${params?.delay} minutes.`,
        noRouteSelected: "Vous devez d'abord sélectionner un itinéraire pour consulter le trafic.",
        departureRecommendation: `Pour arriver à l'heure, je vous recommande de partir à ${params?.time}.`,
        noDepartureCalculated: "Je n'ai pas encore calculé votre heure de départ. Veuillez d'abord indiquer votre destination.",
        searchingServices: `Recherche de ${params?.service || 'services'} à proximité sur votre itinéraire.`,
        restStopsPlanned: `J'ai prévu ${params?.count} arrêts de repos. Le premier est à ${params?.distance} kilomètres.`,
        noRestStopsNeeded: "Aucun arrêt de repos obligatoire n'est requis pour ce voyage, mais n'oubliez pas de vous arrêter si vous vous sentez fatigué.",
        processingError: "Désolé, j'ai eu un problème lors du traitement de votre demande.",
        micDenied: "L'accès au micro-phone a été refusé.",
        fatigueWarning: "Avertissement de fatigue du conducteur. Vous conduisez depuis plus de 3 heures. Nous vous recommandons de faire une pause de 15 à 20 minutes.",
        handsFreeEnabled: "Mode mains libres activé. Dites CHRONA pour me parler.",
        preparingNavigation: `Préparation de la navigation pour votre événement : ${params?.title}`,
      },
      'de': {
        attention: `Achtung: ${params?.type || 'Vorfall'} in fünfhundert Metern gemeldet.`,
        destination: 'Sie sind an Ihrem Ziel angekommen. CHRONA wünscht Ihnen einen schönen Tag.',
        recalculating: 'Umleitung erkannt. Die schnellste Route wird neu berechnet.',
        turnLeft: 'In zweihundert Metern links abbiegen.',
        turnRight: 'In hundert Metern rechts abbiegen.',
        goStraight: 'Fahren Sie einen Kilometer geradeaus.',
        trafficAnalysis: `Es gibt eine Verzögerung von ${params?.delay} Minuten aufgrund von Verkehr auf dieser Route.`,
        calculatingRoute: `Verstanden, die beste Route nach ${params?.destination} wird berechnet.`,
        locationNotFound: `Entschuldigung, ich konnte den Ort ${params?.destination} nicht finden. Könnten Sie genauer sein?`,
        searchError: `Es gab ein Problem bei der Suche nach ${params?.destination}. Bitte versuchen Sie es erneut.`,
        destinationNotUnderstood: "Ich habe das Ziel nicht verstanden. Wohin möchten Sie fahren?",
        trafficReport: `Der Verkehr auf der aktuellen Route ist ${params?.level}. Es gibt eine geschätzte Verzögerung von ${params?.delay} Minuten.`,
        noRouteSelected: "Sie müssen zuerst eine Route auswählen, um den Verkehr zu prüfen.",
        departureRecommendation: `Um pünktlich anzukommen, empfehle ich, um ${params?.time} Uhr loszufahren.`,
        noDepartureCalculated: "Ich habe Ihre Abfahrtszeit noch nicht berechnet. Bitte geben Sie zuerst Ihr Ziel an.",
        searchingServices: `Suche nach ${params?.service || 'Diensten'} in der Nähe auf Ihrer Route.`,
        restStopsPlanned: `Ich habe ${params?.count} Pausen eingeplant. Die erste ist in ${params?.distance} Kilometern.`,
        noRestStopsNeeded: "Für diese Fahrt sind keine obligatorischen Pausen erforderlich, aber denken Sie daran, anzuhalten, wenn Sie sich müde fühlen.",
        processingError: "Entschuldigung, ich hatte ein Problem bei der Bearbeitung Ihrer Anfrage.",
        micDenied: "Der Zugriff auf das Mikrofon wurde verweigert.",
        fatigueWarning: "Warnung vor Fahrermüdigkeit. Sie fahren seit mehr than 3 Stunden. Wir empfehlen eine Pause von 15 bis 20 Minuten.",
        handsFreeEnabled: "Freisprechmodus aktiviert. Sagen Sie CHRONA, um mit mir zu sprechen.",
        preparingNavigation: `Navigation für Ihre Veranstaltung wird vorbereitet: ${params?.title}`,
      },
      'it': {
        attention: `Attenzione: ${params?.type || 'incidente'} segnalato a cinquecento metri.`,
        destination: 'Sei arrivato a destinazione. CHRONA ti augura una buona giornata.',
        recalculating: 'Deviazione rilevata. Ricalcolo del percorso più veloce.',
        turnLeft: 'Gira a sinistra tra duecento metri.',
        turnRight: 'Gira a destra tra cento metri.',
        goStraight: 'Continua dritto per un chilometro.',
        trafficAnalysis: `C'è un ritardo di ${params?.delay} minuti a causa del traffico su questo percorso.`,
        calculatingRoute: `Ricevuto, calcolo del percorso migliore per ${params?.destination}.`,
        locationNotFound: `Scusa, non sono riuscito a trovare la posizione: ${params?.destination}. Potresti essere più specifico??`,
        searchError: `C'è stato un problema nella ricerca di ${params?.destination}. Per favore riprova.`,
        destinationNotUnderstood: "Non ho capito la destinazione. Dove ti piacerebbe andare?",
        trafficReport: `Il traffico sul percorso attuale è ${params?.level}. C'è un ritardo stimato di ${params?.delay} minuti.`,
        noRouteSelected: "Devi prima selezionare un percorso per controllare il traffico.",
        departureRecommendation: `Per arrivare in tempo, ti consiglio di partire alle ${params?.time}.`,
        noDepartureCalculated: "Non ho ancora calcolato l'orario di partenza. Per favore indica prima la tua destinazione.",
        searchingServices: `Ricerca di ${params?.service || 'servizi'} vicini sul tuo percorso.`,
        restStopsPlanned: `Ho pianificato ${params?.count} soste. La prima è tra ${params?.distance} chilometri.`,
        noRestStopsNeeded: "Non sono richieste soste obbligatorie per questo viaggio, ma ricorda di fermarti se ti senti stanco.",
        processingError: "Scusa, ho avuto un problema nell'elaborazione della tua richiesta.",
        micDenied: "L'accesso al microfono è stato negato.",
        fatigueWarning: "Avviso stanchezza conducente. Stai guidando da più di 3 ore. Ti consigliamo di fare una pausa di 15-20 minuti.",
        handsFreeEnabled: "Modalità vivavoce attivata. Di' CHRONA per parlare con me.",
        preparingNavigation: `Preparazione della navigazione per il tuo evento: ${params?.title}`,
      },
      'ja': {
        attention: `注意：500メートル先に${params?.type || '事故'}が報告されています。`,
        destination: '目的地に到着しました。CHRONAは素晴らしい一日をお祈りしています。',
        recalculating: '迂回路を検出しました。最短ルートを再計算しています。',
        turnLeft: '200メートル先を左折してください。',
        turnRight: '100メートル先を右折してください。',
        goStraight: '1キロメートル直進してください。',
        trafficAnalysis: `このルートでは交通渋滞により${params?.delay}分の遅延が発生しています。`,
        calculatingRoute: `${params?.destination}への最適なルートを計算しています。`,
        locationNotFound: `申し訳ありません、${params?.destination}が見つかりませんでした。`,
        searchError: `${params?.destination}の検索中に問題が発生しました。`,
        destinationNotUnderstood: "目的地が理解できませんでした。どこへ行きたいですか？",
        trafficReport: `現在のルートの交通状況は${params?.level}です。推定で${params?.delay}分の遅延があります。`,
        noRouteSelected: "交通状況を確認するには、まずルートを選択してください。",
        departureRecommendation: `時間通りに到着するには、${params?.time}に出発することをお勧めします。`,
        noDepartureCalculated: "出発時間はまだ計算されていません。まず目的地を指定してください。",
        searchingServices: `ルート沿いの${params?.service || 'サービス'}を検索しています。`,
        restStopsPlanned: `${params?.count}箇所の休憩所を計画しました。最初は${params?.distance}キロメートル先です。`,
        noRestStopsNeeded: "この旅行では強制的な休憩は必要ありませんが、疲れたら休むようにしてください。",
        processingError: "申し訳ありませんが、リクエストの処理中に問題が発生しました。",
        micDenied: "マイクへのアクセスが拒否されました。",
        fatigueWarning: "運転疲労警告。3時間以上運転しています。15分から20分の休憩を取ることをお勧めします。",
        handsFreeEnabled: "ハンズフリーモードが有効になりました。私と話すには「CHRONA」と言ってください。",
        preparingNavigation: `イベントのナビゲーションを準備しています：${params?.title}`,
      },
      'zh': {
        attention: `注意：前方五百米处报告有${params?.type || '事故'}。`,
        destination: '您已到达目的地。CHRONA祝您度过美好的一天。',
        recalculating: '检测到绕行。正在重新计算最快路线。',
        turnLeft: '两百米后左转。',
        turnRight: '一百米后右转。',
        goStraight: '继续直行一公里。',
        calculatingRoute: `好的，正在计算前往${params?.destination}的最佳路线。`,
        locationNotFound: `抱歉，我找不到地点：${params?.destination}。您能说得更具体一点吗？`,
        searchError: `搜索${params?.destination}时出现问题。请重试。`,
        destinationNotUnderstood: "我不明白目的地。您想去哪里？",
        trafficReport: `当前路线的交通状况为${params?.level}。预计延迟${params?.delay}分钟。`,
        noRouteSelected: "您必须先选择一条路线才能查看交通状况。",
        departureRecommendation: `为了准时到达，我建议您在${params?.time}出发。`,
        noDepartureCalculated: "我还没有计算您的出发时间。请先指明您的目的地。",
        searchingServices: `正在搜索您路线附近的${params?.service || '服务'}。`,
        restStopsPlanned: `我已计划了${params?.count}个休息点。第一个在${params?.distance}公里外。`,
        noRestStopsNeeded: "此行程不需要强制休息，但如果您感到疲劳，请记得停车休息。",
        processingError: "抱歉，我在处理您的请求时遇到了问题。",
        micDenied: "麦克风访问已被拒绝。",
        fatigueWarning: "驾驶疲劳警告。您已连续驾驶超过3小时。建议休息15至20分钟。",
        handsFreeEnabled: "免提模式已激活。说 CHRONA 与我交谈。",
        preparingNavigation: `正在为您准备活动的导航：${params?.title}`,
      },
      'ko': {
        attention: `주의: 500미터 앞에 ${params?.type || '사고'}가 있습니다.`,
        destination: '목적지에 도착했습니다. CHRONA와 함께 즐거운 하루 되세요.',
        recalculating: '경로 이탈이 감지되었습니다. 가장 빠른 경로로 재계산 중입니다.',
        turnLeft: '200미터 앞에서 좌회전입니다.',
        turnRight: '100미터 앞에서 우회전입니다.',
        goStraight: '1킬로미터 직진하십시오.',
        calculatingRoute: `알겠습니다. ${params?.destination}까지의 최적 경로를 계산 중입니다.`,
        locationNotFound: `죄송합니다. ${params?.destination} 위치를 찾을 수 없습니다. 좀 더 구체적으로 말씀해 주시겠습니까?`,
        searchError: `${params?.destination} 검색 중 문제가 발생했습니다. 다시 시도해 주세요.`,
        destinationNotUnderstood: "목적지를 이해하지 못했습니다. 어디로 가고 싶으신가요?",
        trafficReport: `현재 경로의 교통 상황은 ${params?.level}입니다. 약 ${params?.delay}분의 지연이 예상됩니다.`,
        noRouteSelected: "교통 상황을 확인하려면 먼저 경로를 선택해야 합니다.",
        departureRecommendation: `제시간에 도착하려면 ${params?.time}에 출발하는 것을 추천합니다.`,
        noDepartureCalculated: "아직 출발 시간을 계산하지 않았습니다. 먼저 목적지를 알려주세요.",
        searchingServices: `경로 주변의 ${params?.service || '서비스'}를 검색 중입니다.`,
        restStopsPlanned: `${params?.count}개의 휴게소를 계획했습니다. 첫 번째는 ${params?.distance}킬로미터 뒤에 있습니다.`,
        noRestStopsNeeded: "이번 여행에는 필수 휴게소가 필요하지 않지만, 피곤하면 쉬어가는 것을 잊지 마세요.",
        processingError: "죄송합니다. 요청을 처리하는 중 문제가 발생했습니다.",
        micDenied: "마이크 접근이 거부되었습니다.",
        fatigueWarning: "운전자 피로 경고. 3시간 이상 운전하셨습니다. 15~20분 정도 휴식을 취하는 것이 좋습니다.",
        handsFreeEnabled: "핸즈프리 모드가 활성화되었습니다. 저와 대화하려면 'CHRONA'라고 말씀하세요.",
        preparingNavigation: `${params?.title} 일정을 위한 내비게이션을 준비 중입니다.`,
      },
      'hi': {
        attention: `ध्यान दें: पांच सौ मीटर आगे ${params?.type || 'घटना'} की सूचना है।`,
        destination: 'आप अपने गंतव्य पर पहुँच गए हैं। CHRONA आपके लिए एक शानदार दिन की कामना करता है।',
        recalculating: 'चक्कर का पता चला। सबसे तेज़ मार्ग की पुनर्गणना की जा रही है।',
        turnLeft: 'दो सौ मीटर में बाएँ मुड़ें।',
        turnRight: 'सौ मीटर में दाएँ मुड़ें।',
        goStraight: 'एक किलोमीटर तक सीधे चलें।',
        calculatingRoute: `समझ गया, ${params?.destination} के लिए सबसे अच्छा रास्ता निकाला जा रहा है।`,
        locationNotFound: `क्षमा करें, मुझे स्थान नहीं मिला: ${params?.destination}। क्या आप थोड़ा और स्पष्ट हो सकते हैं?`,
        searchError: `${params?.destination} को खोजने में समस्या हुई। कृपया फिर से प्रयास करें।`,
        destinationNotUnderstood: "मुझे गंतव्य समझ में नहीं आया। आप कहाँ जाना चाहेंगे?",
        trafficReport: `वर्तमान मार्ग पर यातायात ${params?.level} है। लगभग ${params?.delay} मिनट की देरी होने का अनुमान है।`,
        noRouteSelected: "यातायात की जाँच करने के लिए आपको पहले एक मार्ग चुनना होगा।",
        departureRecommendation: `समय पर पहुँचने के लिए, मैं आपको ${params?.time} बजे निकलने की सलाह देता हूँ।`,
        noDepartureCalculated: "मैंने अभी तक आपके प्रस्थान का समय नहीं निकाला है। कृपया पहले अपना गंतव्य बताएं।",
        searchingServices: `आपके मार्ग पर आस-पास की ${params?.service || 'सेवाओं'} की खोज की जा रही है।`,
        restStopsPlanned: `मैंने ${params?.count} विश्राम स्थलों की योजना बनाई है। पहला ${params?.distance} किलोमीटर में है।`,
        noRestStopsNeeded: "इस यात्रा के लिए कोई अनिवार्य विश्राम आवश्यक नहीं है, लेकिन यदि आप थकान महसूस करते हैं तो रुकना याद रखें।",
        processingError: "क्षमा करें, आपके अनुरोध को संसाधित करने में मुझे समस्या हुई।",
        micDenied: "माइक्रोफ़ोन एक्सेस अस्वीकार कर दिया गया है।",
        fatigueWarning: "ड्राइवर की थकान की चेतावनी। आप 3 घंटे से अधिक समय से गाड़ी चला रहे हैं। हम 15 से 20 मिनट का ब्रेक लेने की सलाह देते हैं।",
        handsFreeEnabled: "हैंड्स-फ्री मोड सक्रिय। मुझसे बात करने के लिए CHRONA कहें।",
        preparingNavigation: `आपके कार्यक्रम के लिए नेविगेशन तैयार किया जा रहा है: ${params?.title}`,
      },
      'ar': {
        attention: `تنبيه: تم الإبلاغ عن ${params?.type || 'حادث'} على بعد خمسمائة متر.`,
        destination: 'لقد وصلت إلى وجهتك. CHRONA تتمنى لك يوماً سعيداً.',
        recalculating: 'تم اكتشاف تحويلة. جاري إعادة حساب أسرع مسار.',
        turnLeft: 'انعطف يساراً بعد مائتي متر.',
        turnRight: 'انعطف يميناً بعد مائة متر.',
        goStraight: 'استمر في السير لمسافة كيلومتر واحد.',
        calculatingRoute: `مفهوم، جاري حساب أفضل مسار إلى ${params?.destination}.`,
        locationNotFound: `عذراً، لم أتمكن من العثور على الموقع: ${params?.destination}. هل يمكنك أن تكون أكثر تحديداً؟`,
        searchError: `حدثت مشكلة أثناء البحث عن ${params?.destination}. يرجى المحاولة مرة أخرى.`,
        destinationNotUnderstood: "لم أفهم الوجهة. إلى أين تود الذهاب؟",
        trafficReport: `حركة المرور في المسار الحالي ${params?.level}. هناك تأخير يقدر بـ ${params?.delay} دقائق.`,
        noRouteSelected: "يجب عليك أولاً اختيار مسار للتحقق من حركة المرور.",
        departureRecommendation: `للوصول في الوقت المحدد، أنصحك بالمغادرة في تمام الساعة ${params?.time}.`,
        noDepartureCalculated: "لم أحسب وقت مغادرتك بعد. يرجى تحديد وجهتك أولاً.",
        searchingServices: `جاري البحث عن ${params?.service || 'خدمات'} قريبة في مسارك.`,
        restStopsPlanned: `لقد خططت لـ ${params?.count} توقفات للاستراحة. الأول بعد ${params?.distance} كيلومترات.`,
        noRestStopsNeeded: "لا توجد توقفات استراحة إلزامية لهذه الرحلة، ولكن تذكر التوقف إذا شعرت بالتعب.",
        processingError: "عذراً، واجهت مشكلة في معالجة طلبك.",
        micDenied: "تم رفض الوصول إلى الميكروفون.",
        fatigueWarning: "تحذير من تعب السائق. أنت تقود منذ أكثر من 3 ساعات. ننصح بأخذ استراحة لمدة 15 إلى 20 دقيقة.",
        handsFreeEnabled: "تم تفعيل وضع اليدين الحرتين. قل CHRONA للتحدث معي.",
        preparingNavigation: `جاري تحضير الملاحة لفعاليتك: ${params?.title}`,
      }
    };
    
    const baseLang = voiceLanguage.split('-')[0];
    const langGroup = translations[voiceLanguage] || translations[baseLang] || translations['es'];
    return langGroup[key] || translations['es'][key];
  }, [voiceLanguage]);

  const [currentAlert, setCurrentAlert] = useState<{ type: 'success' | 'error' | 'warning' | 'info', message: string } | string | null>(null);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || isMuted) return;
    window.speechSynthesis.cancel(); // Clear queue to avoid accumulation as requested
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLanguage;
    window.speechSynthesis.speak(utterance);
    setCurrentAlert({ type: 'info', message: text });
    setTimeout(() => setCurrentAlert(null), 5000);
  }, [voiceEnabled, voiceLanguage, isMuted]);

  const handleVoiceCommand = async (transcript: string) => {
    if (!transcript || transcript.trim().length < 2) return;
    setIsProcessingVoice(true);
    setVoiceTranscript(transcript);
    try {
      let result = await extractVoiceIntent(transcript, voiceLanguage);
      
      // Fallback for simple destination commands if Gemini is slow or fails
      if (result.intent === 'UNKNOWN' || !result.destination) {
        const lower = transcript.toLowerCase();
        const markers = ['llévame a', 'ir a', 'navegar a', 'dónde queda', 'ruta a', 'quiero ir a', 'take me to', 'go to', 'navigate to', 'where is', 'route to'];
        for (const marker of markers) {
          if (lower.includes(marker)) {
            const dest = lower.split(marker)[1].trim();
            if (dest && dest.length > 2) {
              result = { 
                intent: 'SET_DESTINATION', 
                destination: dest, 
                response: t('calculatingRoute', { destination: dest })
              };
              break;
            }
          }
        }
      }

      if (result.intent === 'UNKNOWN' && transcript.length < 5) {
        // Ignore very short unknown intents to reduce noise
        return;
      }
      speak(result.response);

      switch (result.intent) {
        case 'SET_DESTINATION':
          if (result.destination) {
            setDestQuery(result.destination);
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(result.destination)}`);
              const data = await res.json();
              if (data.length > 0) {
                const loc = { name: data[0].display_name, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                setDestination(loc);
                setDestQuery(loc.name);
                speak(t('calculatingRoute', { destination: result.destination }));
                setTimeout(() => {
                  const searchBtn = document.getElementById('calculate-ai-btn');
                  if (searchBtn) searchBtn.click();
                }, 1000);
              } else {
                speak(t('locationNotFound', { destination: result.destination }));
              }
            } catch (err) {
              speak(t('searchError', { destination: result.destination }));
            }
          } else {
            speak(t('destinationNotUnderstood'));
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Voice command error:", error);
      speak(t('voiceError'));
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const toggleListening = (withGreeting = false) => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speak(t('speechNotSupported'));
      return;
    }

    const startMic = () => {
      const recognition = new SpeechRecognition();
      recognition.lang = voiceLanguage;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessingVoice(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setIsProcessingVoice(false);
        if (event.error !== 'no-speech') {
          speak(t('speechError'));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      try {
        recognition.start();
      } catch (e) {
        console.error("Mic start error:", e);
        setIsListening(false);
        setIsProcessingVoice(false);
      }
    };

    if (withGreeting && voiceEnabled) {
      window.speechSynthesis.cancel();
      setIsProcessingVoice(true);
      const greeting = voiceLanguage.startsWith('es') ? "¿En qué puedo ayudarte?" : "How can I help you?";
      const utterance = new SpeechSynthesisUtterance(greeting);
      utterance.lang = voiceLanguage;
      utterance.onend = () => setTimeout(startMic, 300);
      utterance.onerror = () => {
        setIsProcessingVoice(false);
        startMic();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      startMic();
    }
  };

  // Wake Word Detection (CHRONA)
  useEffect(() => {
    if (!isWakeWordEnabled || isListening || isProcessingVoice) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    let isRunning = false;
    let restartTimeout: any = null;

  const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }
    return matrix[a.length][b.length];
  };

  const startRecognition = () => {
      if (!isWakeWordEnabled || isListening || isProcessingVoice || isRunning) return;
      try {
        recognition.start();
        isRunning = true;
      } catch (e) {
        console.warn("Wake word start failed:", e);
      }
    };

    recognition.onstart = () => {
      setIsWakeWordListening(true);
      setWakeWordTranscript('');
      isRunning = true;
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        // Check all alternatives for the wake word
        const alternatives = Array.from(event.results[i]);
        
        for (const alt of alternatives as any[]) {
          const transcript = alt.transcript.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
          const confidence = alt.confidence;
          
          // Update debug transcript with the best alternative
          if (alt === alternatives[0]) {
            setWakeWordTranscript(transcript);
          }
          
          // In noisy environments, confidence might be low. 
          // We allow lower confidence if the transcript is very short (likely just the wake word)
          if (confidence < 0.05 && transcript.length < 4) continue;
          if (confidence < 0.1 && transcript.length >= 4) continue;
          
          // Check for "CHRONA" or common phonetic variations across different languages
          const wakeWords = [
            // Main wake words
            'asistente', 'asistenta', 'assistant', 'assistente', 'asistent', 'asist', 'asis', 'asiste', 'asisti',
            'hey asistente', 'ok asistente', 'hola asistente', 'oye asistente',
            'hey assistant', 'ok assistant', 'hello assistant',
            
            // Natural phrases
            'hey chrona', 'ok chrona', 'hola chrona', 'oye chrona', 'escucha chrona', 'atención chrona',
            'hey crona', 'ok crona', 'hola crona', 'oye crona', 'escucha crona', 'atención crona',
            'hey krona', 'ok krona', 'hola krona', 'oye krona',
            
            // Ultra-simple sounds (common mispronunciations)
            'ona', 'rona', 'cron', 'chron', 'crona', 'krona', 'chrono', 'crono', 'hrona', 'jrona',
            'chruna', 'chruno', 'chona', 'chora', 'crhona', 'corona', 'clona', 'trona',
            
            // Functional alternatives
            'navegador', 'ayuda chrona', 'ayuda crona', 'navega', 'conducir',
            
            // Latin variations
            'chrona', 'crona', 'krona', 'chrono', 'crono', 'hrona', 'jrona',
            'chruna', 'chruno', 'chona', 'chora', 'crhona', 'corona', 'clona', 'trona', 'crónica', 'cronica', 'cron', 'chron',
            'brona', 'grona', 'cronos', 'chronos', 'croa', 'rona', 'croma', 'roma', 'zona', 'lona', 'mona',
            'crone', 'croni', 'cronu', 'chone', 'choni', 'chonu', 'hrona', 'hrono', 'hrona',
            'coron', 'coro', 'coroa', 'corone', 'coroni', 'coronu', 'cron a', 'chron a', 'kron a',
            'hola crona', 'oye crona', 'hey crona', 'ok crona', 'escucha crona', 'atención crona',
            'llona', 'yona', 'shrona', 'xrona', 'grona', 'prona', 'drona', 'croacia', 'cráneo', 'craneo',
            'cloro', 'claro', 'clara', 'globa', 'gloria', 'cronas', 'chronas',
            
            // Chinese (Mandarin) variations
            '克罗娜', '克洛娜', '科罗娜', '克罗那', '克隆纳', '克罗',
            
            // Japanese variations
            'クロナ', 'クローナ', 'くろな', 'くろーな',
            
            // Korean variations
            '크로나', '클로나',
            
            // Arabic variations
            'كرونا', 'كورونا',
            
            // Hindi variations
            'क्रोना', 'क्रोना',
            
            // Russian variations
            'крона', 'хрона'
          ];
          
          const words = transcript.split(/\s+/);
          const detectedWord = wakeWords.find(word => {
            // 1. Exact word boundary match
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            if (regex.test(transcript)) return true;
            
            // 2. Ends with the word
            if (transcript.trim().endsWith(word)) return true;
  
            // 3. Fuzzy check for each word in transcript
            return words.some(w => {
              if (w.length < 3) return false; // Even more permissive for short words
              const threshold = w.length >= 6 ? 2 : 1;
              const distance = getLevenshteinDistance(w.toLowerCase(), word.toLowerCase());
              
              // Special "boost" for words starting with similar sounds
              const startsWithC = w.toLowerCase().startsWith('c') || w.toLowerCase().startsWith('k') || w.toLowerCase().startsWith('ch');
              const startsWithA = w.toLowerCase().startsWith('asist');
              const finalThreshold = (startsWithC || startsWithA) ? threshold + 1 : threshold;
              
              return distance <= finalThreshold;
            });
          });
          
          if (detectedWord) {
            console.log("Wake word DETECTED in alternative:", transcript, "Confidence:", confidence);
            
            // Extract potential command after wake word
            let commandAfterWakeWord = '';
            const index = transcript.indexOf(detectedWord);
            commandAfterWakeWord = transcript.substring(index + detectedWord.length).trim();
  
            recognition.stop();
            isRunning = false;
            
            // Visual feedback
            setIsWakeWordListening(false);
            setShowWakeWordFlash(true);
            setWakeWordTranscript(commandAfterWakeWord ? `¡Escuchado! -> ${commandAfterWakeWord}` : '¡Asistente detectado!');
            setTimeout(() => setShowWakeWordFlash(false), 500);
            
            // Audio feedback
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
              osc.start();
              osc.stop(ctx.currentTime + 0.2);
            } catch (e) {}
            
            if (commandAfterWakeWord.length > 2) {
              handleVoiceCommand(commandAfterWakeWord);
            } else {
              setTimeout(() => {
                if (isWakeWordEnabled && !isListening && !isProcessingVoice) {
                  toggleListening(true);
                }
              }, 300);
            }
            return; // Exit both loops
          }
        }
      }
    };

    recognition.onend = () => {
      setIsWakeWordListening(false);
      isRunning = false;
      
      if (isWakeWordEnabled && !isListening && !isProcessingVoice) {
        // Clear any existing timeout
        if (restartTimeout) clearTimeout(restartTimeout);
        
        // Add a delay to avoid rapid-fire restarts which can cause errors
        restartTimeout = setTimeout(() => {
          startRecognition();
        }, 500);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.error("Wake word error:", event.error);
      }
      setIsWakeWordListening(false);
      isRunning = false;
      
      if (event.error === 'not-allowed') {
        setIsWakeWordEnabled(false);
        speak(t('micDenied'));
      } else if (event.error === 'network' || event.error === 'no-speech' || event.error === 'aborted' || event.error === 'audio-capture') {
        // Silent retry on these errors is handled by onend
      }
    };

    startRecognition();

    return () => {
      if (restartTimeout) clearTimeout(restartTimeout);
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.onstart = null;
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [isWakeWordEnabled, isListening, isProcessingVoice, voiceLanguage]);

  const handleConnectWeather = () => {
    setIsConnectingWeather(true);
    setTimeout(() => {
      setIsWeatherConnected(true);
      setIsConnectingWeather(false);
    }, 2000);
  };
  const [activeTab, setActiveTab] = useState<'nav' | 'incidents' | 'social' | 'garage' | 'weather' | 'rewards' | 'calendar' | 'history' | 'profile'>('nav');
  
  // Firebase Auth & Profile State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [welcomeBackMessage, setWelcomeBackMessage] = useState({ title: '', body: '', emoji: '' });

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          const now = new Date();
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data);
            
            // Handle Welcome and Welcome Back Modals
            if (!data.welcomeModalSeen) {
              setShowWelcomeModal(true);
            } else if (data.lastActiveAt) {
              const lastActive = new Date(data.lastActiveAt);
              const diffTime = Math.abs(now.getTime() - lastActive.getTime());
              const diffDays = diffTime / (1000 * 60 * 60 * 24);
              
              if (diffDays > 2) {
                const messages = [
                  { title: "¡Qué alegría verte de nuevo!", body: "El planeta y nosotros te extrañábamos. ¿Listo para otra ruta sostenible?", emoji: "🌿" },
                  { title: "¡Hola otra vez!", body: "Tus viajes inteligentes hacen la diferencia. ¡Sigamos reduciendo esa huella de carbono juntos!", emoji: "🌍" },
                  { title: "¡Te echábamos de menos!", body: "Cada viaje cuenta para cuidar nuestra ciudad. ¡Qué bueno que volviste a CHRONA!", emoji: "💚" },
                  { title: "¡Bienvenido de vuelta!", body: "El aire se siente más limpio cuando eliges moverte de forma inteligente. ¿A dónde vamos hoy?", emoji: "🍃" },
                  { title: "¡Qué milagro!", body: "Las calles te extrañaban. Sigamos sumando kilómetros verdes y cuidando nuestro entorno.", emoji: "✨" }
                ];
                const randomMsg = messages[Math.floor(Math.random() * messages.length)];
                setWelcomeBackMessage(randomMsg);
                setShowWelcomeBackModal(true);
              }
            }
            
            // Update lastActiveAt
            await updateDoc(userDocRef, { lastActiveAt: now.toISOString() });
          } else {
            const newProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'CHRONA Explorer',
              email: currentUser.email,
              points: 100, // Starting points
              savedLocations: [],
              preferredTransport: 'car',
              recurringSchedules: [],
              badges: ['flex'], // Initial badge
              welcomeEmailSent: false,
              welcomeModalSeen: false,
              lastActiveAt: now.toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
            setShowWelcomeModal(true);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setUserProfile(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Leaderboard Effect
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        name: doc.data().displayName,
        points: doc.data().points,
        rank: index + 1,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.data().displayName}`
      }));
      setLeaderboard(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, [user]);

  // Points awarding function
  const awardPoints = async (amount: number, reason: string) => {
    const multiplier = selectedCarType?.stats?.points || 1;
    const finalAmount = Math.round(amount * multiplier);
    
    if (!user || !userProfile) {
      // Still update local state for non-logged in users (demo mode)
      setUserPoints(prev => prev + finalAmount);
      setVirtualBalance(prev => prev + finalAmount);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const newPoints = (userProfile.points || 0) + finalAmount;
    try {
      await updateDoc(userDocRef, { points: newPoints });
      setUserProfile((prev: any) => ({ ...prev, points: newPoints }));
      setUserPoints(newPoints);
      setVirtualBalance(prev => prev + finalAmount); // CHRONA Coins are separate? Or same? Let's keep them synced for now.
      
      setCurrentAlert({
        type: 'success',
        message: `¡Ganaste ${finalAmount} puntos por ${reason}! Total: ${newPoints}`
      });
      setTimeout(() => setCurrentAlert(null), 5000);
      
      // Check for badges after awarding points
      checkBadges();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleCloseWelcomeModal = async () => {
    setShowWelcomeModal(false);
    setIsWakeWordEnabled(true); // Enable wake word automatically
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userDocRef, { welcomeModalSeen: true });
        setUserProfile((prev: any) => ({ ...prev, welcomeModalSeen: true }));
      } catch (error) {
        console.error("Error updating welcome modal status:", error);
      }
    }
  };

  const handleCloseWelcomeBackModal = () => {
    setShowWelcomeBackModal(false);
    setIsWakeWordEnabled(true); // Enable wake word automatically
  };

  // Play welcome sound
  useEffect(() => {
    if (showWelcomeModal) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play blocked:", e));
    }
  }, [showWelcomeModal]);

  // Confetti Component
  const Confetti = () => {
    const pieces = useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20,
      size: Math.random() * 10 + 5,
      color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 2,
      rotation: Math.random() * 360
    })), []);

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {pieces.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: `${p.x}%`, y: '-10%', opacity: 1, rotate: 0 }}
            animate={{ 
              y: '110%', 
              opacity: 0,
              rotate: p.rotation + 360
            }}
            transition={{ 
              duration: p.duration, 
              delay: p.delay,
              ease: "linear",
              repeat: Infinity
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px'
            }}
          />
        ))}
      </div>
    );
  };
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(MOCK_CALENDAR_EVENTS);
  const [tripHistory, setTripHistory] = useState<TripRecord[]>(MOCK_TRIP_HISTORY);
  const [tripStartTime, setTripStartTime] = useState<number | null>(null);
  const [userPoints, setUserPoints] = useState(450);
  const [userBadges, setUserBadges] = useState<Badge[]>([BADGES[0]]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, title: string, body: string, type: 'traffic' | 'reward' | 'badge', timestamp: number}[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState(Date.now());
  const [alternativeRouteCount, setAlternativeRouteCount] = useState(0);

  // Profile Form States
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [showAddLocation, setShowAddLocation] = useState(false);
  
  const [newScheduleDay, setNewScheduleDay] = useState('Lunes');
  const [newScheduleTime, setNewScheduleTime] = useState('08:00');
  const [newScheduleLabel, setNewScheduleLabel] = useState('');
  const [showAddSchedule, setShowAddSchedule] = useState(false);

  const handleAddLocation = async () => {
    if (!user || !userProfile || !newLocationName || !newLocationAddress) return;
    const userDocRef = doc(db, 'users', user.uid);
    const updatedLocations = [...(userProfile.savedLocations || []), { name: newLocationName, address: newLocationAddress }];
    try {
      await updateDoc(userDocRef, { savedLocations: updatedLocations });
      setUserProfile((prev: any) => ({ ...prev, savedLocations: updatedLocations }));
      setNewLocationName('');
      setNewLocationAddress('');
      setShowAddLocation(false);
      awardPoints(10, 'guardar una ubicación');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAddSchedule = async () => {
    if (!user || !userProfile || !newScheduleLabel) return;
    const userDocRef = doc(db, 'users', user.uid);
    const updatedSchedules = [...(userProfile.recurringSchedules || []), { day: newScheduleDay, time: newScheduleTime, label: newScheduleLabel }];
    try {
      await updateDoc(userDocRef, { recurringSchedules: updatedSchedules });
      setUserProfile((prev: any) => ({ ...prev, recurringSchedules: updatedSchedules }));
      setNewScheduleLabel('');
      setShowAddSchedule(false);
      awardPoints(15, 'configurar un horario recurrente');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };
  const [offPeakTravelCount, setOffPeakTravelCount] = useState(0);
  const [offPeakMorningCount, setOffPeakMorningCount] = useState(0);
  const [offPeakNightCount, setOffPeakNightCount] = useState(0);
  const [streakCount, setStreakCount] = useState(3); // Start with 3 for demo
  const [incidentReportCount, setIncidentReportCount] = useState(0);
  const [virtualBalance, setVirtualBalance] = useState(100);
  const [selectedCarType, setSelectedCarType] = useState<CarType>(CAR_TYPES[0]);
  const [unlockedCarIds, setUnlockedCarIds] = useState<string[]>(['classic']);
  const [streakDays, setStreakDays] = useState(19); // Start at 19 for demo purposes
  const [simulatedCarsCount, setSimulatedCarsCount] = useState(10);
  const [isSimulatingDistribution, setIsSimulatingDistribution] = useState(false);
  const [simulatedVehicles, setSimulatedVehicles] = useState<{ id: string, routeId: string, position: [number, number], rotation: number, progress: number, carType: CarType }[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  
  const addNotification = useCallback((title: string, body: string, type: 'traffic' | 'reward' | 'badge') => {
    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      body,
      type,
      timestamp: Date.now()
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 10)); // Keep last 10
    
    // Browser notification if permitted
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
    
    // Show a small toast for the notification
    setCurrentAlert({
      type: 'info',
      message: `${title}: ${body}`
    });
    setTimeout(() => setCurrentAlert(null), 5000);
  }, []);

  // Real-time Notification Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // 15% chance every 20 seconds to get a traffic alert
      if (Math.random() > 0.85) {
        const trafficAlerts = [
          { title: "Accidente en Ruta", body: "Se reporta un choque leve 2km adelante en tu ruta actual. ¿Deseas recalcular?", type: 'traffic' as const },
          { title: "Cierre de Vía", body: "Obras de mantenimiento en la Av. Principal. Se recomienda desvío.", type: 'traffic' as const },
          { title: "Tráfico Pesado", body: "Congestión inusual detectada. Ahorra 10 min tomando la ruta alterna.", type: 'traffic' as const },
          { title: "Evento en la Vía", body: "Maratón local detectada. Varias calles cerradas en el centro.", type: 'traffic' as const },
          { title: "Clima Adverso", body: "Lluvia intensa reportada adelante. Reduce la velocidad.", type: 'traffic' as const }
        ];
        const alert = trafficAlerts[Math.floor(Math.random() * trafficAlerts.length)];
        addNotification(alert.title, alert.body, alert.type);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [addNotification]);

  // Calculate optimal departure times for calendar events
  useEffect(() => {
    const updateDepartureTimes = async () => {
      const updatedEvents = await Promise.all(calendarEvents.map(async (event) => {
        if (event.location && !event.suggestedDeparture) {
          // Find location coordinates
          const loc = MOCK_LOCATIONS.find(l => l.name === event.location) || MOCK_LOCATIONS[0];
          
          // Simulate a travel time calculation (in a real app, this would use the routing service)
          const travelTime = 25 + Math.floor(Math.random() * 20); // 25-45 mins
          
          const eventTimeParts = event.time.split(':');
          const eventDate = new Date(event.date);
          eventDate.setHours(parseInt(eventTimeParts[0]), parseInt(eventTimeParts[1]), 0);
          
          const departureDate = new Date(eventDate.getTime() - (travelTime + 10) * 60000); // travelTime + 10 min buffer
          const suggestedTime = `${departureDate.getHours().toString().padStart(2, '0')}:${departureDate.getMinutes().toString().padStart(2, '0')}`;
          
          return {
            ...event,
            suggestedDeparture: suggestedTime,
            estimatedTravelTime: travelTime
          };
        }
        return event;
      }));
      
      // Only update if something changed to avoid infinite loop
      if (JSON.stringify(updatedEvents) !== JSON.stringify(calendarEvents)) {
        setCalendarEvents(updatedEvents);
      }
    };

    updateDepartureTimes();
  }, [calendarEvents]);

  // Check for upcoming departure notifications
  useEffect(() => {
    const checkDepartures = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDate = now.toISOString().split('T')[0];

      calendarEvents.forEach(event => {
        if (event.date === currentDate && event.suggestedDeparture === currentTime) {
          addNotification(
            "Hora de Salir", 
            `Es el momento óptimo para salir hacia "${event.title}". Tiempo estimado: ${event.estimatedTravelTime} min.`,
            'traffic'
          );
        }
      });
    };

    const interval = setInterval(checkDepartures, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [calendarEvents, addNotification]);

  const checkBadges = useCallback(() => {
    const newBadges: Badge[] = [...userBadges];
    let earnedNew = false;

    // Badge: Campeón de Rutas Flexibles (10 alternative routes)
    if (alternativeRouteCount >= 10 && !userBadges.find(b => b.id === 'flex')) {
      newBadges.push(BADGES[0]);
      earnedNew = true;
      addNotification("¡Nuevo Logro!", "Has ganado la medalla: Campeón de Rutas Flexibles", 'badge');
    }

    // Badge: Guardián del Tráfico (5 reports)
    if (incidentReportCount >= 5 && !userBadges.find(b => b.id === 'helper')) {
      newBadges.push(BADGES[2]);
      earnedNew = true;
      addNotification("¡Nuevo Logro!", "Has ganado la medalla: Guardián del Tráfico", 'badge');
    }

    // Badge: Madrugador CHRONA (5 morning off-peak)
    if (offPeakMorningCount >= 5 && !userBadges.find(b => b.id === 'early')) {
      newBadges.push(BADGES[3]);
      earnedNew = true;
      addNotification("¡Nuevo Logro!", "Has ganado la medalla: Madrugador CHRONA", 'badge');
    }

    // Badge: Búho de la Ruta (5 night off-peak)
    if (offPeakNightCount >= 5 && !userBadges.find(b => b.id === 'night')) {
      newBadges.push(BADGES[4]);
      earnedNew = true;
      addNotification("¡Nuevo Logro!", "Has ganado la medalla: Búho de la Ruta", 'badge');
    }

    // Badge: Racha Imparable (7 day streak)
    if (streakCount >= 7 && !userBadges.find(b => b.id === 'streak')) {
      newBadges.push(BADGES[5]);
      earnedNew = true;
      addNotification("¡Nuevo Logro!", "Has ganado la medalla: Racha Imparable", 'badge');
    }

    if (earnedNew) {
      setUserBadges(newBadges);
    }
  }, [alternativeRouteCount, incidentReportCount, offPeakMorningCount, offPeakNightCount, streakCount, userBadges, addNotification]);

  useEffect(() => {
    checkBadges();
  }, [alternativeRouteCount, incidentReportCount, checkBadges]);

  // Navigation simulation state
  const [carPosition, setCarPosition] = useState<[number, number] | null>(null);
  const [carRotation, setCarRotation] = useState(0);
  const [lastSpokenIndex, setLastSpokenIndex] = useState(-1);

  // Update car position during navigation with interpolation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isNavigating && selectedRoute && currentRouteIndex < selectedRoute.coordinates.length - 1) {
      const speedInterval = Math.max(50, 500 - (selectedCarType.stats.speed * 40));
      let step = 0;
      const subSteps = 10;

      interval = setInterval(() => {
        const current = selectedRoute.coordinates[currentRouteIndex];
        const next = selectedRoute.coordinates[currentRouteIndex + 1];
        
        if (step < subSteps) {
          const progress = step / subSteps;
          const lat = current[0] + (next[0] - current[0]) * progress;
          const lng = current[1] + (next[1] - current[1]) * progress;
          setCarPosition([lat, lng]);
          
          const angle = Math.atan2(next[1] - current[1], next[0] - current[0]) * (180 / Math.PI);
          setCarRotation(angle + 90);
          
          // Check for incidents ahead (within 5 segments)
          const lookAhead = 5;
          for (let i = 1; i <= lookAhead; i++) {
            const futureIdx = currentRouteIndex + i;
            if (futureIdx < selectedRoute.coordinates.length) {
              const futurePos = selectedRoute.coordinates[futureIdx];
              const nearbyIncident = incidents.find(inc => {
                const dist = Math.sqrt(Math.pow(inc.lat - futurePos[0], 2) + Math.pow(inc.lng - futurePos[1], 2));
                return dist < 0.005; // Roughly 500m
              });
              
              if (nearbyIncident && step === 0) {
                speak(t('attention', { type: nearbyIncident.type }));
                addNotification(
                  `Alerta de ${nearbyIncident.type}`,
                  `Se reporta un incidente a unos 500m adelante. Mantén la precaución.`,
                  'traffic'
                );
              }
            }
          }

          step++;
        } else {
          setCurrentRouteIndex(prev => prev + 1);
          step = 0;
          
          // Voice instructions for turns (simulated)
          // We trigger the instruction a few segments BEFORE the "turn" point
          // to simulate the "20 seconds before" request in our accelerated time.
          const maneuverInterval = 20;
          const warningOffset = 4; // Warn 4 segments before the turn
          
          const nextManeuverIndex = Math.ceil((currentRouteIndex + 1) / maneuverInterval) * maneuverInterval;
          const distanceToManeuver = nextManeuverIndex - currentRouteIndex;
          
          if (distanceToManeuver === warningOffset && step === 0 && lastSpokenIndex !== nextManeuverIndex) {
            const directions = [t('turnLeft'), t('turnRight'), t('goStraight')];
            speak(directions[Math.floor(Math.random() * directions.length)]);
            setLastSpokenIndex(nextManeuverIndex);
          }
        }
      }, speedInterval / subSteps);
    } else if (isNavigating && selectedRoute && currentRouteIndex >= selectedRoute.coordinates.length - 1) {
      setIsNavigating(false);
      speak(t('destination'));
      awardPoints(50, 'completar tu viaje');
      
      // Record trip in history
      if (tripStartTime && selectedRoute) {
        const endTime = Date.now();
        const newTrip: TripRecord = {
          id: `trip-${Math.random().toString(36).substr(2, 9)}`,
          startTime: tripStartTime,
          endTime: endTime,
          startLocation: originQuery || 'Ubicación Actual',
          endLocation: destQuery || 'Destino',
          distance: selectedRoute.distance,
          duration: Math.round((endTime - tripStartTime) / 60000),
          routeId: selectedRoute.id,
          date: new Date().toISOString().split('T')[0]
        };
        setTripHistory(prev => [newTrip, ...prev]);
        setTripStartTime(null);
      }
    }
    return () => clearInterval(interval);
  }, [isNavigating, selectedRoute, currentRouteIndex, selectedCarType, incidents, speak, lastSpokenIndex, awardPoints]);

  // Reset navigation when route changes
  useEffect(() => {
    setIsNavigating(false);
    setCurrentRouteIndex(0);
    setLastSpokenIndex(-1);
    if (selectedRoute && selectedRoute.coordinates.length > 0) {
      setCarPosition(selectedRoute.coordinates[0]);
    } else {
      setCarPosition(null);
    }
  }, [selectedRoute]);

  // Simulation of multiple cars distribution
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulatingDistribution && routes.length > 0) {
      // Initialize or re-initialize vehicles if count changed or empty
      if (simulatedVehicles.length !== simulatedCarsCount) {
        const newVehicles = [];
        for (let i = 0; i < simulatedCarsCount; i++) {
          // Distribute across routes strictly: i % routes.length
          const routeIndex = i % routes.length;
          const route = routes[routeIndex];
          const randomCarType = CAR_TYPES[Math.floor(Math.random() * CAR_TYPES.length)];
          
          newVehicles.push({
            id: `sim-${i}-${Date.now()}`,
            routeId: route.id,
            position: route.coordinates[0],
            rotation: 0,
            progress: Math.random(), // Start at random positions for better visual distribution
            carType: randomCarType
          });
        }
        setSimulatedVehicles(newVehicles);
      }

      interval = setInterval(() => {
        setSimulatedVehicles(prev => prev.map(vehicle => {
          const route = routes.find(r => r.id === vehicle.routeId);
          if (!route) return vehicle;

          // Speed varies slightly per car type
          const speedFactor = 0.002 * (vehicle.carType.stats.speed / 5);
          let nextProgress = vehicle.progress + speedFactor;
          
          if (nextProgress >= 1) {
            nextProgress = 0;
          }

          const coordIndex = Math.floor(nextProgress * (route.coordinates.length - 1));
          const currentCoord = route.coordinates[coordIndex];
          const nextCoord = route.coordinates[Math.min(coordIndex + 1, route.coordinates.length - 1)];
          
          const angle = Math.atan2(nextCoord[1] - currentCoord[1], nextCoord[0] - currentCoord[0]) * (180 / Math.PI);

          return {
            ...vehicle,
            progress: nextProgress,
            position: currentCoord,
            rotation: angle + 90
          };
        }));
      }, 50);
    } else if (!isSimulatingDistribution && simulatedVehicles.length > 0) {
      setSimulatedVehicles([]);
    }
    return () => clearInterval(interval);
  }, [isSimulatingDistribution, routes, simulatedCarsCount, simulatedVehicles.length]);

  // Continuous driving detection
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isNavigating) {
      interval = setInterval(() => {
        setContinuousDrivingTime(prev => {
          const next = prev + 1;
          if (next >= 180 && !showFatigueWarning) { // 3 hours
            setShowFatigueWarning(true);
            speak(t('fatigueWarning'));
          }
          return next;
        });
      }, 60000); // Every minute
    } else {
      setContinuousDrivingTime(0);
      setShowFatigueWarning(false);
    }
    return () => clearInterval(interval);
  }, [isNavigating, showFatigueWarning]);

  // Get current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        
        // Reverse geocode to get a name for the current location
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const locationName = data.display_name || "Tu ubicación actual";
          const loc = { name: locationName, lat: latitude, lng: longitude };
          setOrigin(loc);
          setOriginQuery(locationName);
        } catch (e) {
          const loc = { name: "Tu ubicación actual", lat: latitude, lng: longitude };
          setOrigin(loc);
          setOriginQuery("Tu ubicación actual");
        }
      });
    }
  }, []);

  const handleSearch = async () => {
    if (!origin || !destination) return;
    
    // Check if arrival time has passed
    const now = new Date();
    const [hours, minutes] = arrivalTime.split(':').map(Number);
    const arrivalDate = new Date();
    arrivalDate.setHours(hours, minutes, 0, 0);

    if (arrivalDate < now) {
      setTimeWarning("¡Oh, cielos! ✨ Parece que esa hora ya se nos escapó por hoy. ¿Qué tal si buscamos una nueva aventura para más tarde? El tiempo vuela cuando planeamos viajes increíbles.");
      return;
    } else {
      setTimeWarning(null);
    }
    
    setIsSearching(true);
    try {
      const allRoutes = await fetchAllRoutes(origin, destination);
      
      // Distribution logic: Better cars get "Optimized" routes assigned by CHRONA
      const efficiency = selectedCarType.stats.efficiency;
      let finalRoutes = allRoutes;
      
      if (efficiency > 7) {
        // High efficiency cars get "Priority Lanes" (simulated by slightly better routes)
        finalRoutes = finalRoutes.map(r => ({
          ...r,
          duration: Math.round(r.duration * 0.8),
          distance: r.distance - 0.5
        }));
      }

      setRoutes(finalRoutes);
      setSelectedRoute(finalRoutes[0]);
      
      // Check for heavy traffic on the best route
      if (finalRoutes[0].trafficLevel === 'high') {
        setIsTrafficWarningVisible(true);
      } else {
        setIsTrafficWarningVisible(false);
      }

      // Points for choosing off-peak (simulated by checking if arrival time is between 10am-4pm or after 8pm)
      const isOffPeak = (hours >= 10 && hours <= 16) || hours >= 20 || hours <= 7;
      if (isOffPeak) {
        awardPoints(30, 'viajar en horario eficiente');
        setOffPeakTravelCount(prev => prev + 1);
        
        if (hours <= 7) setOffPeakMorningCount(prev => prev + 1);
        if (hours >= 20) setOffPeakNightCount(prev => prev + 1);

        setCurrentAlert({
          type: 'success',
          message: "¡Bono de Hora Valle! +30 pts por viajar en horario eficiente."
        });
        setTimeout(() => setCurrentAlert(null), 3000);
      }

    } catch (error) {
      console.error("Error in handleSearch:", error);
    } finally {
      setIsSearching(false);
    }

    // Get Advanced Prediction
    setIsLoadingPrediction(true);
    const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const weatherWithTemp = weatherData ? `${weather} (${weatherData.temp}°C)` : weather;
    const res = await predictTravelTime(origin.name, destination.name, arrivalTime, weatherWithTemp, currentTimeStr, isWeatherConnected);
    setPrediction(res);
    setIsLoadingPrediction(false);
    
    // Reward points for searching
    awardPoints(10, 'buscar una ruta');
  };

  const handleReportIncident = (lat: number, lng: number) => {
    const newIncident: Incident = {
      id: Math.random().toString(36).substr(2, 9),
      type: reportType,
      description: reportDesc || `Reported ${reportType}`,
      lat,
      lng,
      confirmations: 0,
      reportedBy: "You",
      timestamp: Date.now()
    };
    setIncidents(prev => [...prev, newIncident]);
    setIsReporting(false);
    setReportDesc('');
    setIncidentReportCount(prev => prev + 1);
    awardPoints(50, 'reportar un incidente'); // Big reward for reporting
    addNotification("Incidente Reportado", `Tu reporte de ${reportType} ha sido enviado a la comunidad. +50 pts.`, 'reward');
    
    // Simulate notification
    if (Notification.permission === "granted") {
      new Notification("CHRONA Alert", { body: `New ${reportType} reported near your area!` });
    }
  };

  const confirmIncident = (id: string) => {
    setIncidents(prev => prev.map(inc => 
      inc.id === id ? { ...inc, confirmations: inc.confirmations + 1 } : inc
    ));
    awardPoints(5, 'confirmar un incidente');
  };

  const mapCenter = useMemo(() => {
    if (origin) return [origin.lat, origin.lng] as [number, number];
    if (userLocation) return userLocation;
    return [4.6097, -74.0817] as [number, number]; // Bogotá Default (more relevant for Spanish users)
  }, [origin, userLocation]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl"
          >
            <Confetti />
            <motion.div
              initial={{ scale: 0.8, y: 40, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, y: 40, opacity: 0, rotate: 2 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="bg-white rounded-[48px] p-10 max-w-md w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden text-center border border-white/20"
            >
              {/* Animated Background Elements */}
              <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent"></div>
              
              <motion.div 
                animate={{ 
                  scale: [1, 1.3, 1],
                  x: [0, 20, 0],
                  y: [0, -20, 0]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px]"
              ></motion.div>
              
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  x: [0, -30, 0],
                  y: [0, 30, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-[80px]"
              ></motion.div>

              {/* Decorative Floating Icons */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-12 left-8 text-emerald-500/30"
              >
                <MapPin size={32} />
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-24 right-12 text-amber-500/30"
              >
                <Navigation size={28} />
              </motion.div>

              {/* Icon / Avatar Container */}
              <div className="relative mb-10">
                <motion.div
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 6, scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[40px] mx-auto flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)]"
                >
                  <motion.div
                    animate={{ 
                      rotate: [-8, 8, -8],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Trophy size={64} className="text-white drop-shadow-lg" />
                  </motion.div>
                </motion.div>
                
                <motion.div 
                  initial={{ scale: 0, x: 20 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="absolute -bottom-4 right-[calc(50%-70px)] w-14 h-14 bg-amber-400 rounded-3xl flex items-center justify-center text-white shadow-xl border-4 border-white"
                >
                  <Zap size={28} fill="currentColor" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="space-y-4 relative">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                    ¡Hola, <span className="text-emerald-600">{user?.displayName?.split(' ')[0] || 'Explorador'}</span>!
                  </h2>
                  <div className="h-1.5 w-20 bg-emerald-500/20 rounded-full mx-auto mb-6"></div>
                </motion.div>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-slate-500 font-semibold text-lg leading-relaxed px-2"
                >
                  ¡Tu aventura en <span className="text-slate-900">CHRONA</span> comienza hoy! Prepárate para viajar de forma inteligente. 🗺️🎒
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="pt-6"
                >
                  <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-[32px] border border-slate-100 text-left shadow-inner flex items-center gap-4 group hover:border-emerald-200 transition-colors">
                    <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-[0_8px_16px_-4px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform">
                      <Coins size={28} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Bono Inicial</p>
                      <p className="text-xl font-black text-slate-900">+100 CHRONA Coins</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Action */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                onClick={handleCloseWelcomeModal}
                className="mt-10 w-full bg-slate-900 text-white font-black py-5 rounded-[24px] shadow-[0_20px_40px_-12px_rgba(15,23,42,0.4)] hover:bg-emerald-600 hover:shadow-[0_20px_40px_-12px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3 group text-lg uppercase tracking-wider"
              >
                ¡Empezar Aventura!
                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </motion.button>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-6 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={14} className="text-emerald-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  CHRONA Systems v1.0
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Back Modal */}
      <AnimatePresence>
        {showWelcomeBackModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40, opacity: 0, rotate: 2 }}
              animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, y: 40, opacity: 0, rotate: -2 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="bg-white rounded-[48px] p-10 max-w-md w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden text-center border border-white/20"
            >
              {/* Animated Background Elements */}
              <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent"></div>
              
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px]"
              ></motion.div>

              {/* Icon Container */}
              <div className="relative mb-8">
                <motion.div
                  initial={{ rotate: 20, scale: 0 }}
                  animate={{ rotate: -6, scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[32px] mx-auto flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)]"
                >
                  <motion.div
                    animate={{ 
                      y: [-5, 5, -5],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="text-6xl drop-shadow-lg"
                  >
                    {welcomeBackMessage.emoji}
                  </motion.div>
                </motion.div>
              </div>

              {/* Content */}
              <div className="space-y-4 relative">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                    {welcomeBackMessage.title}
                  </h2>
                  <div className="h-1.5 w-16 bg-emerald-500/20 rounded-full mx-auto mb-6"></div>
                </motion.div>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-slate-500 font-semibold text-lg leading-relaxed px-2"
                >
                  {welcomeBackMessage.body}
                </motion.p>
              </div>

              {/* Action */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={handleCloseWelcomeBackModal}
                className="mt-10 w-full bg-emerald-500 text-white font-black py-5 rounded-[24px] shadow-[0_20px_40px_-12px_rgba(16,185,129,0.4)] hover:bg-emerald-600 hover:shadow-[0_20px_40px_-12px_rgba(16,185,129,0.6)] transition-all active:scale-95 flex items-center justify-center gap-3 group text-lg uppercase tracking-wider"
              >
                ¡Vamos!
                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wake Word Flash Overlay */}
      <AnimatePresence>
        {showWakeWordFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-emerald-400 z-[9999] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Voice Assistant Floating Button */}
      <div className="fixed bottom-8 right-8 z-[5000] flex flex-col items-end gap-4">
        <AnimatePresence>
          {(isListening || isProcessingVoice || (isWakeWordEnabled && isWakeWordListening)) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-200 w-64 mb-2"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: (isListening || isProcessingVoice) ? [4, 12, 4] : [4, 6, 4],
                        opacity: (isListening || isProcessingVoice) ? 1 : 0.5
                      }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                      className={cn(
                        "w-1.5 rounded-full",
                        (isListening || isProcessingVoice) ? "bg-emerald-500" : "bg-slate-400"
                      )}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  {isProcessingVoice ? 'Analizando...' : isListening ? 'Escuchando...' : 'Asistente listo'}
                  {!isListening && !isProcessingVoice && isWakeWordEnabled && isWakeWordListening && (
                    <motion.div 
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                    />
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-600 italic">
                {isProcessingVoice 
                  ? 'Procesando tu solicitud...' 
                  : isListening 
                    ? (voiceTranscript || '“Te escucho... ¿A dónde vamos?”')
                    : (wakeWordTranscript ? `Escuché: "${wakeWordTranscript}"` : 'Di "Asistente" para hablar conmigo')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
              if (!SpeechRecognition) {
                alert("Tu navegador no soporta el reconocimiento de voz en segundo plano (Wake Word). Por favor usa Chrome o Edge.");
                return;
              }
              if (!isWakeWordEnabled) {
                speak(t('handsFreeEnabled'));
              }
              setIsWakeWordEnabled(!isWakeWordEnabled);
            }}
            className={cn(
              "w-12 h-12 rounded-full flex flex-col items-center justify-center shadow-xl transition-all border-2 relative",
              isWakeWordEnabled ? "bg-emerald-500 border-emerald-200 text-white" : "bg-white border-slate-200 text-slate-400"
            )}
            title={isWakeWordEnabled ? "Desactivar palabra de activación 'Asistente'" : "Activar palabra de activación 'Asistente'"}
          >
            {isWakeWordEnabled && isWakeWordListening && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-emerald-400 rounded-full -z-10"
              />
            )}
            <span className="text-[8px] font-bold leading-none mb-0.5">WAKE</span>
            <span className="text-[8px] font-bold leading-none">WORD</span>
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all border-2",
              isMuted ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-white border-emerald-100 text-emerald-500"
            )}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <button
            onClick={() => toggleListening()}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all border-4",
              isListening 
                ? "bg-red-500 border-red-200 text-white animate-pulse" 
                : "bg-emerald-500 border-emerald-200 text-white hover:scale-110 active:scale-95"
            )}
          >
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
        </div>
      </div>

      {/* Fatigue Warning Popup */}
      <AnimatePresence>
        {showFatigueWarning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[5000] w-[90%] max-w-md bg-red-600 text-white p-6 rounded-3xl shadow-2xl border-4 border-white/20"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h2 className="text-lg font-bold uppercase tracking-tight">Advertencia de Fatiga</h2>
                <p className="text-xs text-white/80">Seguridad CHRONA activa</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Has estado conduciendo por más de <strong>3 horas</strong> sin detenerte. Tu tiempo de reacción y atención pueden estar disminuyendo.
            </p>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase text-white/60">Sugerencias cercanas:</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/10 p-2 rounded-xl flex items-center gap-2">
                  <Coffee size={14} />
                  <span className="text-[10px] font-bold">Café a 2km</span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl flex items-center gap-2">
                  <Fuel size={14} />
                  <span className="text-[10px] font-bold">Estación a 5km</span>
                </div>
              </div>
              <button 
                onClick={() => setShowFatigueWarning(false)}
                className="w-full bg-white text-red-600 font-bold py-3 rounded-2xl text-xs shadow-lg hover:bg-red-50 transition-colors mt-4"
              >
                Entendido, buscaré donde parar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="z-50 w-96 glass-panel flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="text-white fill-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">CHRONA</h1>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-emerald-600 font-mono uppercase tracking-widest">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 relative">
              <div className="relative">
                <button 
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-[10px] font-bold text-slate-600 border border-slate-200 shadow-sm"
                  title="Cambiar idioma y acento"
                >
                  <Globe size={14} className="text-emerald-500" />
                  <span>{VOICE_LOCALES.find(l => l.id === voiceLanguage)?.flag} {voiceLanguage.split('-')[0].toUpperCase()}</span>
                </button>
                
                <AnimatePresence>
                  {isLangMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] py-2 max-h-[400px] overflow-y-auto"
                    >
                      <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                        Idiomas y Acentos
                      </div>
                      {VOICE_LOCALES.map(locale => (
                        <button
                          key={locale.id}
                          onClick={() => {
                            setVoiceLanguage(locale.id);
                            setIsLangMenuOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors",
                            voiceLanguage === locale.id ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-600"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span>{locale.flag}</span>
                            <span>{locale.label}</span>
                          </div>
                          {voiceLanguage === locale.id && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
                    className="relative p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600 border border-slate-200 shadow-sm"
                    title="Notificaciones"
                  >
                    <Bell size={18} className={notifications.length > 0 ? "text-emerald-500" : ""} />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationCenterOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] py-2 overflow-hidden"
                      >
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 flex justify-between items-center">
                          <span>Notificaciones</span>
                          <button 
                            onClick={() => setNotifications([])}
                            className="text-emerald-500 hover:text-emerald-600"
                          >
                            Limpiar
                          </button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-400 text-xs italic">
                              No tienes notificaciones
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <div key={notif.id} className="px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    notif.type === 'traffic' ? "bg-red-500" : notif.type === 'reward' ? "bg-emerald-500" : "bg-amber-500"
                                  )} />
                                  <span className="text-[10px] font-bold text-slate-900">{notif.title}</span>
                                  <span className="text-[8px] text-slate-400 ml-auto">
                                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">{notif.body}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Trophy size={16} />
                    <span>{userPoints}</span>
                  </div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-tighter">Points</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-emerald-500 font-bold">
                    <Coins size={16} />
                    <span>{virtualBalance}</span>
                  </div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-tighter">Coins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1 overflow-x-auto no-scrollbar border border-slate-200 shadow-sm">
            {(['nav', 'incidents', 'weather', 'social', 'garage', 'rewards', 'calendar', 'history', 'profile'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2 px-3 text-[10px] font-bold rounded-lg transition-all capitalize whitespace-nowrap flex items-center justify-center gap-1.5",
                  activeTab === tab ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-slate-600"
                )}
              >
                {getTabIcon(tab)}
                <span>
                  {tab === 'garage' ? 'Garaje' : 
                   tab === 'nav' ? 'Mapa' : 
                   tab === 'incidents' ? 'Alertas' : 
                   tab === 'weather' ? 'Clima' : 
                   tab === 'social' ? 'Social' : 
                   tab === 'rewards' ? 'Premios' : 
                   tab === 'calendar' ? 'Calendario' :
                   tab === 'history' ? 'Historial' : 
                   tab === 'profile' ? 'Perfil' : tab}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Smart Alert Toast */}
        <AnimatePresence>
          {currentAlert && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-6 p-4 bg-slate-900/90 backdrop-blur-xl text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
            >
              <div className={cn(
                "p-2 rounded-xl",
                typeof currentAlert === 'object' && currentAlert.type === 'success' ? "bg-emerald-500/20" :
                typeof currentAlert === 'object' && currentAlert.type === 'error' ? "bg-red-500/20" :
                typeof currentAlert === 'object' && currentAlert.type === 'warning' ? "bg-amber-500/20" :
                "bg-indigo-500/20"
              )}>
                {typeof currentAlert === 'object' && currentAlert.type === 'success' ? <ShieldCheck size={20} className="text-emerald-400" /> :
                 typeof currentAlert === 'object' && currentAlert.type === 'error' ? <AlertTriangle size={20} className="text-red-400" /> :
                 typeof currentAlert === 'object' && currentAlert.type === 'warning' ? <AlertTriangle size={20} className="text-amber-400" /> :
                 <Zap size={20} className="text-indigo-400 animate-pulse" />}
              </div>
              <div className="text-xs font-medium leading-tight">
                {typeof currentAlert === 'string' ? currentAlert : currentAlert.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'nav' && (
            <>
              {/* Weather Quick Widget (Apple Style) */}
              <motion.div 
                onClick={() => setActiveTab('weather')}
                className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-4 shadow-sm cursor-pointer hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {getWeatherIcon(forecastData?.current_weather?.weathercode || 0, 28)}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        {forecastData ? `${Math.round(forecastData.current_weather.temperature)}°` : '--°'} 
                        <span className="ml-2 text-sm text-slate-400 font-medium">{getWeatherLabel(forecastData?.current_weather?.weathercode || 0)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Clima en tiempo real</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-[10px] font-bold text-slate-400">Máx: {forecastData ? Math.round(forecastData.daily.temperature_2m_max[0]) : '--'}°</div>
                    <div className="text-[10px] font-bold text-slate-400">Mín: {forecastData ? Math.round(forecastData.daily.temperature_2m_min[0]) : '--'}°</div>
                  </div>
                </div>
              </motion.div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      <Calendar size={14} />
                    </div>
                    <input 
                      type="time" 
                      value={arrivalTime}
                      onChange={(e) => {
                        setArrivalTime(e.target.value);
                        setTimeWarning(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-900 transition-all"
                    />
                    <div className="absolute -top-6 left-0 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Llegada deseada</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-900 leading-none">Weather Service</div>
                        <div className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Sincronizado</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isFetchingWeather ? (
                        <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {weather === 'Sunny' ? <Sun size={14} className="text-amber-400" /> : 
                           weather === 'Rainy' ? <CloudRain size={14} className="text-blue-400" /> :
                           <Cloud size={14} className="text-slate-500" />}
                          <span className="text-xs font-bold text-slate-900">{weatherData ? `${Math.round(weatherData.temp)}°` : '--°'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {timeWarning && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 items-start"
                  >
                    <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                      <Clock size={16} />
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                      {timeWarning}
                    </p>
                  </motion.div>
                )}

                <div className="space-y-3">
                  {/* Origin Search */}
                  <div className="relative">
                    <div className="absolute left-3 top-4 text-slate-400">
                      <MapPin size={18} />
                    </div>
                    <input 
                      type="text"
                      placeholder="¿Desde dónde sales?"
                      value={originQuery}
                      onChange={(e) => setOriginQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-12 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 placeholder:text-slate-400"
                    />
                    <button 
                      onClick={async () => {
                        if (userLocation) {
                          setIsSearchingOrigin(true);
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation[0]}&lon=${userLocation[1]}`);
                            const data = await res.json();
                            const locationName = data.display_name || "Tu ubicación actual";
                            setOrigin({ name: locationName, lat: userLocation[0], lng: userLocation[1] });
                            setOriginQuery(locationName);
                          } catch (e) {
                            setOriginQuery("Tu ubicación actual");
                          }
                          setIsSearchingOrigin(false);
                        }
                      }}
                      className="absolute right-3 top-4 text-emerald-500 hover:text-emerald-600"
                      title="Usar mi ubicación"
                    >
                      <LocateFixed size={18} />
                    </button>
                    {isSearchingOrigin && (
                      <div className="absolute right-3 top-4">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {originSuggestions.length > 0 && (
                      <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                        {originSuggestions.map((loc, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setOrigin(loc);
                              setOriginQuery(loc.name);
                              setOriginSuggestions([]);
                            }}
                            className="w-full text-left px-4 py-3 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-start gap-2"
                          >
                            <MapPin size={14} className="mt-0.5 text-slate-400 shrink-0" />
                            <span className="text-slate-700 line-clamp-2">{loc.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Destination Search */}
                  <div className="relative">
                    <div className="absolute left-3 top-4 text-slate-400">
                      <Navigation size={18} />
                    </div>
                    <input 
                      type="text"
                      placeholder="¿A dónde vas?"
                      value={destQuery}
                      onChange={(e) => setDestQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 placeholder:text-slate-400"
                    />
                    {destQuery && (
                      <button 
                        onClick={() => {
                          setDestQuery('');
                          setDestination(null);
                          setDestSuggestions([]);
                        }}
                        className="absolute right-3 top-4 text-slate-400 hover:text-slate-600"
                      >
                        <Plus className="rotate-45" size={18} />
                      </button>
                    )}
                    {isSearchingDest && (
                      <div className="absolute right-3 top-4">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {destSuggestions.length > 0 && (
                      <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                        {destSuggestions.map((loc, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setDestination(loc);
                              setDestQuery(loc.name);
                              setDestSuggestions([]);
                            }}
                            className="w-full text-left px-4 py-3 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-start gap-2"
                          >
                            <Navigation size={14} className="mt-0.5 text-slate-400 shrink-0" />
                            <span className="text-slate-700 line-clamp-2">{loc.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* POI Quick Search */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mt-3">
                  <button onClick={() => setDestQuery('Gasolinera')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-bold text-slate-700 whitespace-nowrap transition-colors">
                    <Coffee size={12} className="text-amber-600" /> Gasolineras
                  </button>
                  <button onClick={() => setDestQuery('Restaurante')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-bold text-slate-700 whitespace-nowrap transition-colors">
                    <Coffee size={12} className="text-orange-500" /> Restaurantes
                  </button>
                  <button onClick={() => setDestQuery('Parqueadero')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-bold text-slate-700 whitespace-nowrap transition-colors">
                    <MapPin size={12} className="text-blue-500" /> Parqueaderos
                  </button>
                </div>

                {/* Route Preferences */}
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 mb-4 space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preferencias de Ruta</h4>
                  
                  <div className="flex gap-2">
                    {(['fastest', 'shortest', 'eco'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setRouteType(type)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                          routeType === type 
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {type === 'fastest' ? 'Rápida' : type === 'shortest' ? 'Corta' : 'Ecológica'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Evitar peajes</span>
                    <button 
                      onClick={() => setAvoidTolls(!avoidTolls)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors",
                        avoidTolls ? "bg-emerald-500" : "bg-slate-300"
                      )}
                    >
                      <motion.div animate={{ x: avoidTolls ? 20 : 2 }} className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Evitar autopistas</span>
                    <button 
                      onClick={() => setAvoidHighways(!avoidHighways)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors",
                        avoidHighways ? "bg-emerald-500" : "bg-slate-300"
                      )}
                    >
                      <motion.div animate={{ x: avoidHighways ? 20 : 2 }} className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-500/10 text-amber-600 rounded-lg flex items-center justify-center">
                      <Coffee size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-700">Smart Rest Planner</p>
                      <p className="text-[8px] text-slate-400 uppercase font-bold">Seguridad Activa</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsRestPlannerEnabled(!isRestPlannerEnabled)}
                    className={cn(
                      "w-10 h-5 rounded-full relative transition-colors",
                      isRestPlannerEnabled ? "bg-emerald-500" : "bg-slate-300"
                    )}
                  >
                    <motion.div 
                      animate={{ x: isRestPlannerEnabled ? 20 : 2 }}
                      className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                <button 
                  id="calculate-ai-btn"
                  onClick={handleSearch}
                  disabled={!origin || !destination || isSearching}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {isSearching ? "Analyzing Patterns..." : "Calculate AI Prediction"}
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Prediction Result */}
              <AnimatePresence>
                {(isLoadingPrediction || prediction) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <TrendingUp size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">AI Prediction</span>
                        {isWeatherConnected && (
                          <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-bold animate-pulse">
                            <ShieldCheck size={10} />
                            WEATHER SYNC
                          </div>
                        )}
                      </div>
                      {prediction && (
                        <div className="text-[10px] font-mono bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-400">
                          {prediction.confidenceScore}% Confidence
                        </div>
                      )}
                    </div>
                    
                    {isLoadingPrediction ? (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-8 bg-white/5 rounded w-1/2"></div>
                        <div className="h-4 bg-white/5 rounded w-full"></div>
                        <div className="h-4 bg-white/5 rounded w-3/4"></div>
                      </div>
                    ) : (
                      <>
                        {/* Traffic Congestion Warning */}
                      <AnimatePresence>
                        {selectedRoute?.trafficLevel === 'high' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3"
                          >
                            <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                              <AlertTriangle size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Tráfico Pesado Detectado</h4>
                              <p className="text-[10px] text-red-800 leading-tight">
                                Se ha detectado congestión severa en esta ruta. El tiempo de viaje aumentará considerablemente (+{selectedRoute.trafficDelay} min).
                              </p>
                              {routes.some(r => r.id !== selectedRoute.id && r.trafficLevel !== 'high') && (
                                <button 
                                  onClick={() => {
                                    const alt = routes.find(r => r.trafficLevel !== 'high') || routes[0];
                                    setSelectedRoute(alt);
                                  }}
                                  className="mt-2 text-[10px] font-bold text-red-600 underline hover:text-red-700"
                                >
                                  Cambiar a ruta con menos tráfico
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-slate-900">
                            {(selectedRoute?.duration || 0) + (isRestPlannerEnabled ? (selectedRoute?.totalRestTime || 0) : 0)}
                          </span>
                          <span className="text-slate-400 text-sm">minutos en total</span>
                        </div>
                        
                        {isRestPlannerEnabled && (selectedRoute?.totalRestTime || 0) > 0 && (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white shrink-0">
                              <Coffee size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-amber-800">Smart Rest Planner Activo</p>
                              <p className="text-[9px] text-amber-600">Se han añadido {selectedRoute?.totalRestTime} min de descanso para un viaje más seguro.</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-xs text-slate-300">
                            <CloudRain size={14} className="shrink-0 text-blue-400" />
                            <span>{prediction?.weatherImpact}</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-slate-300">
                            <Clock size={14} className="shrink-0 text-amber-400" />
                            <span>Salida recomendada: <strong className="text-slate-900">
                              {(() => {
                                if (!prediction?.optimizedDepartureTime) return '--:--';
                                if (!isRestPlannerEnabled || !selectedRoute?.totalRestTime) return prediction.optimizedDepartureTime;
                                
                                // Subtract rest time from departure
                                const [h, m] = prediction.optimizedDepartureTime.split(':').map(Number);
                                const date = new Date();
                                date.setHours(h, m - selectedRoute.totalRestTime, 0, 0);
                                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                              })()}
                            </strong></span>
                          </div>
                          {isRestPlannerEnabled && (selectedRoute?.totalRestTime || 0) > 0 && (
                            <div className="flex items-start gap-2 text-[10px] text-amber-600 italic">
                              <ShieldCheck size={12} className="shrink-0" />
                              <span>Esta hora incluye paradas de descanso recomendadas.</span>
                            </div>
                          )}
                          {prediction?.estimatedTimeMinutes && selectedRoute && (
                            <div className="flex items-start gap-2 text-xs text-slate-300">
                              <AlertTriangle size={14} className="shrink-0 text-red-400" />
                              <span>Análisis de Tráfico: <strong className="text-slate-900">+{selectedRoute.trafficDelay} min</strong> por congestión vehicular.</span>
                            </div>
                          )}
                          <div className="flex items-start gap-2 text-xs text-slate-400 italic">
                            <Info size={14} className="shrink-0" />
                            <span>"{prediction?.historicalContext}"</span>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Routes List */}
              {routes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Suggested Routes</h3>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                      <ShieldCheck size={12} />
                      CHRONA Distributed
                    </div>
                  </div>

                  {/* Distribution Simulation Widget */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-900 rounded-3xl text-white space-y-4 shadow-xl border border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <TrendingUp size={20} />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest">Simulación de Flujo</h3>
                          <p className="text-[10px] text-slate-400">Distribución inteligente de carga</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
                        <input 
                          type="number" 
                          min="1"
                          max="50"
                          value={simulatedCarsCount}
                          onChange={(e) => setSimulatedCarsCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-10 bg-transparent text-xs text-center font-bold focus:outline-none"
                        />
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Vehículos</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setIsSimulatingDistribution(!isSimulatingDistribution)}
                      className={cn(
                        "w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                        isSimulatingDistribution 
                          ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                          : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                      )}
                    >
                      {isSimulatingDistribution ? (
                        <>
                          <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          Detener Simulación
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          Simular Distribución de Tráfico
                        </>
                      )}
                    </button>
                    
                    {isSimulatingDistribution && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                        {routes.map((r) => {
                          const count = simulatedVehicles.filter(v => v.routeId === r.id).length;
                          const percentage = Math.round((count / simulatedCarsCount) * 100);
                          return (
                            <div key={r.id} className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
                              <div className="text-[9px] font-bold text-slate-500 uppercase truncate mb-1">{r.name}</div>
                              <div className="flex items-end justify-between">
                                <span className="text-xl font-bold text-emerald-400">{count}</span>
                                <span className="text-[10px] font-bold text-slate-400">{percentage}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  className="h-full bg-emerald-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                  
                  {selectedCarType.stats.efficiency > 7 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                      <Zap size={16} className="text-emerald-500" />
                      <p className="text-[10px] text-emerald-800 leading-tight">
                        <strong>Carril Inteligente:</strong> Tu vehículo ha sido distribuido a una vía de baja densidad para evitar el tráfico.
                      </p>
                    </div>
                  )}

                    {routes.map(route => (
                      <motion.div 
                        key={route.id}
                        onClick={() => {
                          const isAlternative = route.id !== routes[0].id;
                          if (isAlternative && selectedRoute?.id !== route.id) {
                            awardPoints(25, 'elegir una ruta alternativa');
                            setAlternativeRouteCount(prev => prev + 1);
                            setCurrentAlert({
                              type: 'success',
                              message: "¡Ruta Alternativa! +25 pts por ayudar a descongestionar la vía."
                            });
                            setTimeout(() => setCurrentAlert(null), 3000);
                          }
                          setSelectedRoute(route);
                          if (route.trafficDelay > 0) {
                            speak(t('trafficAnalysis', { delay: route.trafficDelay }));
                          }
                        }}
                      className={cn(
                        "p-4 rounded-2xl cursor-pointer border transition-all",
                        selectedRoute?.id === route.id 
                          ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" 
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-900"
                      )}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{route.name}</span>
                          {selectedCarType.stats.efficiency > 7 && (
                            <div className="bg-emerald-500/20 text-emerald-600 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter animate-pulse">
                              CHRONA Priority
                            </div>
                          )}
                        </div>
                        <span className={cn(
                          "font-bold text-sm",
                          selectedRoute?.id === route.id ? "text-white" : "text-slate-900"
                        )}>{route.duration} min</span>
                      </div>
                      <div className={cn(
                        "text-[10px] flex items-center gap-2",
                        selectedRoute?.id === route.id ? "text-white/80" : "text-slate-500"
                      )}>
                        <span>{route.distance.toFixed(1)} km</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            route.trafficLevel === 'high' ? "bg-red-500" : route.trafficLevel === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                          )} />
                          <span className="capitalize">{route.trafficLevel === 'low' ? 'Normal' : route.trafficLevel === 'medium' ? 'Moderado' : 'Pesado'}</span>
                        </span>
                        {route.trafficDelay > 0 && (
                          <span className={cn(
                            "font-bold",
                            selectedRoute?.id === route.id ? "text-white" : "text-slate-900"
                          )}>
                            (+{route.trafficDelay} min delay)
                          </span>
                        )}
                      </div>
                      
                      {selectedRoute?.id === route.id && !isNavigating && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsNavigating(true);
                            setTripStartTime(Date.now());
                          }}
                          className="mt-3 w-full bg-white text-emerald-600 font-bold py-2 rounded-xl text-[10px] shadow-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1"
                        >
                          <Navigation size={12} />
                          Iniciar Navegación
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Turn-by-Turn Instructions */}
              <AnimatePresence>
                {selectedRoute && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 pt-4 border-t border-white/5"
                  >
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <ArrowRight size={14} />
                      Turn-by-Turn Directions
                    </h3>
                    <div className="space-y-4">
                      {selectedRoute.instructions.map((step, i) => {
                        const isCurrentStep = isNavigating && i === Math.floor((currentRouteIndex / selectedRoute.coordinates.length) * selectedRoute.instructions.length);
                        return (
                          <div key={i} className={cn(
                            "flex gap-3 items-start transition-all duration-300",
                            isCurrentStep ? "scale-105" : "opacity-60"
                          )}>
                            <div className={cn(
                              "w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0",
                              isCurrentStep ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-50 border-slate-200 text-slate-400"
                            )}>
                              {i + 1}
                            </div>
                            <p className={cn(
                              "text-xs pt-1 leading-relaxed",
                              isCurrentStep ? "text-slate-900 font-bold" : "text-slate-500"
                            )}>{step}</p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {activeTab === 'weather' && (
            <WeatherDashboard 
              data={forecastData} 
              locationName={userLocation ? 'Tu Ubicación' : 'Bogotá'} 
              isConnected={isWeatherConnected}
              onConnect={handleConnectWeather}
              isConnecting={isConnectingWeather}
              userLocation={userLocation}
            />
          )}

          {activeTab === 'social' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-10"
            >
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Comunidad CHRONA</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ranking Global</p>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  <Trophy size={14} />
                  <span className="text-xs">Top 5%</span>
                </div>
              </div>

              {/* User Profile Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-indigo-50 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden">
                    {userProfile?.avatar ? (
                      <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{userProfile?.displayName || 'CHRONA Pioneer'}</h3>
                    <div className="flex items-center gap-2 text-amber-500 text-xs font-bold">
                      <Trophy size={14} />
                      {userProfile?.points || 0} Points
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Your Badges</span>
                    <span>{userProfile?.badges?.length || 0} / {BADGES.length}</span>
                  </div>
                  <div className="flex gap-2">
                    {(userProfile?.badges || []).map((badgeId: string) => {
                      const badge = BADGES.find(b => b.id === badgeId);
                      if (!badge) return null;
                      return (
                        <div key={badge.id} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl group relative cursor-help shadow-sm">
                          {badge.icon}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-white">
                            <strong>{badge.name}</strong>
                            <p className="text-slate-400 mt-1">{badge.description}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="w-10 h-10 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* CHRONA Premium Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown size={20} className="text-amber-400" />
                    <h3 className="font-bold text-lg">CHRONA Premium</h3>
                  </div>
                  <p className="text-xs text-slate-300 mb-4">Desbloquea navegación sin límites, alertas avanzadas y personalización total.</p>
                  
                  <button 
                    onClick={() => setIsPremium(!isPremium)}
                    className={cn(
                      "w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                      isPremium 
                        ? "bg-white/10 text-white border border-white/20" 
                        : "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:opacity-90 shadow-lg shadow-orange-500/20"
                    )}
                  >
                    {isPremium ? (
                      <>
                        <ShieldCheck size={16} className="text-emerald-400" />
                        Suscripción Activa
                      </>
                    ) : (
                      'Mejorar a Premium por $4.99/mes'
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                {leaderboard.length > 0 ? leaderboard.map((lUser, i) => (
                  <div key={lUser.id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                        i === 0 ? "bg-amber-500/20 text-amber-400" : 
                        i === 1 ? "bg-slate-500/20 text-slate-400" : 
                        i === 2 ? "bg-orange-500/20 text-orange-400" : "text-slate-500"
                      )}>
                        {lUser.rank}
                      </div>
                      <img 
                        src={lUser.avatar} 
                        alt={lUser.name} 
                        className="w-10 h-10 rounded-2xl border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{lUser.id === user?.uid ? "Tú" : lUser.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium">Nivel {Math.floor(lUser.points / 100)} • {lUser.points} pts</div>
                      </div>
                    </div>
                    {i === 0 && <Medal size={16} className="text-amber-400" />}
                  </div>
                )) : (
                  <div className="p-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cargando ranking...</div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Tus Logros</h3>
                <div className="grid grid-cols-2 gap-3">
                  {BADGES.map(badge => (
                    <div key={badge.id} className={cn(
                      "p-4 rounded-3xl border transition-all flex flex-col items-center text-center gap-2",
                      (userProfile?.badges || []).includes(badge.id) 
                        ? "bg-emerald-50 border-emerald-500/30 shadow-lg shadow-emerald-500/5" 
                        : "bg-slate-100 border-transparent opacity-30 grayscale"
                    )}>
                      <div className="text-2xl">{badge.icon}</div>
                      <div className="text-[10px] font-bold text-slate-900 leading-tight">{badge.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'garage' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-10"
            >
              <div className="bg-emerald-500 p-6 rounded-3xl text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-1 text-white">Tu Garaje Personal</h3>
                  <p className="text-xs text-emerald-100">Personaliza tu avatar en el mapa</p>
                  <div className="mt-4 flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full w-fit">
                    <Coins size={16} className="text-amber-300" />
                    <span className="text-sm font-bold text-white">${virtualBalance} CHRONA Coins</span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-20">
                  <Zap size={120} />
                </div>
              </div>

              {/* Streak Section */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 rounded-2xl text-white shadow-md relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Calendar size={16} />
                      Racha Diaria
                    </h4>
                    <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{streakDays}/20 días</span>
                  </div>
                  <div className="w-full bg-white/20 h-2 rounded-full mb-4">
                    <div 
                      className="bg-white h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(streakDays / 20) * 100}%` }}
                    ></div>
                  </div>
                  {streakDays >= 20 ? (
                    <button 
                      onClick={() => {
                        setVirtualBalance(prev => prev + 1000);
                        setStreakDays(0);
                        awardPoints(100, 'completar tu racha de 20 días');
                      }}
                      className="w-full bg-white text-orange-600 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-transform"
                    >
                      ¡Reclamar $1000 CHRONA Coins!
                    </button>
                  ) : (
                    <button 
                      onClick={() => setStreakDays(prev => prev + 1)}
                      className="w-full bg-white/20 text-white py-2 rounded-xl text-xs font-bold border border-white/30 hover:bg-white/30 transition-all"
                    >
                      Simular Registro de Hoy
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {CAR_TYPES.map(car => {
                  const isUnlocked = unlockedCarIds.includes(car.id);
                  const isSelected = selectedCarType.id === car.id;
                  const canAfford = virtualBalance >= car.price;

                  return (
                    <div 
                      key={car.id}
                      onClick={() => {
                        if (isUnlocked) {
                          setSelectedCarType(car);
                        } else if (canAfford) {
                          setVirtualBalance(prev => prev - car.price);
                          setUnlockedCarIds(prev => [...prev, car.id]);
                          setSelectedCarType(car);
                          setCurrentAlert({
                            type: 'success',
                            message: `¡Vehículo ${car.name} desbloqueado!`
                          });
                          setTimeout(() => setCurrentAlert(null), 3000);
                        } else {
                          setCurrentAlert({
                            type: 'error',
                            message: "Monedas insuficientes. ¡Sigue viajando!"
                          });
                          setTimeout(() => setCurrentAlert(null), 3000);
                        }
                      }}
                      className={cn(
                        "p-5 rounded-[32px] border transition-all relative overflow-hidden group cursor-pointer",
                        isSelected ? "bg-emerald-600 border-emerald-500 text-white shadow-xl shadow-emerald-500/20" : 
                        isUnlocked ? "bg-white border-slate-200 text-slate-900 shadow-lg hover:border-emerald-500/50" : 
                        "bg-slate-50 border-transparent text-slate-400 opacity-50"
                      )}
                    >
                      <div className="absolute right-0 top-0 -translate-y-2 translate-x-2 opacity-10 group-hover:scale-110 transition-transform">
                        <div className="text-6xl">{car.icon === 'car' ? '🚗' : car.icon === 'sport' ? '🏎️' : car.icon === 'truck' ? '🚚' : car.icon === 'bus' ? '🚌' : car.icon === 'ufo' ? '🛸' : '🚀'}</div>
                      </div>

                      <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-bold">{car.name}</h3>
                            <p className={cn("text-[10px] font-medium opacity-70", isSelected ? "text-white" : "text-slate-500")}>
                              {car.description}
                            </p>
                          </div>
                          {!isUnlocked && (
                            <div className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-lg font-bold">
                              {car.price} COINS
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-current/10">
                          <div className="space-y-1">
                            <div className="text-[8px] font-bold uppercase tracking-wider opacity-70">Velocidad</div>
                            <div className="h-1 bg-current/20 rounded-full overflow-hidden">
                              <div className="h-full bg-current" style={{ width: `${car.stats.speed * 10}%` }}></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[8px] font-bold uppercase tracking-wider opacity-70">Eficiencia</div>
                            <div className="h-1 bg-current/20 rounded-full overflow-hidden">
                              <div className="h-full bg-current" style={{ width: `${car.stats.efficiency * 10}%` }}></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[8px] font-bold uppercase tracking-wider opacity-70">Multiplicador</div>
                            <div className="h-1 bg-current/20 rounded-full overflow-hidden">
                              <div className="h-full bg-current" style={{ width: `${car.stats.points * 20}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 shadow-xl">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-900">
                  <AlertTriangle size={18} className="text-red-500" />
                  Report Incident
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(['accident', 'roadworks', 'hazard'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setReportType(type)}
                        className={cn(
                          "py-2 text-[10px] font-bold rounded-lg border transition-all capitalize",
                          reportType === type ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20" : "bg-slate-50 border-slate-200 text-slate-500"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <textarea 
                    placeholder="Describe what's happening..."
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-red-500 text-slate-900 h-20 resize-none shadow-sm placeholder:text-slate-400"
                  />
                  <button 
                    onClick={() => setIsReporting(true)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                  >
                    <MapPin size={16} />
                    {isReporting ? "Click on map to place" : "Mark on Map"}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nearby Incidents</h3>
                {incidents.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-xs italic">No incidents reported nearby.</div>
                ) : (
                  incidents.map(inc => (
                    <div key={inc.id} className="p-4 rounded-2xl bg-white border border-slate-100 space-y-2 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="font-bold text-xs capitalize text-slate-900">{inc.type}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{new Date(inc.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-xs text-slate-300">{inc.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="text-[10px] text-slate-500">Reported by {inc.reportedBy}</div>
                        <button 
                          onClick={() => confirmIncident(inc.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300"
                        >
                          <ThumbsUp size={12} />
                          Confirm ({inc.confirmations})
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-10"
            >
              <div className="bg-amber-500 p-6 rounded-3xl text-white shadow-lg shadow-amber-500/20 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-1 text-white">Canjea tus Puntos</h3>
                  <p className="text-xs text-amber-100">Disfruta de beneficios por tu conducción inteligente</p>
                  <div className="mt-4 flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full w-fit">
                    <Trophy size={16} className="text-amber-300" />
                    <span className="text-sm font-bold text-white">{userProfile?.points || 0} Puntos Disponibles</span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-20">
                  <Gift size={120} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'coffee', name: 'Café Gratis en Ruta', partner: 'Starbucks / Juan Valdez', price: 200, icon: <Coffee className="text-amber-700" /> },
                  { id: 'fuel', name: 'Descuento en Combustible', partner: 'Shell / Terpel', price: 500, icon: <Fuel className="text-blue-600" /> },
                  { id: 'parking', name: '1 Hora Parqueadero Gratis', partner: 'City Parking', price: 300, icon: <MapPin className="text-emerald-600" /> },
                  { id: 'wash', name: 'Lavado de Auto Express', partner: 'CleanCar', price: 800, icon: <Waves className="text-cyan-500" /> },
                  { id: 'movie', name: 'Cine 2x1', partner: 'Cine Colombia', price: 400, icon: <Film className="text-purple-500" /> },
                  { id: 'food', name: 'Descuento 20% Restaurante', partner: 'Crepes & Waffles', price: 600, icon: <Utensils className="text-orange-500" /> }
                ].map(reward => {
                  const canAfford = (userProfile?.points || 0) >= reward.price;
                  return (
                    <div key={reward.id} className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {reward.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{reward.name}</h3>
                          <p className="text-[10px] text-slate-500 font-medium">{reward.partner}</p>
                        </div>
                      </div>
                      <button 
                        disabled={!canAfford || !user}
                        onClick={async () => {
                          if (!user || !userProfile) return;
                          const userDocRef = doc(db, 'users', user.uid);
                          const newPoints = userProfile.points - reward.price;
                          try {
                            await updateDoc(userDocRef, { points: newPoints });
                            setUserProfile((prev: any) => ({ ...prev, points: newPoints }));
                            setCurrentAlert({
                              type: 'success',
                              message: `¡Canjeado! Tu cupón para ${reward.name} ha sido enviado a tu correo.`
                            });
                            setTimeout(() => setCurrentAlert(null), 5000);
                          } catch (error) {
                            handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
                          }
                        }}
                        className={cn(
                          "text-[10px] font-bold px-4 py-2 rounded-xl shadow-lg transition-all",
                          canAfford && user ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {reward.price} PTS
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 rounded-[40px] bg-indigo-600 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-20">
                  <Trophy size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                  <h3 className="text-lg font-bold leading-tight">Programa de Socios CHRONA</h3>
                  <p className="text-xs text-indigo-100 leading-relaxed">
                    Estamos expandiendo nuestra red de beneficios. Si tienes un negocio y quieres ser parte de la revolución de la movilidad inteligente, ¡contáctanos!
                  </p>
                  <button className="bg-white text-indigo-600 font-bold px-6 py-3 rounded-2xl text-xs shadow-xl hover:bg-indigo-50 transition-all">
                    Saber Más
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-10"
            >
              {!user ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <User size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">Inicia sesión en CHRONA</h3>
                    <p className="text-xs text-slate-500 max-w-[250px]">Guarda tus rutas favoritas, gana puntos y personaliza tu experiencia de movilidad.</p>
                  </div>
                  <button 
                    onClick={handleLogin}
                    className="bg-emerald-500 text-white font-bold px-8 py-3 rounded-2xl text-xs shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2"
                  >
                    <Globe size={16} />
                    Continuar con Google
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="p-6 rounded-[32px] bg-white border border-slate-200 shadow-sm flex items-center gap-4">
                    <img 
                      src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} 
                      alt={user.displayName || ''} 
                      className="w-16 h-16 rounded-2xl border-2 border-emerald-500/20"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900">{user.displayName}</h3>
                      <p className="text-[10px] text-slate-500 font-medium">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          <Coins size={10} />
                          <span className="text-[10px]">{userProfile?.points || 0} PTS</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nivel {Math.floor((userProfile?.points || 0) / 100)}</div>
                      </div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Cerrar sesión"
                    >
                      <Zap size={18} />
                    </button>
                  </div>

                  {/* Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Preferencias de Viaje</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'car', label: 'Coche', icon: <MapPin size={14} /> },
                        { id: 'public_transport', label: 'Transporte', icon: <MapIcon size={14} /> },
                        { id: 'bicycle', label: 'Bicicleta', icon: <TrendingUp size={14} /> },
                        { id: 'walking', label: 'Caminata', icon: <User size={14} /> }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={async () => {
                            const userDocRef = doc(db, 'users', user.uid);
                            await updateDoc(userDocRef, { preferredTransport: mode.id });
                            setUserProfile((prev: any) => ({ ...prev, preferredTransport: mode.id }));
                          }}
                          className={cn(
                            "p-4 rounded-3xl border flex flex-col items-center gap-2 transition-all",
                            userProfile?.preferredTransport === mode.id 
                              ? "bg-emerald-50 border-emerald-500/30 text-emerald-600 shadow-lg shadow-emerald-500/5" 
                              : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                          )}
                        >
                          {mode.icon}
                          <span className="text-[10px] font-bold">{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Saved Locations */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ubicaciones Guardadas</h3>
                      <button 
                        onClick={() => setShowAddLocation(!showAddLocation)}
                        className="text-[10px] font-bold text-emerald-500"
                      >
                        {showAddLocation ? 'Cancelar' : '+ Añadir'}
                      </button>
                    </div>

                    {showAddLocation && (
                      <div className="p-4 bg-slate-50 rounded-3xl border border-slate-200 space-y-3 mb-3">
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Nombre (ej. Casa, Trabajo)" 
                            value={newLocationName}
                            onChange={(e) => setNewLocationName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                          />
                          <input 
                            type="text" 
                            placeholder="Dirección" 
                            value={newLocationAddress}
                            onChange={(e) => setNewLocationAddress(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <button 
                          onClick={handleAddLocation}
                          className="w-full bg-emerald-500 text-white font-bold py-2 rounded-xl text-[10px] shadow-lg shadow-emerald-500/20"
                        >
                          Guardar Ubicación
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {userProfile?.savedLocations?.length > 0 ? (
                        userProfile.savedLocations.map((loc: any, i: number) => (
                          <div key={i} className="p-4 rounded-2xl bg-white border border-slate-100 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <MapPin size={14} />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">{loc.name}</div>
                                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{loc.address}</div>
                              </div>
                            </div>
                            <button 
                              onClick={async () => {
                                const userDocRef = doc(db, 'users', user.uid);
                                const updatedLocations = userProfile.savedLocations.filter((_: any, index: number) => index !== i);
                                await updateDoc(userDocRef, { savedLocations: updatedLocations });
                                setUserProfile((prev: any) => ({ ...prev, savedLocations: updatedLocations }));
                              }}
                              className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-2">
                          <p className="text-[10px] text-slate-400 font-medium">No tienes ubicaciones guardadas.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recurring Schedules */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horarios Recurrentes</h3>
                      <button 
                        onClick={() => setShowAddSchedule(!showAddSchedule)}
                        className="text-[10px] font-bold text-emerald-500"
                      >
                        {showAddSchedule ? 'Cancelar' : '+ Añadir'}
                      </button>
                    </div>

                    {showAddSchedule && (
                      <div className="p-4 bg-slate-50 rounded-3xl border border-slate-200 space-y-3 mb-3">
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Etiqueta (ej. Salida Oficina)" 
                            value={newScheduleLabel}
                            onChange={(e) => setNewScheduleLabel(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                          />
                          <div className="flex gap-2">
                            <select 
                              value={newScheduleDay}
                              onChange={(e) => setNewScheduleDay(e.target.value)}
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                            >
                              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                                <option key={day} value={day}>{day}</option>
                              ))}
                            </select>
                            <input 
                              type="time" 
                              value={newScheduleTime}
                              onChange={(e) => setNewScheduleTime(e.target.value)}
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={handleAddSchedule}
                          className="w-full bg-emerald-500 text-white font-bold py-2 rounded-xl text-[10px] shadow-lg shadow-emerald-500/20"
                        >
                          Añadir Horario
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {userProfile?.recurringSchedules?.length > 0 ? (
                        userProfile.recurringSchedules.map((sched: any, i: number) => (
                          <div key={i} className="p-4 rounded-2xl bg-white border border-slate-100 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <Clock size={14} />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">{sched.label || `${sched.day} a las ${sched.time}`}</div>
                                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{sched.day} • {sched.time}</div>
                              </div>
                            </div>
                            <button 
                              onClick={async () => {
                                const userDocRef = doc(db, 'users', user.uid);
                                const updatedSchedules = userProfile.recurringSchedules.filter((_: any, index: number) => index !== i);
                                await updateDoc(userDocRef, { recurringSchedules: updatedSchedules });
                                setUserProfile((prev: any) => ({ ...prev, recurringSchedules: updatedSchedules }));
                              }}
                              className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-2">
                          <p className="text-[10px] text-slate-400 font-medium">Configura tus horarios de viaje habituales.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-10"
            >
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tu Calendario</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sincronizado con tus eventos próximos</p>
                </div>
                <button className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors">
                  <Plus size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {calendarEvents.map(event => (
                  <div key={event.id} className="p-5 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:border-emerald-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{event.title}</h3>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                            <Clock size={12} />
                            <span>{event.date} • {event.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600">
                        Próximo
                      </div>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-2xl">
                        <MapPin size={14} className="text-emerald-500" />
                        <span className="font-medium">{event.location}</span>
                      </div>
                    )}

                    {event.suggestedDeparture && (
                      <div className="flex flex-col gap-3 p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <Zap size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider">Sugerencia CHRONA</span>
                          </div>
                          <span className="text-lg font-black text-emerald-600">{event.suggestedDeparture}</span>
                        </div>
                        <p className="text-[10px] text-emerald-700/70 font-medium leading-tight">
                          Sal a esta hora para llegar 10 min antes. Tiempo de viaje estimado: {event.estimatedTravelTime} min.
                        </p>
                        <button 
                          onClick={() => {
                            const loc = MOCK_LOCATIONS.find(l => l.name === event.location);
                            if (loc) {
                              setDestination(loc);
                              setDestQuery(loc.name);
                              setActiveTab('nav');
                              speak(t('preparingNavigation', { title: event.title }));
                            }
                          }}
                          className="w-full bg-emerald-500 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Navigation size={14} />
                          Navegar Ahora
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-10"
            >
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Historial de Viajes</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tus rutas y estadísticas de movilidad</p>
                </div>
                <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                  <TrendingUp size={18} />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm text-center">
                  <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">Viajes</span>
                  <span className="text-xl font-black text-slate-900">{tripHistory.length}</span>
                </div>
                <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm text-center">
                  <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">Distancia</span>
                  <span className="text-xl font-black text-slate-900">
                    {Math.round(tripHistory.reduce((acc, trip) => acc + trip.distance, 0))} <span className="text-[10px]">km</span>
                  </span>
                </div>
                <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm text-center">
                  <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">Promedio</span>
                  <span className="text-xl font-black text-slate-900">
                    {tripHistory.length > 0 ? Math.round(tripHistory.reduce((acc, trip) => acc + trip.duration, 0) / tripHistory.length) : 0} <span className="text-[10px]">min</span>
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {tripHistory.map(trip => (
                  <div key={trip.id} className="p-5 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:border-emerald-500/30 transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <Calendar size={12} />
                        <span>{trip.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                        <Zap size={12} />
                        <span>+50 pts</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="w-0.5 h-6 bg-slate-100" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{trip.startLocation}</div>
                        <div className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{trip.endLocation}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Navigation size={14} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">{trip.distance} km</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">{trip.duration} min</span>
                        </div>
                      </div>
                      <button className="text-indigo-500 hover:text-indigo-600 transition-colors">
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          zoomControl={false}
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          <MapController 
            center={userLocation || [40.7128, -74.0060]} 
            zoom={13} 
            route={selectedRoute}
            carPosition={carPosition}
            followCar={followCar}
          />
          
          {isReporting && <MapClickHandler onMapClick={handleReportIncident} />}

          {/* Car Marker (Navigation) */}
          {carPosition && (
            <>
              <Marker position={carPosition} icon={CarIcon(carRotation, selectedCarType)} zIndexOffset={1000}>
                <Popup>Navegando...</Popup>
              </Marker>
              {isNavigating && selectedRoute && (
                <Marker 
                  position={carPosition} 
                  icon={L.divIcon({
                    html: `<div class="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-white/20 whitespace-nowrap -translate-y-8">
                      ${selectedRoute.instructions[Math.floor((currentRouteIndex / selectedRoute.coordinates.length) * selectedRoute.instructions.length)] || 'CHRONA'}
                    </div>`,
                    className: '',
                    iconSize: [0, 0],
                    iconAnchor: [0, 0]
                  })}
                  zIndexOffset={1001}
                />
              )}
            </>
          )}

          {/* Rest Stops Markers */}
          {isRestPlannerEnabled && selectedRoute?.restStops?.map(stop => (
            <Marker 
              key={stop.id} 
              position={stop.coordinate}
              icon={L.divIcon({
                html: `<div class="bg-amber-500 text-white p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center">
                  ${stop.type === 'gas' ? '⛽' : stop.type === 'restaurant' ? '🍽️' : stop.type === 'cafe' ? '☕' : stop.type === 'viewpoint' ? '📸' : '🅿️'}
                </div>`,
                className: '',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })}
            >
              <Popup>
                <div className="p-2">
                  <div className="text-xs font-bold text-slate-900">{stop.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Parada recomendada a los {stop.distanceFromStart}km</div>
                  <div className="text-[10px] text-amber-600 font-bold mt-1">Descanso sugerido: 20 min</div>
                  <button className="mt-2 w-full bg-amber-500 text-white text-[10px] py-1 rounded-lg font-bold">
                    Añadir como parada
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
          {isSimulatingDistribution && simulatedVehicles.map(vehicle => (
            <Marker 
              key={vehicle.id} 
              position={vehicle.position} 
              icon={CarIcon(vehicle.rotation, vehicle.carType)}
              zIndexOffset={500}
            >
              <Popup>
                <div className="p-2">
                  <div className="text-[10px] font-bold text-slate-900">{vehicle.carType.name}</div>
                  <div className="text-[8px] text-slate-500 uppercase mt-1">Vehículo Simulado</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* User Location */}
          {userLocation && (
            <>
              <Circle 
                center={userLocation} 
                radius={200} 
                pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }} 
              />
              <Marker position={userLocation}>
                <Popup>You are here</Popup>
              </Marker>
            </>
          )}

          {/* Route Incidents */}
          {routeIncidents.map(inc => (
            <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={IncidentIcon(inc.type)}>
              <Popup>
                <div className="p-2 space-y-1">
                  <div className="font-bold capitalize text-red-500">{inc.type}</div>
                  <div className="text-xs text-slate-700">{inc.description}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Incidents */}
          {incidents.map(inc => (
            <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={IncidentIcon(inc.type)}>
              <Popup>
                <div className="p-2 space-y-1">
                  <div className="font-bold capitalize text-red-500">{inc.type}</div>
                  <div className="text-xs text-slate-700">{inc.description}</div>
                  <div className="text-[10px] text-slate-400">Reported by {inc.reportedBy}</div>
                  <button 
                    onClick={() => confirmIncident(inc.id)}
                    className="w-full mt-2 bg-emerald-500 text-white text-[10px] py-1 rounded font-bold shadow-sm"
                  >
                    Confirm Incident
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Origin & Destination Markers */}
          {origin && (
            <Marker position={[origin.lat, origin.lng]}>
              <Popup>Origin: {origin.name}</Popup>
            </Marker>
          )}
          {destination && (
            <Marker position={[destination.lat, destination.lng]}>
              <Popup>Destination: {destination.name}</Popup>
            </Marker>
          )}

          {/* Selected Route */}
          {selectedRoute && (
            <>
              {/* Outer Glow */}
              <Polyline 
                positions={selectedRoute.coordinates}
                pathOptions={{ 
                  color: '#4f46e5',
                  weight: 14,
                  opacity: 0.1,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
              
              {/* Traffic Segments (Live Traffic Visualization) */}
              {selectedRoute.trafficSegments ? (
                selectedRoute.trafficSegments.map((segment, idx) => (
                  <Polyline 
                    key={`${selectedRoute.id}-traffic-${idx}`}
                    positions={selectedRoute.coordinates.slice(segment.startIndex, segment.endIndex + 1)}
                    pathOptions={{ 
                      color: segment.level === 'high' ? '#ef4444' : segment.level === 'medium' ? '#f59e0b' : '#10b981',
                      weight: 8,
                      opacity: 0.9,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                ))
              ) : (
                <Polyline 
                  positions={selectedRoute.coordinates}
                  pathOptions={{ 
                    color: '#6366f1',
                    weight: 8,
                    opacity: 0.9,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              )}

              {/* Center Line for extra detail */}
              <Polyline 
                positions={selectedRoute.coordinates}
                pathOptions={{ 
                  color: '#ffffff',
                  weight: 1,
                  opacity: 0.5,
                  lineCap: 'round',
                  lineJoin: 'round',
                  dashArray: '5, 15'
                }}
              />
            </>
          )}

          {/* Simulated Traffic Heatmap */}
          {showHeatmap && !selectedRoute && (
            <>
              {[...Array(15)].map((_, i) => (
                <Circle 
                  key={i}
                  center={[
                    mapCenter[0] + (Math.random() - 0.5) * 0.1,
                    mapCenter[1] + (Math.random() - 0.5) * 0.1
                  ]}
                  radius={800 + Math.random() * 1200}
                  pathOptions={{ 
                    color: 'transparent', 
                    fillColor: Math.random() > 0.7 ? '#ef4444' : '#f59e0b', 
                    fillOpacity: 0.15 
                  }}
                />
              ))}
            </>
          )}
        </MapContainer>

        {/* Recalculating Overlay */}
        <AnimatePresence>
          {isRecalculating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[2000] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <h2 className="text-2xl font-bold text-indigo-600 animate-pulse">Recalculando Ruta...</h2>
              <p className="text-slate-500 font-medium">Buscando el camino más rápido</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Traffic Legend */}
        <div className="absolute bottom-6 right-6 z-[1000] bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tráfico en Vivo</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-emerald-500 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-600">Fluido</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-amber-500 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-600">Moderado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-red-500 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-600">Pesado</span>
          </div>
        </div>

        {/* Navigation Overlay (Waze Style) */}
        {isNavigating && carPosition && selectedRoute && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4">
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-md"
            >
              <div className="bg-white/20 p-3 rounded-xl flex flex-col items-center">
                <Navigation size={24} className="rotate-45 mb-1" />
                <span className="text-[10px] font-bold">200m</span>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Próxima instrucción</div>
                <div className="text-lg font-bold truncate">
                  {selectedRoute.instructions[Math.floor((currentRouteIndex / selectedRoute.coordinates.length) * selectedRoute.instructions.length)]}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-300">
                    <Clock size={12} />
                    <span>ETA: {(() => {
                      const remainingMinutes = Math.round(selectedRoute.duration * (1 - currentRouteIndex / selectedRoute.coordinates.length));
                      const eta = new Date(currentTime.getTime() + remainingMinutes * 60000);
                      return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                    })()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-200">
                    <MapPin size={12} />
                    <span>{Math.max(0, (selectedRoute.distance * (1 - currentRouteIndex / selectedRoute.coordinates.length))).toFixed(1)} km</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    voiceEnabled ? "bg-white/20 text-white" : "bg-red-500/50 text-white"
                  )}
                  title={voiceEnabled ? "Silenciar voz" : "Activar voz"}
                >
                  {voiceEnabled ? <Compass size={18} /> : <Eye size={18} />}
                </button>
                <button 
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors text-[10px] font-bold"
                  title="Cambiar idioma de voz"
                >
                  {VOICE_LOCALES.find(l => l.id === voiceLanguage)?.flag} {voiceLanguage.split('-')[0].toUpperCase()}
                </button>
                <button 
                  onClick={() => {
                    setIsRecalculating(true);
                    speak(t('recalculating'));
                    setTimeout(() => {
                      handleSearch();
                      setIsRecalculating(false);
                    }, 2000);
                  }}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                  title="Simular desvío"
                >
                  <Zap size={18} className={cn(isRecalculating && "animate-spin")} />
                </button>
                <button 
                  onClick={() => setFollowCar(!followCar)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    followCar ? "bg-white/20 text-white" : "bg-red-500 text-white"
                  )}
                  title={followCar ? "Dejar de seguir" : "Recalibrar vista"}
                >
                  <LocateFixed size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Map Controls Overlay */}
        <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
          <button 
            onClick={() => setFollowCar(!followCar)}
            className={cn(
              "w-12 h-12 border rounded-xl flex items-center justify-center transition-all shadow-xl",
              followCar ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
            title="Toggle Follow Car"
          >
            <LocateFixed size={20} />
          </button>
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-xl transition-all",
              showHeatmap ? "bg-emerald-500 text-white" : "bg-white text-slate-600 border border-slate-200"
            )}
            title="Toggle Traffic Heatmap"
          >
            <AlertTriangle size={20} />
          </button>
          <button 
            onClick={() => {
              if (userLocation) setOrigin({ name: "Current Location", lat: userLocation[0], lng: userLocation[1] });
            }}
            className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 shadow-xl hover:bg-slate-50 transition-all"
            title="Use My Location"
          >
            <Navigation size={20} />
          </button>
          <button 
            onClick={() => setShowMusicPlayer(!showMusicPlayer)}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-xl transition-all",
              showMusicPlayer ? "bg-green-500 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
            title="Toggle Music Player"
          >
            <Music size={20} />
          </button>
          <button 
            onClick={() => setIsReporting(!isReporting)}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-xl transition-all",
              isReporting ? "bg-orange-500 text-white" : "bg-white text-orange-500 border border-slate-200 hover:bg-slate-50"
            )}
            title="Reportar Incidente (Alertas Avanzadas)"
          >
            <AlertOctagon size={20} />
          </button>
        </div>

        {/* Music Player Widget */}
        <AnimatePresence>
          {showMusicPlayer && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="absolute top-6 right-24 z-[1000] w-80 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 bg-white flex flex-col"
            >
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar canciones..." 
                    value={musicSearchQuery}
                    onChange={(e) => {
                      setMusicSearchQuery(e.target.value);
                      searchMusic(e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-full py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-green-500"
                  />
                  {isSearchingMusic && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>

              {musicSearchResults.length > 0 && !currentSong && (
                <div className="max-h-48 overflow-y-auto bg-white">
                  {musicSearchResults.map((track) => (
                    <button 
                      key={track.trackId}
                      onClick={async () => {
                        setCurrentSong(track);
                        setIsPlaying(false);
                        setMusicSearchResults([]);
                        setMusicSearchQuery('');
                        setYoutubeVideoId(null); // Reset while loading
                        if (youtubePlayerRef.current) {
                          youtubePlayerRef.current.pauseVideo();
                        }
                        
                        try {
                          const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(track.trackName + ' ' + track.artistName + ' lyric video')}`);
                          if (res.ok) {
                            const data = await res.json();
                            if (data.videoId) {
                              setYoutubeVideoId(data.videoId);
                            }
                          }
                        } catch (err) {
                          console.error("Failed to fetch YouTube video ID", err);
                        }
                      }}
                      className="w-full text-left p-2 hover:bg-slate-50 border-b border-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <img src={track.artworkUrl100} alt={track.trackName} className="w-10 h-10 rounded-md object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{track.trackName}</div>
                        <div className="text-[10px] text-slate-500 truncate">{track.artistName}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentSong ? (
                <div className="p-4 flex flex-col gap-3 bg-white">
                  <div className="flex items-center gap-4">
                    <img src={currentSong.artworkUrl100} alt={currentSong.trackName} className="w-16 h-16 rounded-lg shadow-md object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{currentSong.trackName}</div>
                      <div className="text-xs text-slate-500 truncate mb-2">{currentSong.artistName}</div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setCurrentSong(null);
                            setIsPlaying(false);
                          }}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest ml-auto"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Custom Audio Player for Full Song via Stream */}
                  <div className="w-full mt-2">
                    {youtubeVideoId ? (
                      <div className="bg-slate-100 rounded-lg p-3">
                        <div className="hidden">
                          <YouTube
                            videoId={youtubeVideoId}
                            opts={{
                              height: '0',
                              width: '0',
                              playerVars: {
                                autoplay: 1,
                                playsinline: 1,
                              },
                            }}
                            onReady={(e) => {
                              youtubePlayerRef.current = e.target;
                              setAudioDuration(e.target.getDuration());
                            }}
                            onStateChange={(e) => {
                              if (e.data === YouTube.PlayerState.PLAYING) {
                                setIsPlaying(true);
                                setAudioDuration(e.target.getDuration());
                              } else if (e.data === YouTube.PlayerState.PAUSED) {
                                setIsPlaying(false);
                              } else if (e.data === YouTube.PlayerState.ENDED) {
                                setIsPlaying(false);
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              if (youtubePlayerRef.current) {
                                if (isPlaying) {
                                  youtubePlayerRef.current.pauseVideo();
                                } else {
                                  youtubePlayerRef.current.playVideo();
                                }
                              }
                            }}
                            className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors shrink-0"
                          >
                            {isPlaying ? (
                              <div className="w-3 h-3 flex gap-1">
                                <div className="w-1 h-full bg-white rounded-sm"></div>
                                <div className="w-1 h-full bg-white rounded-sm"></div>
                              </div>
                            ) : (
                              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden cursor-pointer"
                              onClick={(e) => {
                                if (youtubePlayerRef.current && audioDuration) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const x = e.clientX - rect.left;
                                  const percentage = x / rect.width;
                                  youtubePlayerRef.current.seekTo(percentage * audioDuration, true);
                                }
                              }}
                            >
                              <div 
                                className="h-full bg-indigo-500" 
                                style={{ width: `${audioDuration ? (audioProgress / audioDuration) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[9px] text-slate-500 font-medium">{formatTime(audioProgress)}</span>
                              <span className="text-[9px] text-slate-500 font-medium">{formatTime(audioDuration)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-16 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px]">Cargando audio de alta calidad...</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 text-center mt-2">
                    Reproduciendo audio completo sin interrupciones
                  </div>
                </div>
              ) : (
                !musicSearchQuery && (
                  <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Music size={24} className="opacity-50" />
                    <span className="text-xs">Busca una canción para escuchar</span>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reporting Overlay */}
        {isReporting && (
          <div className="absolute inset-0 z-[2000] bg-slate-900/20 pointer-events-none flex flex-col items-center justify-center gap-4">
            <div className="bg-white/95 backdrop-blur-md border border-orange-500/30 p-4 rounded-3xl flex flex-col items-center gap-3 shadow-2xl pointer-events-auto">
              <div className="flex items-center gap-2 text-orange-500 font-bold mb-2">
                <AlertOctagon size={20} />
                <span>¿Qué deseas reportar?</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setReportType('accident')}
                  className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-colors", reportType === 'accident' ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                >
                  Accidente
                </button>
                <button 
                  onClick={() => setReportType('police')}
                  className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-colors", reportType === 'police' ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                >
                  Policía
                </button>
                <button 
                  onClick={() => setReportType('hazard')}
                  className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-colors", reportType === 'hazard' ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                >
                  Peligro
                </button>
              </div>
              <div className="text-xs text-slate-500 mt-2 animate-pulse">
                Toca en el mapa para ubicar el reporte
              </div>
            </div>
            <button 
              onClick={() => setIsReporting(false)}
              className="bg-white text-slate-900 px-6 py-2 rounded-full text-sm font-bold shadow-lg pointer-events-auto hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Bottom Status Bar */}
        <AnimatePresence>
          {selectedRoute && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-lg px-4"
            >
              <div className="glass-panel p-4 rounded-3xl flex items-center justify-between shadow-2xl border border-white/40">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm text-white",
                    selectedRoute.trafficLevel === 'low' ? "bg-emerald-500" : "bg-amber-500"
                  )}>
                    <span className="text-xs font-bold leading-none">{isNavigating ? Math.max(1, Math.round(selectedRoute.duration * (1 - currentRouteIndex / selectedRoute.coordinates.length))) : selectedRoute.duration}</span>
                    <span className="text-[8px] uppercase">min</span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-widest">
                      {isNavigating ? `Llegada: ${eta}` : `Hacia ${destination?.name}`}
                    </div>
                    <div className="text-lg font-bold flex items-center gap-2 text-slate-900">
                      {isNavigating ? `${remainingDist.toFixed(1)} km` : `${selectedRoute.distance.toFixed(1)} km`}
                      <span className="text-xs font-normal text-slate-400">• {selectedRoute.trafficLevel === 'low' ? 'Tráfico fluido' : 'Tráfico moderado'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsNavigating(!isNavigating)}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                      isNavigating 
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" 
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                    )}
                  >
                    {isNavigating ? (
                      <>
                        <Plus className="rotate-45" size={18} />
                        Detener
                      </>
                    ) : (
                      <>
                        <Zap size={18} className="fill-current" />
                        Iniciar
                      </>
                    )}
                  </button>
                  {!isNavigating && (
                    <button 
                      onClick={() => {
                        setRoutes([]);
                        setSelectedRoute(null);
                        setPrediction(null);
                        setIsNavigating(false);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-2xl text-sm font-bold transition-colors"
                    >
                      Salir
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
