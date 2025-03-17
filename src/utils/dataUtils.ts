import { ScaleData, Scale } from '../types/scale';
import { formatName } from './IntervalUtils';

// Load scale data from multiple sources
export const loadScaleData = async (): Promise<ScaleData> => {
  try {
    console.log("Starting to load scale data...");
    
    // Load scales from all three files
    const [modesResponse, culturalResponse, extraResponse] = await Promise.all([
      fetch('/data/modes.json'),
      fetch('/data/CulturalEtc.json'),
      fetch('/data/extraScales.json')
    ]);
    
    console.log("Fetch responses received:", {
      modesStatus: modesResponse.status,
      culturalStatus: culturalResponse.status,
      extraStatus: extraResponse.status
    });
    
    const modesData = await modesResponse.json();
    const culturalData = await culturalResponse.json();
    const extraData = await extraResponse.json();
    
    console.log("JSON data parsed:", {
      modesDataType: typeof modesData,
      modesIsArray: Array.isArray(modesData),
      modesLength: Array.isArray(modesData) ? modesData.length : 'N/A',
      culturalDataKeys: Object.keys(culturalData),
      extraDataKeys: Object.keys(extraData)
    });
    
    // Create a merged data structure
    const mergedData: ScaleData = {
      title: "31-EDO Scales",
      families: {}
    };
    
    // Process modes data (array format)
    if (Array.isArray(modesData) && modesData.length > 0) {
      // Create a "Modes" family
      mergedData.families["Modes"] = {
        name: "Modes",
        scales: modesData
      };
      console.log(`Added Modes family with ${modesData.length} scales`);
    }
    
    // Process cultural data (object with categories)
    if (culturalData) {
      // Each key in culturalData is a category
      Object.entries(culturalData).forEach(([category, scales]) => {
        if (Array.isArray(scales) && scales.length > 0) {
          const formattedCategory = formatName(category);
          mergedData.families[category] = {
            name: formattedCategory,
            scales: scales as Scale[]
          };
          console.log(`Added cultural category ${category} with ${scales.length} scales`);
        }
      });
    }
    
    // Process extra scales data (object with categories)
    if (extraData) {
      // Each key in extraData is a category
      Object.entries(extraData).forEach(([category, scales]) => {
        if (Array.isArray(scales) && scales.length > 0) {
          const formattedCategory = formatName(category);
          mergedData.families[category] = {
            name: formattedCategory,
            scales: scales as Scale[]
          };
          console.log(`Added extra category ${category} with ${scales.length} scales`);
        }
      });
    }
    
    console.log("Final merged data structure:", {
      familyCount: Object.keys(mergedData.families).length,
      familyNames: Object.keys(mergedData.families)
    });
    
    return mergedData;
  } catch (error) {
    console.error('Error loading scale data:', error);
    throw error;
  }
};

// Extract all available categories from scale data
export const extractCategories = (scaleData: ScaleData): string[] => {
  const categories = new Set<string>();
  
  // Iterate through all scales in all families
  Object.values(scaleData.families).forEach(family => {
    family.scales.forEach(scale => {
      if (scale.categories) {
        Object.keys(scale.categories).forEach(category => {
          categories.add(category);
        });
      }
    });
  });
  
  return Array.from(categories).sort();
};

// Filter and sort scales based on criteria
export const filterAndSortScales = (
  scales: Scale[],
  searchTerm: string,
  selectedCategory: string,
  noteCount: number | null,
  sortBy: 'name' | 'noteCount' | 'brightness',
  sortDirection: 'asc' | 'desc'
): Scale[] => {
  // Apply filters
  let filtered = [...scales];
  
  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(scale => {
      // Search in name
      if (scale.name && scale.name.toLowerCase().includes(term)) return true;
      
      // Search in description
      if (scale.description && scale.description.toLowerCase().includes(term)) return true;
      
      // Search in categories
      if (scale.categories) {
        for (const [category, values] of Object.entries(scale.categories)) {
          if (category.toLowerCase().includes(term)) return true;
          if (values.some(value => value.toLowerCase().includes(term))) return true;
        }
      }
      
      return false;
    });
  }
  
  // Filter by category
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(scale => {
      if (!scale.categories) return false;
      
      for (const [category, _values] of Object.entries(scale.categories)) {
        if (category === selectedCategory) return true;
      }
      
      return false;
    });
  }
  
  // Filter by note count
  if (noteCount !== null) {
    filtered = filtered.filter(scale => scale.degrees.length === noteCount + 1); // +1 for octave
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    if (sortBy === 'name') {
      return sortDirection === 'asc' 
        ? (a.name || '').localeCompare(b.name || '') 
        : (b.name || '').localeCompare(a.name || '');
    }
    
    if (sortBy === 'noteCount') {
      const countA = a.degrees.length;
      const countB = b.degrees.length;
      return sortDirection === 'asc' ? countA - countB : countB - countA;
    }
    
    if (sortBy === 'brightness') {
      // Calculate brightness based on interval content
      // Higher values of intervals = brighter scale
      const brightnessA = a.intervals.reduce((sum, interval) => sum + interval, 0);
      const brightnessB = b.intervals.reduce((sum, interval) => sum + interval, 0);
      return sortDirection === 'asc' ? brightnessA - brightnessB : brightnessB - brightnessA;
    }
    
    return 0;
  });
  
  return filtered;
}; 