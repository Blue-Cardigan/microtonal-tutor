import { ScaleData, Scale } from '../types/scale';
import { formatName } from './IntervalUtils';

// Cache for family metadata
let familyMetadataCache: Record<string, { name: string, count: number }> | null = null;

// Cache for loaded scales by family
const scalesByFamilyCache: Record<string, Scale[]> = {};

// Load just the family metadata (names and counts)
export const loadScaleFamilies = async (): Promise<Record<string, { name: string, count: number }>> => {
  // Return from cache if available
  if (familyMetadataCache) {
    return familyMetadataCache;
  }
  
  try {
    console.log("Loading scale family metadata...");
    
    // Load just metadata from a new endpoint
    const response = await fetch('/data/scale-families-metadata.json');
    
    // If the metadata endpoint doesn't exist yet, fall back to calculating it
    if (!response.ok) {
      const fullData = await loadScaleData();
      
      // Create metadata from full data
      const metadata: Record<string, { name: string, count: number }> = {};
      Object.entries(fullData.families).forEach(([key, family]) => {
        metadata[key] = {
          name: family.name,
          count: family.scales.length
        };
      });
      
      familyMetadataCache = metadata;
      return metadata;
    }
    
    const metadata = await response.json();
    console.log("Metadata loaded:", metadata);
    familyMetadataCache = metadata;
    return metadata;
    
  } catch (error) {
    console.error('Error loading scale family metadata:', error);
    throw error;
  }
};

// Load scales for a specific family
export const loadScalesForFamily = async (familyName: string): Promise<Scale[]> => {
  // Return from cache if available
  if (scalesByFamilyCache[familyName]) {
    return scalesByFamilyCache[familyName];
  }
  
  try {
    
    // Fall back to loading from the appropriate main file
    if (familyName === "Modes") {
      const response = await fetch('/data/modes.json');
      const scales = await response.json();
      scalesByFamilyCache[familyName] = scales;
      return scales;
    }
    
    // Check cultural data
    const culturalResponse = await fetch('/data/CulturalEtc.json');
    const culturalData = await culturalResponse.json();
    if (culturalData[familyName]) {
      scalesByFamilyCache[familyName] = culturalData[familyName];
      return culturalData[familyName];
    }
    
    // Check extra scales data
    const extraResponse = await fetch('/data/extraScales.json');
    const extraData = await extraResponse.json();
    if (extraData[familyName]) {
      scalesByFamilyCache[familyName] = extraData[familyName];
      return extraData[familyName];
    }
    
    // If we got here, we couldn't find the family
    console.error(`Could not find scales for family: ${familyName}`);
    return [];
    
  } catch (error) {
    console.error(`Error loading scales for family ${familyName}:`, error);
    throw error;
  }
};

// Load scale data from multiple sources
export const loadScaleData = async (): Promise<ScaleData> => {
  try {
    
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
          if (values.some(value => value.toString().toLowerCase().includes(term))) return true;
        }
      }
      
      // Search in properties
      if (scale.properties) {
        for (const [property, value] of Object.entries(scale.properties)) {
          if (property.toLowerCase().includes(term)) return true;
          if (value.toString().toLowerCase().includes(term)) return true;
        }
      }
      
      // Search in intervals
      if (scale.intervals && scale.intervals.join('-').includes(term)) return true;
      
      return false;
    });
  }
  
  // Filter by category
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(scale => {
      // Check categories
      if (scale.categories && Object.keys(scale.categories).includes(selectedCategory)) {
        return true;
      }
      
      // Check properties
      if (scale.properties && Object.keys(scale.properties).includes(selectedCategory)) {
        return true;
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
      // Use properties.brightness if available
      const brightnessA = typeof a.properties?.brightness === 'number' 
        ? a.properties.brightness 
        : a.intervals.reduce((sum, interval) => sum + interval, 0) / a.intervals.length;
      
      const brightnessB = typeof b.properties?.brightness === 'number'
        ? b.properties.brightness
        : b.intervals.reduce((sum, interval) => sum + interval, 0) / b.intervals.length;
      
      return sortDirection === 'asc' ? brightnessA - brightnessB : brightnessB - brightnessA;
    }
    
    return 0;
  });
  
  return filtered;
}; 