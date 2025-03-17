export interface Chord {
  degree: number;
  degreeRoman: string;
  type: string;
  function: string;
  notes: number[];
  intervals: number[];
}

export interface Scale {
  name: string;
  degrees: number[];
  intervals: number[];
  modifications: string[];
  description?: string;
  properties?: {
    [key: string]: string | number | boolean;
  };
  categories: {
    [key: string]: string[];
  };
  chordSystem?: {
    chordsByDegree: {
      [key: string]: {
        name: string;
        chords: Chord[];
      }[];
    };
    chordsByFunction: {
      [key: string]: {
        name: string;
        chords: Chord[];
      }[];
    };
  };
}

export interface ScaleFamily {
  name: string;
  scales: Scale[];
}

export interface ScaleData {
  title: string;
  families: {
    [key: string]: ScaleFamily;
  };
}

export interface ScaleBrowserProps {
  onHighlightNotes?: (notes: Set<number>) => void;
  onChordSelect?: (chord: {
    notes: number[];
    type: string;
    degreeRoman: string;
  } | null) => void;
  onScaleSelect?: (scale: {
    name: string;
    degrees: number[];
  } | null) => void;
}

// Define Roman numeral mapping
export const ROMAN_NUMERALS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];
export const ROMAN_NUMERALS_MAJOR = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']; 