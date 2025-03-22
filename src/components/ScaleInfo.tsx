import React from 'react';
import { Scale } from '../types/scale';
import { formatName } from '../utils/IntervalUtils';

interface ScaleInfoProps {
  scale: Scale;
  isPlaying: boolean;
  isLoaded: boolean;
  playScale: () => void;
  handlePrevScale: () => void;
  handleNextScale: () => void;
}

const ScaleInfo: React.FC<ScaleInfoProps> = ({
  scale,
  isPlaying,
  isLoaded,
  playScale,
  handlePrevScale,
  handleNextScale
}) => {
  return (
    <div className="p-2">
      <div className="flex justify-between items-center space-x-1 mb-2">
          <button
            onClick={handlePrevScale}
            className="p-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            disabled={isPlaying}
            title="Previous Scale"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={handleNextScale}
            className="p-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            disabled={isPlaying}
            title="Next Scale"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{scale.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{scale.description}</p>
        </div>
        <button
          onClick={playScale}
          disabled={!isLoaded || isPlaying}
          className={`p-2 rounded-full transition-colors ${
            isPlaying
              ? 'bg-indigo-100 text-indigo-600'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
          }`}
          title={isPlaying ? "Playing..." : "Play Scale"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Categories */}
      {scale.categories && Object.keys(scale.categories).length > 0 && (
      <div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {Object.entries(scale.categories).map(([category, values]) => (
                <div key={category} className="space-y-1">
                  <span className="text-sm font-medium text-indigo-600">{formatName(category)}</span>
                  <div className="flex flex-wrap gap-1">
                    {values.map((value, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Properties */}
      {scale.properties && Object.keys(scale.properties).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Properties</h4>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(scale.properties).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <span className="text-sm font-medium text-indigo-600">{formatName(key)}</span>
                  <p className="text-sm text-gray-700">{value.toString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScaleInfo; 