import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import QueryInput from './components/QueryInput';
import DataTable from './components/DataTable';
import Loader from './components/Loader';
import ErrorMessage from './components/ErrorMessage';
import { fetchFilteredData } from './services/apiService';
import type { CSVRow } from './types';

function App() {
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [originalData, setOriginalData] = useState<CSVRow[] | null>(null);
  const [filteredData, setFilteredData] = useState<CSVRow[] | null>(null);
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileLoad = useCallback((loadedHeaders: string[], loadedData: CSVRow[]) => {
    setHeaders(loadedHeaders);
    setOriginalData(loadedData);
    setFilteredData(loadedData);
    setError(null);
    setQuery('');
  }, []);

  const handleQuerySubmit = useCallback(async () => {
    if (!query.trim() || !originalData) return;

    setIsLoading(true);
    setError(null);

    try {
      const newFilteredData = await fetchFilteredData(query, originalData);
      setFilteredData(newFilteredData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while querying data.');
      }
      setFilteredData(originalData); // On error, show the original data
    } finally {
      setIsLoading(false);
    }
  }, [query, originalData]);
  
  const resetApp = () => {
    setHeaders(null);
    setOriginalData(null);
    setFilteredData(null);
    setQuery('');
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                CSV Query Genie
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                Upload your CSV, ask a question in plain English, and let AI filter the data for you instantly.
            </p>
        </header>
        
        <ErrorMessage message={error as string} />

        {!originalData ? (
          <FileUpload onFileLoad={handleFileLoad} setError={setError} />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={resetApp}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Upload New CSV
              </button>
            </div>
            <QueryInput 
              query={query}
              setQuery={setQuery}
              onSubmit={handleQuerySubmit}
              isLoading={isLoading}
            />
            {isLoading && !filteredData && <Loader />}
            {filteredData && headers && (
              <DataTable headers={headers} data={filteredData} />
            )}
          </div>
        )}
      </main>
       <footer className="text-center py-6 text-gray-600 text-sm">
            <p>Powered by Gemini API. Built with React & Tailwind CSS.</p>
        </footer>
    </div>
  );
}

export default App;
