import React from 'react';

interface ViewModeToggleProps {
  viewMode: 'basic' | 'advanced';
  setViewMode: (mode: 'basic' | 'advanced') => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, setViewMode }) => {
  return (
    <div className="mb-4 flex justify-end">
      <div className="inline-flex rounded-md shadow-sm">
        <button
          onClick={() => setViewMode('basic')}
          className={`px-4 py-2 text-sm font-medium rounded-l-md ${
            viewMode === 'basic'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Basic
        </button>
        <button
          onClick={() => setViewMode('advanced')}
          className={`px-4 py-2 text-sm font-medium rounded-r-md ${
            viewMode === 'advanced'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Advanced
        </button>
      </div>
    </div>
  );
};

export default ViewModeToggle; 