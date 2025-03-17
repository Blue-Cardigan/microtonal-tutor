import React from 'react';
import { Scale } from '../types/scale';
import { formatName } from '../utils/IntervalUtils';

interface ScaleListProps {
  scales: Scale[];
  selectedIndex: number;
  onSelectScale: (scale: Scale, index: number) => void;
  familyName: string;
}

const ScaleList: React.FC<ScaleListProps> = ({ 
  scales, 
  selectedIndex, 
  onSelectScale,
  familyName
}) => {
  return (
    <div className="mt-4 bg-white rounded-md shadow-sm border border-gray-200 max-h-96 overflow-y-auto">
      <div className="sticky top-0 bg-gray-50 p-2 border-b border-gray-200 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          {scales.length} scales in {familyName}
        </span>
        <span className="text-xs text-gray-500">
          {scales.length > 0 ? `${selectedIndex + 1} of ${scales.length}` : '0 of 0'}
        </span>
      </div>
      
      {scales.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No scales match your criteria
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {scales.map((scale, index) => (
            <li 
              key={index}
              className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${index === selectedIndex ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
              onClick={() => onSelectScale(scale, index)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`text-sm font-medium ${index === selectedIndex ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {scale.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {scale.degrees.length - 1} notes
                    </span>
                    {scale.categories && Object.keys(scale.categories).slice(0, 2).map(category => (
                      <span key={category} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        {formatName(category)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {scale.intervals.join('-')}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ScaleList; 