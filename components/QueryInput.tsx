import React from 'react';
import MagicWandIcon from './icons/MagicWandIcon';

interface QueryInputProps {
  query: string;
  setQuery: (query: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const QueryInput: React.FC<QueryInputProps> = ({ query, setQuery, onSubmit, isLoading }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      onSubmit();
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto my-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g., Show me sales from the 'North' region with more than 100 units sold"
        className="w-full pl-4 pr-32 py-3 bg-gray-800 border-2 border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-200 placeholder-gray-500"
        disabled={isLoading}
      />
      <button
        onClick={onSubmit}
        disabled={isLoading || !query.trim()}
        className="absolute inset-y-0 right-0 flex items-center px-4 m-1.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
      >
        <MagicWandIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-pulse' : ''}`} />
        {isLoading ? 'Thinking...' : 'Query'}
      </button>
    </div>
  );
};

export default QueryInput;