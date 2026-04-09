import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export interface TrafficSuggestion {
  bestTime: string;
  alternativeRouteDescription: string;
  estimatedSavingMinutes: number;
  reasoning: string;
}

export interface PredictionResult {
  estimatedTimeMinutes: number;
  confidenceScore: number;
  weatherImpact: string;
  historicalContext: string;
  optimizedDepartureTime: string;
}

export interface VoiceIntent {
  intent: 'SET_DESTINATION' | 'QUERY_TRAFFIC' | 'QUERY_DEPARTURE' | 'FIND_SERVICES' | 'QUERY_REST' | 'UNKNOWN';
  destination?: string;
  serviceType?: 'gas' | 'restaurant' | 'cafe' | 'rest_area' | 'viewpoint';
  response: string;
}

export async function extractVoiceIntent(transcript: string, language: string = 'es-ES'): Promise<VoiceIntent> {
  const baseLang = language.split('-')[0];
  const langName = {
    'es': 'español',
    'en': 'inglés',
    'pt': 'portugués',
    'fr': 'francés',
    'de': 'alemán',
    'it': 'italiano',
    'ja': 'japonés',
    'zh': 'chino',
    'ru': 'ruso',
    'ko': 'coreano',
    'ar': 'árabe',
    'hi': 'hindi'
  }[baseLang] || 'español';

  const prompt = `
    Eres el asistente de voz de CHRONA, una aplicación de navegación inteligente.
    Analiza la siguiente transcripción de voz del usuario y determina su intención.
    
    Transcripción: "${transcript}"
    
    Intenciones posibles:
    - SET_DESTINATION: El usuario quiere ir a un lugar específico. Ejemplos: "llévame a...", "quiero ir a...", "navegar a...", "dónde queda...", "ruta hacia...", "ir a...". Extrae el nombre del lugar lo más preciso posible.
    - QUERY_TRAFFIC: El usuario pregunta por el tráfico actual. Ejemplos: "¿cómo está el tráfico?", "¿hay mucho tráfico?", "estado de la vía".
    - QUERY_DEPARTURE: El usuario pregunta a qué hora debe salir. Ejemplos: "¿a qué hora salgo?", "¿cuándo debo irme?", "hora de salida recomendada".
    - FIND_SERVICES: El usuario busca servicios cercanos. Ejemplos: "busca una gasolinera", "tengo hambre", "quiero café", "baños cerca".
    - QUERY_REST: El usuario pregunta cuándo debe parar a descansar. Ejemplos: "¿cuándo descanso?", "¿falta mucho para la parada?", "necesito un descanso".
    - UNKNOWN: No se entiende la intención o es un saludo sin comando.
    
    Para serviceType usa: 'gas', 'restaurant', 'cafe', 'rest_area', 'viewpoint'.
    
    REGLA CRÍTICA: Si el usuario menciona un lugar, SIEMPRE usa SET_DESTINATION y extrae el lugar en el campo 'destination'.
    
    REGLA DE IDIOMA: Proporciona una respuesta amable y concisa en ${langName} para ser leída por voz (TTS).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { 
              type: Type.STRING, 
              enum: ['SET_DESTINATION', 'QUERY_TRAFFIC', 'QUERY_DEPARTURE', 'FIND_SERVICES', 'QUERY_REST', 'UNKNOWN'] 
            },
            destination: { type: Type.STRING },
            serviceType: { 
              type: Type.STRING,
              enum: ['gas', 'restaurant', 'cafe', 'rest_area', 'viewpoint']
            },
            response: { type: Type.STRING },
          },
          required: ["intent", "response"],
        },
      },
    });

    return JSON.parse(response.text || "{}") as VoiceIntent;
  } catch (error) {
    console.error("Error extracting voice intent:", error);
    const fallbackResponses: any = {
      'es': "Lo siento, no pude procesar tu solicitud. ¿Podrías repetirla?",
      'en': "I'm sorry, I couldn't process your request. Could you repeat it?",
      'pt': "Sinto muito, não consegui processar seu pedido. Você poderia repetir?",
      'fr': "Désolé, je n'ai pas pu traiter votre demande. Pourriez-vous répéter ?",
      'de': "Entschuldigung, ich konnte Ihre Anfrage nicht bearbeiten. Könnten Sie das wiederholen?",
      'it': "Scusa, non sono riuscito a elaborare la tua richiesta. Potresti ripetere?",
      'ja': "申し訳ありませんが、リクエストを処理できませんでした。もう一度言っていただけますか？",
      'zh': "抱歉，我无法处理您的请求。您能重复一遍吗？",
      'ru': "Извините, я не смог обработать ваш запрос. Не могли бы вы повторить?",
      'ko': "죄송합니다. 요청을 처리할 수 없습니다. 다시 말씀해 주시겠어요?",
      'ar': "عذراً، لم أتمكن من معالجة طلبك. هل يمكنك التكرار؟",
      'hi': "क्षमा करें, मैं आपके अनुरोध पर कार्रवाई नहीं कर सका। क्या आप इसे दोहरा सकते हैं?"
    };
    return {
      intent: 'UNKNOWN',
      response: fallbackResponses[baseLang] || fallbackResponses['es']
    };
  }
}

export async function predictTravelTime(
  origin: string,
  destination: string,
  arrivalTime: string,
  weather: string,
  currentTime: string,
  isWeatherConnected: boolean = false
): Promise<PredictionResult> {
  const prompt = `
    As CHRONA's advanced predictive engine, analyze the following trip:
    Origin: ${origin}
    Destination: ${destination}
    Desired Arrival Time: ${arrivalTime}
    Current Time: ${currentTime}
    Current Weather: ${weather}
    Weather Service Status: ${isWeatherConnected ? 'CONNECTED (Real-time atmospheric synchronization active)' : 'DISCONNECTED (Using standard forecast)'}
    
    Using historical traffic patterns and real-time data simulation, provide:
    1. Estimated travel time in minutes (considering the current time and the goal to arrive at ${arrivalTime}).
    2. A confidence score (0-100).
    3. Impact of weather on this specific route.
    4. Historical context (e.g., "Typical Wednesday morning rush").
    5. The EXACT departure time the user should leave at to arrive exactly at ${arrivalTime}.
    
    ${isWeatherConnected ? 'IMPORTANT: Since the Weather Service is connected, provide much more specific and precise atmospheric insights.' : ''}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedTimeMinutes: { type: Type.NUMBER },
            confidenceScore: { type: Type.NUMBER },
            weatherImpact: { type: Type.STRING },
            historicalContext: { type: Type.STRING },
            optimizedDepartureTime: { type: Type.STRING },
          },
          required: ["estimatedTimeMinutes", "confidenceScore", "weatherImpact", "historicalContext", "optimizedDepartureTime"],
        },
      },
    });

    return JSON.parse(response.text || "{}") as PredictionResult;
  } catch (error) {
    console.error("Error predicting travel time:", error);
    return {
      estimatedTimeMinutes: 45,
      confidenceScore: 70,
      weatherImpact: "Normal conditions",
      historicalContext: "Standard traffic flow",
      optimizedDepartureTime: "In 15 minutes"
    };
  }
}
