import type { CSVRow } from '../types';

const API_BASE_URL = '/api';

export const fetchFilteredData = async (query: string, data: CSVRow[]): Promise<CSVRow[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query, data: data }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ detail: 'Server error.' }));
      throw new Error(`Server error: ${response.status}. ${errorBody.detail || ''}`);
    }

    return await response.json() as CSVRow[];
  } catch (error) {
    console.error('Failed to fetch filtered data:', error);
    throw new Error('Could not connect to the backend service.');
  }
};