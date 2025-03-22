import fs from 'fs';
import path from 'path';

async function generateMetadata() {
  // Load all scale data
  const modesData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/modes.json'), 'utf8'));
  const culturalData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/CulturalEtc.json'), 'utf8'));
  const extraData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/extraScales.json'), 'utf8'));
  
  // Create metadata object
  const metadata: Record<string, { name: string, count: number }> = {};
  
  // Process modes data
  if (Array.isArray(modesData) && modesData.length > 0) {
    metadata["Modes"] = {
      name: "Modes",
      count: modesData.length
    };
  }
  
  // Process cultural data
  if (culturalData) {
    Object.entries(culturalData).forEach(([category, scales]) => {
      if (Array.isArray(scales) && scales.length > 0) {
        metadata[category] = {
          name: formatName(category),
          count: scales.length
        };
      }
    });
  }
  
  // Process extra scales data
  if (extraData) {
    Object.entries(extraData).forEach(([category, scales]) => {
      if (Array.isArray(scales) && scales.length > 0) {
        metadata[category] = {
          name: formatName(category),
          count: scales.length
        };
      }
    });
  }
  
  // Write metadata to file
  fs.writeFileSync(
    path.join(process.cwd(), 'public/data/scale-families-metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log(`Generated metadata for ${Object.keys(metadata).length} scale families`);
}

function formatName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

generateMetadata().catch(console.error); 