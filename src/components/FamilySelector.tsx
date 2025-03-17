import React from 'react';
import { ScaleData } from '../types/scale';

interface FamilySelectorProps {
  families: string[];
  selectedFamily: string;
  onFamilyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  scaleData: ScaleData;
}

const FamilySelector: React.FC<FamilySelectorProps> = ({
  families,
  selectedFamily,
  onFamilyChange,
  scaleData
}) => {
  return (
    <div>
      <label htmlFor="family-select" className="block text-sm font-medium text-gray-700 mb-1">
        Scale Family
      </label>
      <select
        id="family-select"
        className="w-full p-2 border text-gray-800 border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        value={selectedFamily}
        onChange={onFamilyChange}
      >
        {families.map(family => {
          // Determine the source of the family
          let source = "";
          if (family === "Modes") {
            source = "Modes";
          } else if (["cultural", "nonSequentialHeptatonic", "variableCardinality"].includes(family)) {
            source = "Cultural";
          } else if (["historical", "hybrid", "mos", "transformed", "wellFormed", "xenharmonic"].includes(family)) {
            source = "Extra";
          }
          
          return (
            <option key={family} value={family}>
              {scaleData.families[family].name} {source ? `(${source})` : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default FamilySelector; 