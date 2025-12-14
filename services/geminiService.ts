import { GoogleGenAI } from "@google/genai";
import { WeatherInfo, Coordinates } from "../types";

// Safety check for process.env in pure browser environments
const getApiKey = () => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY || "";
    }
    return "";
  } catch (e) {
    return "";
  }
};

const GEMINI_API_KEY = getApiKey();

export const fetchCoastalConditions = async (coords: Coordinates): Promise<WeatherInfo> => {
  if (!GEMINI_API_KEY) {
    console.warn("API Key not found, returning fallback data.");
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // Prompt optimized for Paraná coast context with detailed Tide Table request
  const prompt = `
    Atue como um especialista em oceanografia e meteorologia para o litoral do Paraná, Brasil.
    As coordenadas atuais são: Latitude ${coords.latitude}, Longitude ${coords.longitude}.
    
    Pesquise e forneça as condições atuais para este local exato.
    Eu preciso de:
    1. Temperatura atual (ex: 28°C).
    2. Condição do tempo (ex: Ensolarado, Nublado, Chuva).
    3. Altura das ondas aproximada.
    4. Horário do pôr do sol hoje (ex: 18:45).
    5. Índice UV máximo previsto para hoje (ex: 8 - Muito Alto).
    6. TÁBUA DE MARÉS COMPLETA PARA HOJE: Liste todos os horários de maré Alta e Baixa para o dia de hoje no porto mais próximo (Paranaguá ou Pontal do Sul).

    Responda APENAS com um JSON válido (sem markdown block) no seguinte formato estrito:
    {
      "temperature": "string",
      "condition": "string",
      "waveHeight": "string",
      "sunset": "string",
      "uvIndex": "string",
      "tideSummary": "string (resumo ex: Baixa 10h, Alta 16h)",
      "tideEvents": [
        { "time": "HH:MM", "height": "0.0m", "type": "Alta" },
        { "time": "HH:MM", "height": "0.0m", "type": "Baixa" }
      ]
    }
    Ordene os eventos de maré por horário.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    
    // Extract JSON from potential markdown wrappers
    const jsonMatch = text?.match(/\{[\s\S]*\}/);
    let data: any = {};
    
    if (jsonMatch) {
      try {
        data = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse JSON from Gemini", e);
        data = {
          temperature: "--",
          condition: "Erro ao obter dados",
          tideSummary: "N/D",
          waveHeight: "N/D",
          sunset: "--:--",
          uvIndex: "--",
          tideEvents: []
        };
      }
    }

    // Extract grounding sources
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));

    return {
      temperature: data.temperature || "--",
      condition: data.condition || "Indisponível",
      tide: data.tideSummary || "Consulte a tabela oficial",
      tideEvents: Array.isArray(data.tideEvents) ? data.tideEvents : [],
      waveHeight: data.waveHeight || "--",
      sunset: data.sunset || "--:--",
      uvIndex: data.uvIndex || "--",
      lastUpdated: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
      sources: sources
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};