import React, { useState, useEffect, useRef } from 'react';
import { getStepNoteName } from '../utils/IntervalUtils';
import { useAudio } from '../utils/AudioContext';

interface CircleVisualizerProps {
  highlightedNotes?: Set<number>;
  selectedScale?: {
    name: string;
    degrees: number[];
  } | null;
  showScale: boolean;
  highlightSource?: 'scale' | 'chord' | 'individual' | null;
}

const CircleVisualizer: React.FC<CircleVisualizerProps> = ({
  highlightedNotes,
  selectedScale,
  showScale,
  highlightSource
}) => {
  const { activeNotes, playNote, stopNote } = useAudio();
  const [useCircleOfFifths, setUseCircleOfFifths] = useState(false);
  const [showConnections, setShowConnections] = useState(true);
  const [localHighlightedNotes, setLocalHighlightedNotes] = useState<Set<number>>(new Set());
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartAngle, setDragStartAngle] = useState(0);
  const [hoverNote, setHoverNote] = useState<number | null>(null);
  const [animatingNote, setAnimatingNote] = useState<number | null>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'fifths'>('standard');

  // Animation ref for cleanup
  const animationRef = useRef<number | null>(null);

  // Sync our local highlighted notes with the prop
  useEffect(() => {
    // Only show highlighted notes for scale playback or chord selection
    // Never show highlights for individual note playing
    if (highlightedNotes && highlightedNotes.size > 0) {
      if (highlightSource === 'individual') {
        // Case: Individual notes are being played - don't show any scale highlights
        setLocalHighlightedNotes(new Set());
      } else if (highlightSource === 'chord') {
        // Case: Chord is selected - always show chord highlights
        // Normalize the notes to their octave position for the circle display
        setLocalHighlightedNotes(new Set(Array.from(highlightedNotes).map(note => note === 31 ? 0 : note % 31)));
      } else if (highlightSource === 'scale') {
        // Only show scale notes if showScale is true
        if (showScale) {
          const normalizedNotes = new Set(Array.from(highlightedNotes).map(note => note === 31 ? 0 : note % 31));
          setLocalHighlightedNotes(normalizedNotes);
          console.log('CircleVisualizer: showing scale highlights');
        } else {
          // Scale highlighting is turned off
          setLocalHighlightedNotes(new Set());
          console.log('CircleVisualizer: scale highlights disabled by showScale toggle');
        }
      } else {
        // Default case: don't highlight anything
        setLocalHighlightedNotes(new Set());
      }
    } else if (selectedScale && showScale && highlightSource === 'scale') {
      // No specific highlights but we have a scale and showScale is true
      // Show all scale degrees
      const normalizedScaleNotes = new Set(selectedScale.degrees.map(note => note === 31 ? 0 : note % 31));
      setLocalHighlightedNotes(normalizedScaleNotes);
      console.log('CircleVisualizer: showing full scale');
    } else {
      // No external highlights or showScale is false, clear local ones
      setLocalHighlightedNotes(new Set());
      console.log('CircleVisualizer: cleared all highlights');
    }
  }, [highlightedNotes, highlightSource, showScale, selectedScale]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Toggle between view modes
  const toggleViewMode = () => {
    if (viewMode === 'standard') {
      setViewMode('fifths');
      setUseCircleOfFifths(true);
    } else {
      setViewMode('standard');
      setUseCircleOfFifths(false);
    }
  };

  // Generate note positions based on the selected ordering
  const generateNotePositions = () => {
    const positions: { note: number; angle: number }[] = [];
    const totalNotes = 31;
    const radius = 150; // Base radius of the circle in pixels

    if (viewMode === 'fifths') {
      // Circle of fifths ordering
      const circleOfFifthsOrder = [0, 18, 5, 23, 10, 28, 15, 2, 20, 7, 25, 12, 30, 17, 4, 22, 9, 27, 14, 1, 19, 6, 24, 11, 29, 16, 3, 21, 8, 26, 13];
      
      circleOfFifthsOrder.forEach((note, index) => {
        const angle = ((index * 2 * Math.PI) / totalNotes) - (Math.PI / 2) + (rotationAngle * Math.PI / 180);
        positions.push({ note, angle });
      });
    } else {
      // Sequential ordering (0-31)
      for (let i = 0; i <= 30; i++) {
        const angle = (i * 2 * Math.PI / totalNotes) + (rotationAngle * Math.PI / 180);
        positions.push({ note: i, angle });
      }
    }

    return positions.map(({ note, angle }) => {
      // Calculate position with the rotation applied
      const x = parseFloat((radius * Math.cos(angle)).toFixed(3));
      const y = parseFloat((radius * Math.sin(angle)).toFixed(3));
      
      return { note, x, y, angle };
    });
  };

  const notePositions = generateNotePositions();

  // Function to normalize a note to its position within the octave
  const normalizeNote = (note: number): number => {
    return ((note - 1) % 31) + 1;
  };

  // Mouse event handlers for rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!circleRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = circleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate angle between center and mouse position
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
    setDragStartAngle(angle - rotationAngle);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !circleRef.current) return;
    
    const rect = circleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate new angle between center and current mouse position
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
    setRotationAngle(angle - dragStartAngle);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Use useEffect to add global event listeners for mouse move and up
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!circleRef.current) return;
        
        const rect = circleRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
        setRotationAngle(angle - dragStartAngle);
      };
      
      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStartAngle]);

  // Handle note click
  const handleNoteClick = (note: number) => {
    playNote(note);
    
    // Animate the note
    setAnimatingNote(note);
    setTimeout(() => setAnimatingNote(null), 300);
  };

  // Create note connections for visualization
  const renderConnections = () => {
    if (!showConnections || !selectedScale || !showScale || localHighlightedNotes.size < 2) {
      return null;
    }

    const connections = [];
    const highlightedPositions = notePositions.filter(pos => localHighlightedNotes.has(pos.note));
    
    // Sort by angle for sequential connections
    highlightedPositions.sort((a, b) => {
      const angleA = a.angle < 0 ? a.angle + 2 * Math.PI : a.angle;
      const angleB = b.angle < 0 ? b.angle + 2 * Math.PI : b.angle;
      return angleA - angleB;
    });

    // Create path for the connections
    if (highlightedPositions.length > 0) {
      let pathCommands = `M ${highlightedPositions[0].x + 150} ${highlightedPositions[0].y + 150}`;
      
      for (let i = 1; i < highlightedPositions.length; i++) {
        pathCommands += ` L ${highlightedPositions[i].x + 150} ${highlightedPositions[i].y + 150}`;
      }
      
      // Close the path for a complete polygon
      pathCommands += ` L ${highlightedPositions[0].x + 150} ${highlightedPositions[0].y + 150}`;
      
      connections.push(
        <path
          key="scale-connections"
          d={pathCommands}
          fill="rgba(79, 70, 229, 0.1)"
          stroke="rgba(79, 70, 229, 0.6)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      );
    }
    
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {connections}
      </svg>
    );
  };

  // Get note color based on its properties
  const getNoteColor = (note: number, isHighlighted: boolean, isHovered: boolean) => {
    if (animatingNote === note) {
      return 'bg-green-400 scale-125';
    }
    if (isHovered) {
      return isHighlighted 
        ? 'bg-indigo-400 ring-2 ring-white scale-110' 
        : 'bg-gray-200 ring-2 ring-indigo-200 scale-110';
    }
    if (isHighlighted) {
      return highlightSource === 'chord' 
        ? 'bg-green-500 text-white' 
        : 'bg-indigo-500 text-white';
    }
    return 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50';
  };

  return (
    <div className="bg-white rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Circle Visualizer
        </h2>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConnections(!showConnections)}
            className={`p-2 rounded-full transition-colors ${
              showConnections ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
            }`}
            title={showConnections ? "Hide connections" : "Show connections"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleViewMode}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium transition-colors"
            >
              {viewMode === 'standard' ? 'Sequential' : 'Circle of Fifths'}
            </button>
          </div>
        </div>
      </div>

      <div 
        className="relative w-full aspect-square flex items-center justify-center"
        ref={circleRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="relative w-[300px] h-[300px]">
          {/* Outer circle */}
          <div className="absolute inset-0 border-2 border-gray-200 rounded-full" />
          
          {/* Inner circles for reference */}
          <div className="absolute inset-[25%] border border-gray-100 rounded-full opacity-70" />
          <div className="absolute inset-[50%] border border-gray-100 rounded-full opacity-70" />
          
          {/* Scale connections */}
          {renderConnections()}
          
          {/* Notes */}
          {notePositions.map(({ note, x, y }) => {
            const normalizedNote = normalizeNote(note);
            const isHighlighted = localHighlightedNotes.has(note);
            const isHovered = hoverNote === note;
            const colorClasses = getNoteColor(note, isHighlighted, isHovered);
            
            return (
              <div
                key={note}
                className={`absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full cursor-pointer transition-all duration-150 
                  ${colorClasses} ${isDragging ? 'pointer-events-none' : ''}`}
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  zIndex: isHighlighted || isHovered ? 10 : 5,
                  transform: isHighlighted && !isHovered && !isDragging ? 'scale(1.1)' : ''
                }}
                onClick={() => handleNoteClick(note)}
                onMouseEnter={() => setHoverNote(note)}
                onMouseLeave={() => setHoverNote(null)}
              >
                <div className="text-xs font-medium">
                  {getStepNoteName(normalizedNote)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-center mt-3 text-sm text-gray-500">
        <p>Drag to rotate</p>
      </div>
    </div>
  );
};

export default CircleVisualizer; 