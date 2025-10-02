import type { CSVRow } from '../types';

// const API_BASE_URL = 'http://127.0.0.1:8000'; // for local testing

// Use a relative path that will point to our new API route
const API_BASE_URL = '/api';

export const fetchFilteredData = async (query: string, data: CSVRow[]): Promise<CSVRow[]> => {
  try {
    // The fetch URL will now correctly be "/api/query"
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        data: data,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ detail: 'The server returned an invalid error response.' }));
      throw new Error(`Server error: ${response.status} ${response.statusText}. ${errorBody.detail || ''}`);
    }

    const filteredData = await response.json();
    return filteredData as CSVRow[];
  } catch (error) {
    console.error('Failed to fetch filtered data:', error);
    throw new Error('Could not connect to the backend service. Please ensure it is running and accessible.');
  }
};