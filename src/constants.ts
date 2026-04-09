export interface Location {
  lat: number;
  lng: number;
  name: string;
}

export interface TrafficSegment {
  startIndex: number;
  endIndex: number;
  level: 'low' | 'medium' | 'high';
}

export interface RestStop {
  id: string;
  name: string;
  type: 'gas' | 'restaurant' | 'cafe' | 'rest_area' | 'viewpoint';
  coordinate: [number, number];
  distanceFromStart: number; // km
  timeFromStart: number; // minutes
}

export interface Route {
  id: string;
  name: string;
  distance: number; // in km
  duration: number; // in minutes
  trafficDelay: number; // in minutes
  trafficLevel: 'low' | 'medium' | 'high';
  coordinates: [number, number][];
  instructions: string[];
  trafficSegments?: TrafficSegment[];
  restStops?: RestStop[];
  totalRestTime?: number; // minutes
}

export const MOCK_LOCATIONS: Location[] = [
  { name: "Downtown Center", lat: 40.7128, lng: -74.0060 },
  { name: "Airport Terminal", lat: 40.6413, lng: -73.7781 },
  { name: "Suburban Heights", lat: 40.8501, lng: -73.9212 },
  { name: "Tech Park", lat: 40.7484, lng: -73.9857 },
  { name: "Harbor District", lat: 40.7033, lng: -74.0170 },
];

export interface Incident {
  id: string;
  type: 'accident' | 'roadworks' | 'hazard';
  description: string;
  lat: number;
  lng: number;
  confirmations: number;
  reportedBy: string;
  timestamp: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  rank: number;
  avatar: string;
}

export interface CarType {
  id: string;
  name: string;
  color: string;
  icon: 'car' | 'truck' | 'bus' | 'sport' | 'ufo' | 'rocket';
  description: string;
  price: number;
  stats: {
    speed: number;      // 1-10
    efficiency: number; // 1-10 (better routing)
    points: number;     // multiplier
  };
}

export const CAR_TYPES: CarType[] = [
  { 
    id: 'classic', 
    name: 'Clásico CHRONA', 
    color: '#10b981', 
    icon: 'car', 
    description: 'El modelo estándar, confiable y eficiente.', 
    price: 0,
    stats: { speed: 5, efficiency: 5, points: 1.0 }
  },
  { 
    id: 'sport', 
    name: 'Velocista Deportivo', 
    color: '#ef4444', 
    icon: 'sport', 
    description: 'Para los que aman la velocidad (con precaución).', 
    price: 500,
    stats: { speed: 8, efficiency: 6, points: 1.2 }
  },
  { 
    id: 'truck', 
    name: 'Eco-Carga', 
    color: '#3b82f6', 
    icon: 'truck', 
    description: 'Robusto y espacioso para grandes entregas.', 
    price: 800,
    stats: { speed: 4, efficiency: 7, points: 1.5 }
  },
  { 
    id: 'bus', 
    name: 'Transporte Colectivo', 
    color: '#f59e0b', 
    icon: 'bus', 
    description: 'Ideal para mover a todo el equipo.', 
    price: 1200,
    stats: { speed: 4, efficiency: 8, points: 2.0 }
  },
  { 
    id: 'ufo', 
    name: 'Explorador Galáctico', 
    color: '#a855f7', 
    icon: 'ufo', 
    description: 'Tecnología de otro mundo para evitar el tráfico.', 
    price: 5000,
    stats: { speed: 9, efficiency: 9, points: 3.0 }
  },
  { 
    id: 'rocket', 
    name: 'CHRONA Apollo', 
    color: '#f97316', 
    icon: 'rocket', 
    description: '¡Directo a tu destino a velocidad luz!', 
    price: 10000,
    stats: { speed: 10, efficiency: 10, points: 5.0 }
  },
];

export const BADGES: Badge[] = [
  { id: 'flex', name: 'Campeón de Rutas Flexibles', icon: '🛣️', description: 'Usó 10 rutas alternativas sugeridas.' },
  { id: 'zero', name: 'Rey del Kilómetro Cero', icon: '👑', description: 'Redujo su huella de carbono en un 20%.' },
  { id: 'helper', name: 'Guardián del Tráfico', icon: '🛡️', description: 'Reportó 5 incidentes confirmados.' },
  { id: 'early', name: 'Madrugador CHRONA', icon: '🌅', description: 'Viajó 5 veces en horario valle (antes de las 7 AM).' },
  { id: 'night', name: 'Búho de la Ruta', icon: '🦉', description: 'Viajó 5 veces en horario valle nocturno (después de las 8 PM).' },
  { id: 'streak', name: 'Racha Imparable', icon: '🔥', description: 'Usó CHRONA por 7 días consecutivos.' },
];

export const MOCK_LEADERBOARD: LeaderboardUser[] = [
  { id: '1', name: 'Alex R.', points: 12500, rank: 1, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  { id: '2', name: 'Sofia M.', points: 11200, rank: 2, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia' },
  { id: '3', name: 'Diego L.', points: 9800, rank: 3, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diego' },
  { id: '4', name: 'Elena V.', points: 8400, rank: 4, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena' },
  { id: '5', name: 'Marco T.', points: 7600, rank: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco' },
];

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string
  time: string; // HH:mm
  location?: string;
  suggestedDeparture?: string; // HH:mm
  estimatedTravelTime?: number; // minutes
}

export interface TripRecord {
  id: string;
  startTime: number;
  endTime: number;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: number;
  routeId: string;
  date: string;
}

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Reunión de Negocios',
    date: new Date().toISOString().split('T')[0],
    time: '14:30',
    location: 'Downtown Center'
  },
  {
    id: 'ev-2',
    title: 'Cita Médica',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '09:00',
    location: 'Suburban Heights'
  },
  {
    id: 'ev-3',
    title: 'Almuerzo con Equipo',
    date: new Date().toISOString().split('T')[0],
    time: '13:00',
    location: 'Tech Park'
  }
];

export const MOCK_TRIP_HISTORY: TripRecord[] = [
  {
    id: 'trip-1',
    startTime: Date.now() - 172800000,
    endTime: Date.now() - 172800000 + 1800000,
    startLocation: 'Home',
    endLocation: 'Downtown Center',
    distance: 12.5,
    duration: 30,
    routeId: 'route-1',
    date: '2026-03-23'
  },
  {
    id: 'trip-2',
    startTime: Date.now() - 86400000,
    endTime: Date.now() - 86400000 + 2400000,
    startLocation: 'Downtown Center',
    endLocation: 'Airport Terminal',
    distance: 25.0,
    duration: 40,
    routeId: 'route-2',
    date: '2026-03-24'
  }
];

export async function fetchAllRoutes(start: Location, end: Location): Promise<Route[]> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`
    );
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    // Map all available routes
    const routes: Route[] = data.routes.map((osrmRoute: any, index: number) => {
      const coordinates: [number, number][] = osrmRoute.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
      
      const instructions = osrmRoute.legs[0].steps.map((step: any) => {
        const modifier = step.maneuver.modifier ? ` ${step.maneuver.modifier}` : '';
        const type = step.maneuver.type;
        const name = step.name ? ` en ${step.name}` : '';
        
        if (type === 'depart') return `Inicia en ${start.name}`;
        if (type === 'arrive') return `Has llegado a ${end.name}`;
        
        const translations: Record<string, string> = {
          'turn': 'Gira',
          'new name': 'Continúa por',
          'merge': 'Incorpórate a',
          'on ramp': 'Toma la rampa hacia',
          'off ramp': 'Sal por la rampa hacia',
          'fork': 'Mantente a la',
          'roundabout': 'En la rotonda, toma la salida',
          'exit roundabout': 'Sal de la rotonda'
        };
        
        const translatedType = translations[type] || type;
        return `${translatedType}${modifier}${name}`;
      }).filter((instr: string) => instr.length > 0);

      const durationBase = osrmRoute.duration / 60;
      
      // Simulate real-time traffic variations for demo purposes
      // In a real app, this data would come from a traffic API
      const trafficMultipliers = [1.0, 1.4, 2.8]; // low, medium, high
      const multiplier = trafficMultipliers[index] || 1.0;
      
      const totalDuration = Math.round(durationBase * multiplier);
      const trafficDelay = totalDuration - Math.round(durationBase);
      
      // Calculate speed ratio: normal_time / current_time
      const speedRatio = durationBase / totalDuration;
      let level: 'low' | 'medium' | 'high' = 'low';
      
      if (speedRatio >= 0.8) level = 'low';
      else if (speedRatio >= 0.4) level = 'medium';
      else level = 'high';

      const trafficSegments: TrafficSegment[] = [];
      const segmentCount = Math.min(8, Math.floor(coordinates.length / 5));
      if (segmentCount > 0) {
        const segmentSize = Math.floor(coordinates.length / segmentCount);
        for (let i = 0; i < segmentCount; i++) {
          const startIdx = i * segmentSize;
          const endIdx = (i === segmentCount - 1) ? coordinates.length - 1 : (i + 1) * segmentSize;
          
          // Randomize segments but bias towards the route's overall level
          let segmentLevel: 'low' | 'medium' | 'high' = level;
          const rand = Math.random();
          if (rand > 0.7) {
            const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
            segmentLevel = levels[Math.floor(Math.random() * 3)];
          }
          
          trafficSegments.push({ startIndex: startIdx, endIndex: endIdx, level: segmentLevel });
        }
      } else {
        trafficSegments.push({ startIndex: 0, endIndex: coordinates.length - 1, level });
      }

      // Smart Rest Planner Logic
      let restStops: RestStop[] = [];
      let totalRestTime = 0;
      if (totalDuration > 120) { // > 2 hours
        const breakInterval = 150; // Every 2.5 hours
        const numberOfBreaks = Math.floor(totalDuration / breakInterval);
        
        for (let i = 1; i <= numberOfBreaks; i++) {
          const breakTime = i * breakInterval;
          const progress = breakTime / totalDuration;
          const coordIndex = Math.floor(progress * (coordinates.length - 1));
          const coordinate = coordinates[coordIndex];
          
          const types: RestStop['type'][] = ['gas', 'restaurant', 'cafe', 'rest_area', 'viewpoint'];
          const type = types[Math.floor(Math.random() * types.length)];
          const names = {
            gas: 'Estación de Servicio CHRONA',
            restaurant: 'Restaurante El Viajero',
            cafe: 'Café de la Ruta',
            rest_area: 'Área de Descanso Segura',
            viewpoint: 'Mirador Panorámico'
          };

          restStops.push({
            id: `rest-${Math.random().toString(36).substr(2, 5)}`,
            name: names[type],
            type,
            coordinate,
            distanceFromStart: Math.round(osrmRoute.distance / 1000 * progress),
            timeFromStart: breakTime
          });
          totalRestTime += 20; // 20 minutes per break
        }
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: index === 0 ? "Ruta Optimizada CHRONA" : index === 1 ? "Ruta Estándar" : "Vía Alternativa",
        distance: osrmRoute.distance / 1000,
        duration: totalDuration,
        trafficDelay: trafficDelay > 0 ? trafficDelay : 0,
        trafficLevel: level,
        coordinates,
        instructions: instructions.length > 0 ? instructions : ["Sigue las indicaciones del mapa"],
        trafficSegments,
        restStops,
        totalRestTime
      };
    });

    return routes;
  } catch (error) {
    console.error("Error fetching routes:", error);
    return [];
  }
}

export async function fetchRealRoute(start: Location, end: Location, level: 'low' | 'medium' | 'high'): Promise<Route> {
  try {
    // We use alternatives=true to get multiple options if available
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`
    );
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    // Pick a route based on level
    // level 'low' -> fastest (usually index 0)
    // level 'medium' -> index 1 if exists
    // level 'high' -> index 2 if exists
    let routeIndex = 0;
    if (level === 'medium' && data.routes.length > 1) routeIndex = 1;
    if (level === 'high' && data.routes.length > 2) routeIndex = 2;
    
    const osrmRoute = data.routes[routeIndex] || data.routes[0];
    const coordinates: [number, number][] = osrmRoute.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
    
    // Extract instructions from steps
    const instructions = osrmRoute.legs[0].steps.map((step: any) => {
      const modifier = step.maneuver.modifier ? ` ${step.maneuver.modifier}` : '';
      const type = step.maneuver.type;
      const name = step.name ? ` en ${step.name}` : '';
      
      if (type === 'depart') return `Inicia en ${start.name}`;
      if (type === 'arrive') return `Has llegado a ${end.name}`;
      
      // Translate common maneuvers
      const translations: Record<string, string> = {
        'turn': 'Gira',
        'new name': 'Continúa por',
        'merge': 'Incorpórate a',
        'on ramp': 'Toma la rampa hacia',
        'off ramp': 'Sal por la rampa hacia',
        'fork': 'Mantente a la',
        'roundabout': 'En la rotonda, toma la salida',
        'exit roundabout': 'Sal de la rotonda'
      };
      
      const translatedType = translations[type] || type;
      return `${translatedType}${modifier}${name}`;
    }).filter((instr: string) => instr.length > 0);

    const durationBase = osrmRoute.duration / 60; // seconds to minutes
    
    // Simulate traffic based on requested level
    const trafficMultipliers = { 'low': 1.1, 'medium': 1.5, 'high': 2.6 };
    const multiplier = trafficMultipliers[level];
    
    const totalDuration = Math.round(durationBase * multiplier);
    const trafficDelay = totalDuration - Math.round(durationBase);

    // Calculate speed ratio for verification
    const speedRatio = durationBase / totalDuration;
    let detectedLevel: 'low' | 'medium' | 'high' = 'low';
    if (speedRatio >= 0.8) detectedLevel = 'low';
    else if (speedRatio >= 0.4) detectedLevel = 'medium';
    else detectedLevel = 'high';

    // Generate traffic segments for visualization
    const trafficSegments: TrafficSegment[] = [];
    const segmentCount = Math.min(8, Math.floor(coordinates.length / 5));
    if (segmentCount > 0) {
      const segmentSize = Math.floor(coordinates.length / segmentCount);
      for (let i = 0; i < segmentCount; i++) {
        const start = i * segmentSize;
        const end = (i === segmentCount - 1) ? coordinates.length - 1 : (i + 1) * segmentSize;
        
        let segmentLevel: 'low' | 'medium' | 'high' = detectedLevel;
        const rand = Math.random();
        if (rand > 0.7) {
          const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
          segmentLevel = levels[Math.floor(Math.random() * 3)];
        }
        
        trafficSegments.push({ startIndex: start, endIndex: end, level: segmentLevel });
      }
    } else {
      trafficSegments.push({ startIndex: 0, endIndex: coordinates.length - 1, level: detectedLevel });
    }

    // Smart Rest Planner Logic
    let restStops: RestStop[] = [];
    let totalRestTime = 0;
    if (totalDuration > 120) { // > 2 hours
      const breakInterval = 150; // Every 2.5 hours
      const numberOfBreaks = Math.floor(totalDuration / breakInterval);
      
      for (let i = 1; i <= numberOfBreaks; i++) {
        const breakTime = i * breakInterval;
        const progress = breakTime / totalDuration;
        const coordIndex = Math.floor(progress * (coordinates.length - 1));
        const coordinate = coordinates[coordIndex];
        
        const types: RestStop['type'][] = ['gas', 'restaurant', 'cafe', 'rest_area', 'viewpoint'];
        const type = types[Math.floor(Math.random() * types.length)];
        const names = {
          gas: 'Estación de Servicio CHRONA',
          restaurant: 'Restaurante El Viajero',
          cafe: 'Café de la Ruta',
          rest_area: 'Área de Descanso Segura',
          viewpoint: 'Mirador Panorámico'
        };

        restStops.push({
          id: `rest-${Math.random().toString(36).substr(2, 5)}`,
          name: names[type],
          type,
          coordinate,
          distanceFromStart: Math.round(osrmRoute.distance / 1000 * progress),
          timeFromStart: breakTime
        });
        totalRestTime += 20; // 20 minutes per break
      }
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: level === 'low' ? "Ruta Optimizada CHRONA" : level === 'medium' ? "Ruta Estándar" : "Vía Principal",
      distance: osrmRoute.distance / 1000, // meters to km
      duration: totalDuration,
      trafficDelay: trafficDelay > 0 ? trafficDelay : 0,
      trafficLevel: level,
      coordinates,
      instructions: instructions.length > 0 ? instructions : ["Sigue las indicaciones del mapa"],
      trafficSegments,
      restStops,
      totalRestTime
    };
  } catch (error) {
    console.error("Error fetching real route:", error);
    throw error;
  }
}
