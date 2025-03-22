import React, { useState, useEffect } from 'react';
import { Scale } from '../types/scale';

interface ScaleFavoritesProps {
  onSelectScale: (scale: Scale, index: number) => void;
  allScales: Scale[];
  selectedScale: Scale | null;
}

const ScaleFavorites: React.FC<ScaleFavoritesProps> = ({
  onSelectScale,
  allScales,
  selectedScale
}) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('scaleFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error loading favorites:', e);
        setFavorites([]);
      }
    }
  }, []);
  
  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem('scaleFavorites', JSON.stringify(favorites));
  }, [favorites]);
  
  const isCurrentScaleFavorite = selectedScale ? favorites.includes(selectedScale.name) : false;
  
  const toggleFavorite = () => {
    if (!selectedScale) return;
    
    if (isCurrentScaleFavorite) {
      setFavorites(favorites.filter(name => name !== selectedScale.name));
    } else {
      setFavorites([...favorites, selectedScale.name]);
    }
  };
  
  // Get the actual scale objects from the favorites array of names
  const favoriteScales = allScales.filter(scale => favorites.includes(scale.name));
  
  // Select a scale from favorites
  const handleFavoriteSelect = (scale: Scale) => {
    const index = allScales.findIndex(s => s.name === scale.name);
    if (index !== -1) {
      onSelectScale(scale, index);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-semibold text-gray-800">Favorite Scales</h3>
        
        {selectedScale && (
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-full transition-colors ${
              isCurrentScaleFavorite
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title={isCurrentScaleFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path 
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" 
              />
            </svg>
          </button>
        )}
      </div>
      
      {favoriteScales.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400 mb-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <p className="text-sm">No favorite scales yet</p>
          <p className="text-xs mt-1">Click the star icon to add the current scale to your favorites</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {favoriteScales.map(scale => (
            <div
              key={scale.name}
              onClick={() => handleFavoriteSelect(scale)}
              className={`
                p-2 rounded-md border transition-all cursor-pointer flex items-center
                ${selectedScale?.name === scale.name ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}
              `}
            >
              <div className="text-yellow-500 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{scale.name}</div>
                <div className="text-xs text-gray-500">{scale.degrees.length - 1} notes</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScaleFavorites; 