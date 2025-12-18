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
  const todayDate = new Date().toLocaleDateString('pt-BR');
  
  // Prompt optimized for SINGLE SOURCE extraction
  const prompt = `
    Tarefa: Extrair dados oceanográficos e meteorológicos para Paranaguá (PR), Brasil.
    Data alvo: ${todayDate}.
    
    REGRA DE FONTE ÚNICA:
    Para garantir a precisão e consistência dos dados, você deve extrair as informações EXCLUSIVAMENTE do site "tabuademares.com".
    
    Instrução de Busca:
    1. Utilize a ferramenta de busca para: "site:tabuademares.com tábua de marés clima Paranaguá ${todayDate}".

    Extraia os dados encontrados neste resultado específico e responda estritamente neste JSON:
    {
      "temperature": "Temperatura do ar atual (ex: 28°C)",
      "condition": "Condição do céu (ex: Ensolarado)",
      "waveHeight": "Altura das ondas (ex: 0.8m)",
      "sunset": "Horário do pôr do sol hoje (HH:MM)",
      "uvIndex": "Índice UV máximo previsto",
      "tideSummary": "Coeficiente de maré ou estado atual (ex: Coef. 78 alto)",
      "tideEvents": [
        { "time": "HH:MM", "height": "0.0m", "type": "Alta" },
        { "time": "HH:MM", "height": "0.0m", "type": "Baixa" }
      ]
    }

    REGRAS DE EXTRAÇÃO:
    - Em "tideEvents", liste TODOS os horários de maré (Picos de Alta e Baixa) para o dia de HOJE.
    - O site tabuademares.com apresenta uma tabela clara. Copie os dados de lá.
    - Se não conseguir acessar este site específico, retorne o JSON com campos vazios ou nulos, mas NÃO use outras fontes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Very low temperature for strict extraction
        temperature: 0.1, 
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
          condition: "Erro ao ler dados",
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
      tide: data.tideSummary || "Fonte: Tábua de Marés",
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