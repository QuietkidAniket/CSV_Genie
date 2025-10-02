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

  const parseCSV = (text: string): { headers: string[], data: CSVRow[] } => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
        throw new Error("CSV must have a header row and at least one data row.");
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const data: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length !== headers.length) {
          console.warn(`Skipping malformed row ${i + 1}: expected ${headers.length} columns, found ${values.length}`);
          continue;
        }
        const row: CSVRow = {};
        headers.forEach((header, index) => {
            const value = values[index].trim();
            // Attempt to convert to number if possible
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
        const { headers, data } = parseCSV(text);
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
    event.target.value = ''; // Reset input to allow re-uploading the same file
  }, [onFileLoad, setError]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors duration-300 bg-gray-800/50">
        {isParsing ? <Loader /> : (
            <>
                <div className="flex justify-center items-center mb-4">
                    <UploadIcon className="w-12 h-12 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300">Drop your CSV here or click to upload</h3>
                <p className="text-gray-500 mt-2">Select any CSV file from your device.</p>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isParsing}
                />
            </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;