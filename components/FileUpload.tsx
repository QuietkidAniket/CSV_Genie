import React, { useCallback, useState } from 'react';
import type { CSVRow } from '../types';
import UploadIcon from './icons/UploadIcon';
import Loader from './Loader';

interface FileUploadProps {
  onFileLoad: (headers: string[], data: CSVRow[]) => void;
  setError: (error: string | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoad, setError }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [headerRow, setHeaderRow] = useState(1);

  const parseCSV = (text: string, headerRowNumber: number): { headers: string[], data: CSVRow[] } => {
    const lines = text.trim().split('\n');
    const headerIndex = headerRowNumber - 1;

    if (lines.length < headerRowNumber + 1) {
        throw new Error(`CSV must have at least ${headerRowNumber + 1} rows to find the header and one data row.`);
    }
    
    const headers = lines[headerIndex].split(',').map(h => h.trim());
    const data: CSVRow[] = [];

    for (let i = headerIndex + 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',');
        if (values.length !== headers.length) {
          console.warn(`Skipping malformed row ${i + 1}: expected ${headers.length} columns, found ${values.length}.`);
          continue;
        }

        const row: CSVRow = {};
        headers.forEach((header, index) => {
            const value = values[index].trim();
            row[header] = !isNaN(Number(value)) && value !== '' ? Number(value) : value;
        });
        data.push(row);
    }
    return { headers, data };
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error("File is empty or could not be read.");
        }
        const { headers, data } = parseCSV(text, headerRow);
        onFileLoad(headers, data);
      } catch (err) {
        if (err instanceof Error) {
          setError(`Failed to parse CSV: ${err.message}`);
        } else {
          setError('An unknown error occurred during parsing.');
        }
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
        setError('Failed to read the file.');
        setIsParsing(false);
    }
    reader.readAsText(file);
    event.target.value = '';
  }, [onFileLoad, setError, headerRow]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors duration-300 bg-gray-800/50">
        {isParsing ? <Loader /> : (
            <>
                {/* This input captures clicks for file upload */}
                <input
                    type="file"
                    accept=".csv, .txt"
                    onChange={handleFileChange}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isParsing}
                />

                {/* All visible content sits below the file input layer */}
                <div className="flex justify-center items-center mb-4">
                    <UploadIcon className="w-12 h-12 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300">Drop your CSV here or click to upload</h3>
                <p className="text-gray-500 mt-2">Select any CSV file from your device.</p>
                
                {/* By giving this div a higher z-index, it sits ON TOP of the invisible file input */}
                <div className="relative z-20 mt-6">
                    <label htmlFor="header-row" className="font-medium text-gray-300 mr-3">
                      Header is on row:
                    </label>
                    <input
                      type="number"
                      id="header-row"
                      value={headerRow}
                      onChange={(e) => setHeaderRow(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-20 bg-gray-700 border border-gray-600 rounded-md p-2 text-center text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      min="1"
                      disabled={isParsing}
                    />
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;