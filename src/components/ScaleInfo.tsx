import React from 'react';
import { Scale } from '../types/scale';
import { formatName } from '../utils/IntervalUtils';
import { getIntervalType } from '../utils/scaleUtils';

interface ScaleInfoProps {
  scale: Scale;
  isPlaying: boolean;
  isLoaded: boolean;
  playScale: () => void;
}

const ScaleInfo: React.FC<ScaleInfoProps> = ({
  scale,
  isPlaying,
  isLoaded,
  playScale
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{scale.name}</h3>
        <button
          onClick={playScale}
          disabled={isPlaying || !isLoaded}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-2 md:mt-0"
        >
          {isPlaying ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Playing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Play Scale
            </>
          )}
        </button>
      </div>
      
      {/* Scale Structure */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Scale Structure</h4>
        <div className="bg-white p-3 rounded-md shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Notes:</span> {scale.degrees.length - 1}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Degrees:</span> {scale.degrees.join(', ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Intervals:</span> {scale.intervals.join(', ')}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Interval Names:</span> {scale.intervals.map(interval => getIntervalType(interval)).join(', ')}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Description */}
      {scale.description && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Description</h4>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <p className="text-sm text-gray-700">{scale.description}</p>
          </div>
        </div>
      )}
      
      {/* Categories */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Categories</h4>
        <div className="bg-white p-3 rounded-md shadow-sm">
          {scale.categories && Object.keys(scale.categories).length > 0 ? (
            Object.entries(scale.categories).map(([category, values]) => (
              <div key={category} className="mb-2 last:mb-0">
                <span className="text-sm font-medium text-indigo-600">{formatName(category)}:</span>{' '}
                <span className="text-sm text-gray-700">{values.join(', ')}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No categories available</p>
          )}
        </div>
      </div>
      
      {/* Properties */}
      {scale.properties && Object.keys(scale.properties).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Properties</h4>
          <div className="bg-white p-3 rounded-md shadow-sm">
            {Object.entries(scale.properties).map(([key, value]) => (
              <div key={key} className="mb-2 last:mb-0">
                <span className="text-sm font-medium text-indigo-600">{formatName(key)}:</span>{' '}
                <span className="text-sm text-gray-700">{value.toString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScaleInfo; 