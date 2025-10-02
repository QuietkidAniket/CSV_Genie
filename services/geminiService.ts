
import { GoogleGenAI, Type } from "@google/genai";
import type { FilterCondition } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateFilter = async (query: string, headers: string[]): Promise<FilterCondition[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }

  const prompt = `
    You are an AI data analysis assistant. Your task is to convert a user's natural language query into a structured JSON filter based on the provided CSV headers.

    CSV Headers: ${JSON.stringify(headers)}

    User Query: "${query}"

    Generate a JSON object representing these filters. The JSON should be an array of filter objects.
    Each object must have 'header', 'operator', and 'value'.
    - The 'header' must be one of the provided CSV Headers.
    - The 'operator' must be one of the supported operators.
    - The 'value' should be a number for numeric comparisons if the user specifies a number, otherwise a string.

    Supported operators:
    - '===' (strict equality for strings or numbers)
    - '!==' (strict inequality for strings or numbers)
    - '>' (greater than)
    - '<' (less than)
    - '>=' (greater than or equal to)
    - '<=' (less than or equal to)
    - 'contains' (for string inclusion, case-insensitive)
    - '!contains' (for string exclusion, case-insensitive)
    
    If the query is ambiguous or cannot be converted into a filter based on the headers, return an empty array [].
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            filters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  header: { type: Type.STRING, enum: headers },
                  operator: { type: Type.STRING, enum: ['===', '!==', '>', '<', '>=', '<=', 'contains', '!contains'] },
                  value: { type: Type.STRING } // Gemini schema is limited, we get string and parse to number later if needed
                },
                required: ["header", "operator", "value"]
              }
            }
          },
          required: ["filters"]
        },
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
      console.warn("Gemini returned an empty response.");
      return [];
    }
    
    const result = JSON.parse(jsonText);

    // Post-process values to numbers where appropriate
    return result.filters.map((filter: any) => {
        const valueStr = String(filter.value);
        if (['>', '<', '>=', '<='].includes(filter.operator) && !isNaN(Number(valueStr))) {
            return { ...filter, value: Number(valueStr) };
        }
        return filter;
    });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate filter from AI: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI.");
  }
};
