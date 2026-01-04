"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { motion, AnimatePresence } from "framer-motion";

// Truncated text component with show more/less
function TruncatedText({ 
  text, 
  maxLength = 50,
  className = "",
}: { 
  text: string; 
  maxLength?: number;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsTruncation = text.length > maxLength;
  
  const displayText = needsTruncation && !isExpanded 
    ? text.slice(0, maxLength).trim() + "..." 
    : text;
  
  return (
    <span className={className}>
      "{displayText}"
      {needsTruncation && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="ml-1 text-cyan-400/70 hover:text-cyan-400 text-xs font-medium transition-colors"
        >
          {isExpanded ? "show less" : "show more"}
        </button>
      )}
    </span>
  );
}

// Feeling options for sharing
const FEELING_OPTIONS = [
  { feeling: "hopeful", color: "#22d3ee", emoji: "✨" },
  { feeling: "peaceful", color: "#a78bfa", emoji: "🌸" },
  { feeling: "grateful", color: "#34d399", emoji: "💚" },
  { feeling: "tender", color: "#fb7185", emoji: "🌷" },
  { feeling: "calm", color: "#38bdf8", emoji: "🌊" },
  { feeling: "reflective", color: "#fbbf24", emoji: "🌅" },
  { feeling: "anxious", color: "#f472b6", emoji: "💭" },
  { feeling: "tired", color: "#94a3b8", emoji: "🌙" },
];

// Sample feelings data for the globe - using precise coordinates (20 static feelings)
// Using negative IDs to avoid conflict with database IDs
const SAMPLE_FEELINGS = [
  { id: -1, lng: -122.4194, lat: 37.7749, feeling: "hopeful", user: "someone in San Francisco", color: "#22d3ee", time: "2m ago", message: "the fog cleared today" },
  { id: -2, lng: 2.3522, lat: 48.8566, feeling: "peaceful", user: "someone in Paris", color: "#a78bfa", time: "5m ago", message: "coffee by the seine" },
  { id: -3, lng: 139.6917, lat: 35.6895, feeling: "grateful", user: "someone in Tokyo", color: "#34d399", time: "8m ago", message: "cherry blossoms are early" },
  { id: -4, lng: -43.1729, lat: -22.9068, feeling: "tender", user: "someone in Rio", color: "#fb7185", time: "12m ago", message: "missing home" },
  { id: -5, lng: 151.2093, lat: -33.8688, feeling: "calm", user: "someone in Sydney", color: "#38bdf8", time: "15m ago", message: "ocean sounds" },
  { id: -6, lng: 77.2090, lat: 28.6139, feeling: "reflective", user: "someone in Delhi", color: "#fbbf24", time: "18m ago", message: "monsoon thoughts" },
  { id: -7, lng: -0.1276, lat: 51.5074, feeling: "grateful", user: "someone in London", color: "#34d399", time: "22m ago", message: "tea and rain" },
  { id: -8, lng: 31.2357, lat: 30.0444, feeling: "peaceful", user: "someone in Cairo", color: "#a78bfa", time: "25m ago", message: "sunset over the nile" },
  { id: -9, lng: -74.0060, lat: 40.7128, feeling: "anxious", user: "someone in New York", color: "#f472b6", time: "28m ago", message: "deadline tomorrow" },
  { id: -10, lng: 116.4074, lat: 39.9042, feeling: "tired", user: "someone in Beijing", color: "#94a3b8", time: "32m ago", message: "long day, longer night" },
  { id: -11, lng: -99.1332, lat: 19.4326, feeling: "hopeful", user: "someone in Mexico City", color: "#22d3ee", time: "35m ago", message: "new beginnings" },
  { id: -12, lng: 37.6173, lat: 55.7558, feeling: "calm", user: "someone in Moscow", color: "#38bdf8", time: "40m ago", message: "snow falling softly" },
  { id: -13, lng: 18.4241, lat: -33.9249, feeling: "hopeful", user: "someone in Cape Town", color: "#22d3ee", time: "45m ago", message: "table mountain sunrise" },
  { id: -14, lng: 144.9631, lat: -37.8136, feeling: "grateful", user: "someone in Melbourne", color: "#34d399", time: "48m ago", message: "coffee culture vibes" },
  { id: -15, lng: -123.1207, lat: 49.2827, feeling: "peaceful", user: "someone in Vancouver", color: "#a78bfa", time: "52m ago", message: "mountains meet ocean" },
  { id: -16, lng: 103.8198, lat: 1.3521, feeling: "reflective", user: "someone in Singapore", color: "#fbbf24", time: "55m ago", message: "city lights at night" },
  { id: -17, lng: 12.4964, lat: 41.9028, feeling: "tender", user: "someone in Rome", color: "#fb7185", time: "1h ago", message: "ancient stories everywhere" },
  { id: -18, lng: -3.7038, lat: 40.4168, feeling: "calm", user: "someone in Madrid", color: "#38bdf8", time: "1h ago", message: "siesta peace" },
  { id: -19, lng: 13.4050, lat: 52.5200, feeling: "anxious", user: "someone in Berlin", color: "#f472b6", time: "1h ago", message: "creative chaos" },
  { id: -20, lng: -79.3832, lat: 43.6532, feeling: "hopeful", user: "someone in Toronto", color: "#22d3ee", time: "1h ago", message: "diverse and vibrant" },
];

// Group feelings by approximate location (within 0.1 degrees ~ 11km for clustering)
function groupFeelingsByLocation(feelings: typeof SAMPLE_FEELINGS) {
  const groups: Map<string, typeof SAMPLE_FEELINGS> = new Map();
  
  feelings.forEach(feeling => {
    // Round to 0.1 degree precision for grouping very nearby feelings only
    const keyLat = Math.round(feeling.lat * 10) / 10;
    const keyLng = Math.round(feeling.lng * 10) / 10;
    const key = `${keyLat},${keyLng}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(feeling);
  });
  
  return groups;
}

// Galaxy Cluster component - shows multiple feelings as orbiting dots with spinning animation
function GalaxyCluster({ 
  feelings: feelingsAtLocation, 
  position,
  opacity,
  onClick,
}: { 
  feelings: typeof SAMPLE_FEELINGS;
  position: { x: number; y: number } | null;
  opacity: number;
  onClick: (feeling: typeof SAMPLE_FEELINGS[0]) => void;
}) {
  const [selectedDot, setSelectedDot] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  if (!position || feelingsAtLocation.length === 0) return null;
  
  const hasMultiple = feelingsAtLocation.length > 1;
  const isFar = opacity < 0.7;
  const feeling = feelingsAtLocation[0]; // For single feeling display
  
  // For single feeling - show with comment
  if (!hasMultiple) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: opacity, scale: isFar ? 0.85 : 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className="absolute pointer-events-auto cursor-pointer z-10"
        style={{ 
          left: position.x + 15, 
          top: position.y - 25,
          filter: isFar ? 'blur(0.5px)' : 'none'
        }}
        onClick={() => onClick(feeling)}
      >
        <div className={`relative max-w-[220px] md:max-w-[280px] px-3 md:px-4 py-2 md:py-3 rounded-xl bg-zinc-900/90 border border-white/[0.08] backdrop-blur-sm transition-all ${isFar ? 'hover:opacity-100' : ''}`}>
          {/* Arrow pointing to dot */}
          <div 
            className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-0 h-0 
              border-t-[6px] border-t-transparent 
              border-b-[6px] border-b-transparent 
              border-r-[6px] border-r-zinc-900/90" 
          />
          
          {/* Feeling label */}
          <p className="text-[11px] md:text-sm font-[family-name:var(--font-smooch-sans)] mb-0.5 text-white/40">
            feeling <span style={{ color: feeling.color }} className="font-medium">{feeling.feeling}</span>
          </p>
          
          {/* Message */}
          <p className="text-sm md:text-base font-[family-name:var(--font-smooch-sans)] leading-tight text-white/70 break-words">
            <TruncatedText text={feeling.message} maxLength={40} />
          </p>
          
          {/* Time */}
          <p className="text-[10px] md:text-xs font-[family-name:var(--font-smooch-sans)] mt-1 text-white/30">
            {feeling.time}
          </p>
          
          {/* Glow effect */}
          <div 
            className="absolute -inset-1 rounded-xl blur-md opacity-20 -z-10"
            style={{ background: feeling.color }}
          />
        </div>
      </motion.div>
    );
  }
  
  // For multiple feelings - show galaxy with spinning orbit
  const orbitRadius = 30;
  const clusterSize = 120;
  const selectedFeeling = selectedDot !== null ? feelingsAtLocation[selectedDot] : feelingsAtLocation[0];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: opacity, scale: isFar ? 0.8 : 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="absolute pointer-events-auto z-10"
      style={{ 
        left: position.x - clusterSize / 2, 
        top: position.y - clusterSize / 2,
        width: clusterSize,
        height: clusterSize,
        filter: isFar ? 'blur(0.3px)' : 'none'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setSelectedDot(null);
      }}
    >
      {/* Galaxy background glow */}
      <motion.div 
        className="absolute rounded-full pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          width: orbitRadius * 2 + 30,
          height: orbitRadius * 2 + 30,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${feelingsAtLocation.map(f => f.color + '30').join(', ')}, transparent 70%)`,
          filter: 'blur(10px)',
        }}
        animate={{ 
          scale: isHovered ? 1.3 : 1,
          opacity: isHovered ? 0.6 : 0.3
        }}
      />
      
      {/* Orbit ring - the circle connecting the dots */}
      <motion.div 
        className="absolute rounded-full border-2 border-dashed pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          width: orbitRadius * 2,
          height: orbitRadius * 2,
          transform: 'translate(-50%, -50%)',
          borderColor: 'rgba(255,255,255,0.15)',
        }}
      />
      
      {/* Spinning container for the dots */}
      <motion.div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          width: 0,
          height: 0,
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Feeling dots arranged in circle and spinning */}
        {feelingsAtLocation.map((f, index) => {
          const angle = (index / feelingsAtLocation.length) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * orbitRadius;
          const y = Math.sin(angle) * orbitRadius;
          const isSelected = selectedDot === index;
          const dotSize = isSelected ? 14 : 10;
          
          return (
            <motion.div
              key={f.id}
              className="absolute cursor-pointer"
              style={{
                left: x - dotSize / 2,
                top: y - dotSize / 2,
                width: dotSize,
                height: dotSize,
              }}
              animate={{ 
                scale: isSelected ? 1.4 : 1,
                // Counter-rotate to keep dots upright
                rotate: -360,
              }}
              transition={{
                scale: { duration: 0.2 },
                rotate: { duration: 30, repeat: Infinity, ease: "linear" }
              }}
              whileHover={{ scale: 1.5 }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDot(index);
                onClick(f);
              }}
              onMouseEnter={() => setSelectedDot(index)}
            >
              {/* Dot glow */}
              <div 
                className="absolute inset-0 rounded-full blur-sm"
                style={{ 
                  background: f.color,
                  opacity: isSelected ? 1 : 0.5,
                }}
              />
              {/* Main dot */}
              <div 
                className="absolute inset-0 rounded-full border-2"
                style={{ 
                  background: `radial-gradient(circle at 30% 30%, ${f.color}, ${f.color}cc)`,
                  borderColor: isSelected ? 'white' : 'rgba(255,255,255,0.3)',
                  boxShadow: isSelected ? `0 0 12px ${f.color}` : `0 0 6px ${f.color}80`,
                }}
              />
            </motion.div>
          );
        })}
      </motion.div>
      
      {/* Center count badge */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-zinc-900/95 border border-white/20 flex items-center justify-center z-20 cursor-pointer"
        whileHover={{ scale: 1.1 }}
        onClick={() => {
          const nextIndex = (selectedDot !== null ? selectedDot + 1 : 1) % feelingsAtLocation.length;
          setSelectedDot(nextIndex);
        }}
      >
        <span className="text-[10px] font-bold text-white">{feelingsAtLocation.length}</span>
      </motion.div>
      
      {/* Connecting line from cluster to tooltip */}
      <motion.div
        className="absolute pointer-events-none z-25"
        style={{
          left: '50%',
          top: '50%',
          width: 50,
          height: 2,
          transformOrigin: 'left center',
        }}
      >
        <div 
          className="w-full h-full"
          style={{
            background: `linear-gradient(to right, ${selectedFeeling.color}60, ${selectedFeeling.color}20)`,
          }}
        />
        {/* Animated pulse along the line */}
        <motion.div
          className="absolute top-0 left-0 w-2 h-full rounded-full"
          style={{ background: selectedFeeling.color }}
          animate={{ x: [0, 48, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      
      {/* Always visible comment tooltip - now clickable */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute left-full top-1/2 -translate-y-1/2 ml-4 z-30 pointer-events-auto cursor-pointer"
        style={{ minWidth: 220, maxWidth: 280 }}
        onClick={() => {
          const nextIndex = ((selectedDot ?? 0) + 1) % feelingsAtLocation.length;
          setSelectedDot(nextIndex);
        }}
      >
        <div 
          className="relative px-3 md:px-4 py-2 md:py-3 rounded-xl bg-zinc-900/95 border-2 backdrop-blur-md shadow-xl transition-all hover:bg-zinc-800/95"
          style={{ borderColor: selectedFeeling.color + '40' }}
        >
          {/* Arrow pointing to cluster - colored */}
          <div 
            className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-0 h-0 
              border-t-[8px] border-t-transparent 
              border-b-[8px] border-b-transparent 
              border-r-[8px]"
            style={{ borderRightColor: selectedFeeling.color + '60' }}
          />
          
          {/* Navigation header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {feelingsAtLocation.map((f, i) => (
                <motion.div 
                  key={f.id}
                  className="rounded-full cursor-pointer transition-all"
                  style={{ 
                    background: f.color,
                    width: selectedDot === i ? 12 : 8,
                    height: selectedDot === i ? 12 : 8,
                    opacity: selectedDot === i ? 1 : 0.4,
                    boxShadow: selectedDot === i ? `0 0 8px ${f.color}` : 'none',
                  }}
                  whileHover={{ scale: 1.3 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDot(i);
                  }}
                />
              ))}
            </div>
            
            {/* Counter */}
            <span className="text-xs md:text-sm text-white/50 font-[family-name:var(--font-smooch-sans)]">
              {(selectedDot ?? 0) + 1} / {feelingsAtLocation.length}
            </span>
          </div>
          
          {/* Current feeling label with colored indicator */}
          <div className="flex items-center gap-2 mb-1">
            <motion.div 
              className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full"
              style={{ background: selectedFeeling.color, boxShadow: `0 0 8px ${selectedFeeling.color}` }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <p className="text-xs md:text-sm font-[family-name:var(--font-smooch-sans)] text-white/60">
              feeling <span style={{ color: selectedFeeling.color }} className="font-semibold">{selectedFeeling.feeling}</span>
            </p>
          </div>
          
          {/* Message */}
          <p className="text-sm md:text-base font-[family-name:var(--font-smooch-sans)] leading-snug text-white/90 pl-5 md:pl-6 break-words">
            <TruncatedText text={selectedFeeling.message} maxLength={50} />
          </p>
          
          {/* Time */}
          <p className="text-[10px] md:text-xs font-[family-name:var(--font-smooch-sans)] mt-1.5 text-white/30 pl-5 md:pl-6">
            {selectedFeeling.time}
          </p>
          
          {/* Click hint */}
          <div className="flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-white/10">
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <span className="text-[10px] md:text-xs text-cyan-400/60 font-[family-name:var(--font-smooch-sans)]">
              click to see next feeling
            </span>
          </div>
          
          {/* Glow effect */}
          <div 
            className="absolute -inset-1 rounded-xl blur-lg opacity-30 -z-10"
            style={{ background: selectedFeeling.color }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function GlobeMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<typeof SAMPLE_FEELINGS[0] | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [visibleComments, setVisibleComments] = useState<Map<string, { x: number; y: number; opacity: number; feelings: typeof SAMPLE_FEELINGS }>>(new Map());
  const [showShareModal, setShowShareModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isAdjustingLocation, setIsAdjustingLocation] = useState(false);
  const [shareFeeling, setShareFeeling] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [feelings, setFeelings] = useState(SAMPLE_FEELINGS); // 30 static + user submissions
  const [currentFeelingIndex, setCurrentFeelingIndex] = useState(0);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [showMyFeelings, setShowMyFeelings] = useState(false);
  const [myFeelings, setMyFeelings] = useState<any[]>([]);
  const [editingFeeling, setEditingFeeling] = useState<any | null>(null);
  const [isEditingPosition, setIsEditingPosition] = useState(false);

  // Show notification helper
  const showNotification = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);
  const rotationRef = useRef<number | null>(null);
  const isUserInteracting = useRef(false);

  // Load user's own feelings
  const loadMyFeelings = useCallback(async () => {
    const token = localStorage.getItem('worldfelt_token');
    if (!token) return;
    
    try {
      const response = await fetch('/api/feelings/mine', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMyFeelings(data);
      }
    } catch (error) {
      console.error('Error loading my feelings:', error);
    }
  }, []);

  // Update feeling position
  const updateFeelingPosition = useCallback(async (id: number, lat: number, lng: number) => {
    const token = localStorage.getItem('worldfelt_token');
    if (!token) return;
    
    try {
      const response = await fetch('/api/feelings/mine', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, latitude: lat, longitude: lng }),
      });
      
      if (response.ok) {
        showNotification('success', 'Position updated!');
        loadMyFeelings();
        // Also update in the main feelings array
        setFeelings(prev => prev.map(f => 
          f.id === id ? { ...f, lat, lng } : f
        ));
      } else {
        showNotification('error', 'Failed to update position');
      }
    } catch (error) {
      console.error('Error updating position:', error);
      showNotification('error', 'Failed to update position');
    }
  }, [showNotification, loadMyFeelings]);

  // Navigate to previous feeling
  const goToPrevFeeling = () => {
    if (feelings.length === 0) return;
    const newIndex = currentFeelingIndex === 0 ? feelings.length - 1 : currentFeelingIndex - 1;
    setCurrentFeelingIndex(newIndex);
    flyToFeeling(feelings[newIndex]);
  };

  // Navigate to next feeling
  const goToNextFeeling = () => {
    if (feelings.length === 0) return;
    const newIndex = currentFeelingIndex === feelings.length - 1 ? 0 : currentFeelingIndex + 1;
    setCurrentFeelingIndex(newIndex);
    flyToFeeling(feelings[newIndex]);
  };

  // Fly to a specific feeling
  const flyToFeeling = (feeling: typeof SAMPLE_FEELINGS[0]) => {
    if (!map.current) return;
    
    map.current.flyTo({
      center: [feeling.lng, feeling.lat],
      zoom: 3,
      duration: 1500,
      essential: true
    });
    
    setSelectedFeeling(feeling);
    isUserInteracting.current = true;
    setTimeout(() => {
      isUserInteracting.current = false;
    }, 5000);
  };

  // Helper function to get relative time
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Load feelings from database and combine with static feelings
  useEffect(() => {
    let isMounted = true;
    
    const loadFeelings = async () => {
      try {
        const response = await fetch('/api/feelings');
        if (response.ok && isMounted) {
          const data = await response.json();
          // Transform API data to match our component format
          const dbFeelings = data.map((f: any) => ({
            id: f.id,
            lng: f.longitude,
            lat: f.latitude,
            feeling: f.feeling,
            user: "someone",
            color: FEELING_OPTIONS.find(opt => opt.feeling === f.feeling)?.color || "#22d3ee",
            time: getTimeAgo(new Date(f.createdAt)),
            message: f.comment || "",
          }));
          
          // Only update if there are new feelings from database
          if (dbFeelings.length > 0) {
            setFeelings(prev => {
              // Check if we actually have new data by comparing IDs
              const prevDbIds = new Set(prev.filter(f => f.id > 0).map(f => f.id));
              const newDbIds = new Set(dbFeelings.map((f: any) => f.id));
              
              // If same IDs, don't update to prevent re-render
              if (prevDbIds.size === newDbIds.size && 
                  [...prevDbIds].every(id => newDbIds.has(id))) {
                return prev;
              }
              
              // Combine static feelings with database feelings
              return [...SAMPLE_FEELINGS, ...dbFeelings];
            });
          }
        }
      } catch (error) {
        console.error('Error loading feelings:', error);
        // Keep static feelings if API fails
      }
    };

    loadFeelings();
    // Refresh feelings every 60 seconds (reduced frequency)
    const interval = setInterval(loadFeelings, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleFeelingClick = useCallback((feeling: typeof SAMPLE_FEELINGS[0]) => {
    setSelectedFeeling(feeling);
    map.current?.flyTo({
      center: [feeling.lng, feeling.lat],
      zoom: 4,
      pitch: 45,
      duration: 2000,
      essential: true,
    });
  }, []);

  // Get user location - with high accuracy GPS
  const getUserLocation = useCallback(() => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      showNotification('error', "Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    // First try with high accuracy (GPS)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`Location found: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
        setUserLocation({ lat: latitude, lng: longitude });
        setIsGettingLocation(false);
        setShowShareModal(true);
        
        // Fly to user location
        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 5,
          pitch: 45,
          duration: 2000,
        });
      },
      (error) => {
        console.error("High accuracy failed, trying low accuracy:", error);
        // Retry with lower accuracy if high accuracy fails
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setIsGettingLocation(false);
            setShowShareModal(true);
            map.current?.flyTo({
              center: [longitude, latitude],
              zoom: 5,
              pitch: 45,
              duration: 2000,
            });
          },
          (finalError) => {
            console.error("All location attempts failed:", finalError);
            setIsGettingLocation(false);
            showNotification('error', "Please enable location access in your browser settings to share your feeling.");
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // GPS accuracy, fresh location
    );
  }, [showNotification]);

  // Share feeling
  const handleShareFeeling = useCallback(async () => {
    if (!userLocation || !shareFeeling || !shareMessage) return;

    try {
      // Get auth token
      const token = localStorage.getItem('worldfelt_token');
      if (!token) {
        showNotification('warning', 'Please login first to share your feelings');
        setShowShareModal(false);
        return;
      }

      // Save to database and show on map
      const response = await fetch('/api/feelings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          feeling: shareFeeling,
          comment: shareMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - token expired or invalid
          showNotification('error', 'Your session expired. Please login again.');
          localStorage.removeItem('worldfelt_token');
          localStorage.removeItem('worldfelt_username');
          localStorage.removeItem('worldfelt_auth');
          setTimeout(() => { window.location.href = '/globe'; }, 1500);
          return;
        }
        if (response.status === 429) {
          // Rate limited - user already shared today
          showNotification('warning', data.message || "You've already shared a feeling today. Come back tomorrow!");
          setShowShareModal(false);
          return;
        }
        throw new Error(data.error || 'Failed to save feeling');
      }

      const savedFeeling = data;
      const feelingOption = FEELING_OPTIONS.find(f => f.feeling === shareFeeling);
      const newFeeling = {
        id: savedFeeling.id,
        lng: userLocation.lng,
        lat: userLocation.lat,
        feeling: shareFeeling,
        user: "you",
        color: feelingOption?.color || "#22d3ee",
        time: "just now",
        message: shareMessage,
      };

      // Add to feelings array so it shows on map
      setFeelings(prev => [newFeeling, ...prev]);

      setShowShareModal(false);
      setShareFeeling("");
      setShareMessage("");
      setSelectedFeeling(newFeeling);
      
      // Fly to the new feeling
      map.current?.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 4,
        pitch: 45,
        duration: 1500,
      });
      
      showNotification('success', 'Your feeling has been shared with the world!');
    } catch (error) {
      console.error('Error saving feeling:', error);
      showNotification('error', 'Failed to share your feeling. Please try again.');
    }
  }, [userLocation, shareFeeling, shareMessage, showNotification]);

  // Toggle rotation
  const toggleRotation = useCallback(() => {
    setIsRotating((prev) => !prev);
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    map.current?.flyTo({
      center: [20, 15],
      zoom: 1.8,
      pitch: 0,
      bearing: 0,
      duration: 1500,
    });
    setSelectedFeeling(null);
  }, []);

  // Random feeling
  const goToRandomFeeling = useCallback(() => {
    const randomFeeling = feelings[Math.floor(Math.random() * feelings.length)];
    handleFeelingClick(randomFeeling);
  }, [handleFeelingClick, feelings]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Dark theme configuration
    const darkStyle = {
      tiles: "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
      background: "#050508",
      rasterOpacity: 0.9,
      saturation: -0.5,
      brightness: 0.7,
    };

    // Initialize the map with globe projection
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        projection: { type: "globe" },
        sky: {
          "sky-color": "#050508",
          "horizon-color": "#0a0a0f",
          "fog-color": "#050508",
          "sky-horizon-blend": 0.8,
          "horizon-fog-blend": 0.5,
          "fog-ground-blend": 1.0,
        },
        light: {
          anchor: "viewport",
          color: "#ffffff",
          intensity: 0.4,
        },
        sources: {
          "carto-tiles": {
            type: "raster",
            tiles: [
              darkStyle.tiles,
              darkStyle.tiles.replace("a.basemaps", "b.basemaps"),
              darkStyle.tiles.replace("a.basemaps", "c.basemaps"),
            ],
            tileSize: 256,
            attribution: '&copy; CARTO',
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": darkStyle.background },
          },
          {
            id: "carto-layer",
            type: "raster",
            source: "carto-tiles",
            minzoom: 0,
            maxzoom: 19,
            paint: {
              "raster-opacity": darkStyle.rasterOpacity,
              "raster-saturation": darkStyle.saturation,
              "raster-brightness-max": darkStyle.brightness,
              "raster-contrast": 0.2,
            },
          },
        ],
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      },
      center: [20, 15],
      zoom: 1.8,
      pitch: 0,
      bearing: 0,
      minZoom: 1.5,
      maxZoom: 12,
      maxPitch: 85,
    });

    // Add navigation controls (compass only, zoom will be custom)
    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: true, showZoom: false, visualizePitch: true }),
      "bottom-right"
    );

    map.current.on("load", () => {
      if (!map.current) return;
      
      setIsLoaded(true);

      // Add GeoJSON source for feelings
      map.current.addSource("feelings", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: feelings.map((f) => ({
            type: "Feature" as const,
            properties: { id: f.id, feeling: f.feeling, user: f.user, color: f.color, time: f.time },
            geometry: { type: "Point" as const, coordinates: [f.lng, f.lat] },
          })),
        },
      });

      // Add glow/halo layer (larger, more transparent)
      map.current.addLayer({
        id: "feelings-glow",
        type: "circle",
        source: "feelings",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 20, 5, 35, 10, 50],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.15,
          "circle-blur": 1,
        },
      });

      // Add pulse layer (medium size)
      map.current.addLayer({
        id: "feelings-pulse",
        type: "circle",
        source: "feelings",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 12, 5, 20, 10, 30],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.25,
          "circle-blur": 0.5,
        },
      });

      // Add main dot layer (small, solid)
      map.current.addLayer({
        id: "feelings-dots",
        type: "circle",
        source: "feelings",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 5, 5, 8, 10, 12],
          "circle-color": ["get", "color"],
          "circle-opacity": 1,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.3,
        },
      });

      // Click handler for feelings
      map.current.on("click", "feelings-dots", (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          const feeling = feelings.find((f) => f.id === props?.id);
          if (feeling) {
            handleFeelingClick(feeling);
          }
        }
      });

      // Change cursor on hover
      map.current.on("mouseenter", "feelings-dots", () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "feelings-dots", () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
      });

      // Update visible comments positions - grouped by location
      const updateCommentPositions = () => {
        if (!map.current) return;
        
        const newPositions = new Map<string, { x: number; y: number; opacity: number; feelings: typeof SAMPLE_FEELINGS }>();
        const bounds = map.current.getBounds();
        const zoom = map.current.getZoom();
        const center = map.current.getCenter();
        
        // Group feelings by approximate location
        const groups = groupFeelingsByLocation(feelings);
        
        groups.forEach((groupFeelings, locationKey) => {
          // Use the first feeling's position as the group position
          const feeling = groupFeelings[0];
          
          // Check if point is in view
          if (bounds && bounds.contains([feeling.lng, feeling.lat])) {
            const point = map.current!.project([feeling.lng, feeling.lat]);
            
            // Calculate angular distance from center to determine if on "back" of globe
            const lngDiff = Math.abs(feeling.lng - center.lng);
            const latDiff = Math.abs(feeling.lat - center.lat);
            const angularDistance = Math.sqrt(lngDiff * lngDiff + latDiff * latDiff);
            
            // Calculate opacity based on distance from center (farther = more faded)
            // Points near the edge (> 60 degrees away) start to fade
            let opacity = 1;
            if (angularDistance > 60) {
              opacity = Math.max(0.3, 1 - (angularDistance - 60) / 60);
            }
            
            // Only show comments at certain zoom levels and if point is on screen
            if (zoom > 1.5 && point.x > 50 && point.x < window.innerWidth - 200 && point.y > 50 && point.y < window.innerHeight - 100) {
              newPositions.set(locationKey, { x: point.x, y: point.y, opacity, feelings: groupFeelings });
            }
          }
        });
        
        setVisibleComments(newPositions);
      };

      // Update on map move
      map.current.on("move", updateCommentPositions);
      map.current.on("zoom", updateCommentPositions);
      
      // Initial update
      setTimeout(updateCommentPositions, 500);
    });

    // Stop rotation on user interaction
    const onInteractionStart = () => {
      isUserInteracting.current = true;
    };
    
    const onInteractionEnd = () => {
      setTimeout(() => {
        isUserInteracting.current = false;
      }, 5000);
    };
    
    map.current.on("mousedown", onInteractionStart);
    map.current.on("touchstart", onInteractionStart);
    map.current.on("wheel", onInteractionStart);
    map.current.on("mouseup", onInteractionEnd);
    map.current.on("touchend", onInteractionEnd);
    map.current.on("dragend", onInteractionEnd);
    map.current.on("zoomend", onInteractionEnd);

    return () => {
      if (rotationRef.current) cancelAnimationFrame(rotationRef.current);
      map.current?.remove();
      map.current = null;
    };
  }, [handleFeelingClick, feelings]);

  // Handle rotation animation
  useEffect(() => {
    if (!isLoaded) return;

    const rotateGlobe = () => {
      if (!map.current || !isRotating || isUserInteracting.current) {
        rotationRef.current = requestAnimationFrame(rotateGlobe);
        return;
      }
      const center = map.current.getCenter();
      center.lng += 0.015;
      map.current.setCenter(center);
      rotationRef.current = requestAnimationFrame(rotateGlobe);
    };

    const timeout = setTimeout(() => {
      rotationRef.current = requestAnimationFrame(rotateGlobe);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      if (rotationRef.current) cancelAnimationFrame(rotationRef.current);
    };
  }, [isLoaded, isRotating]);

  return (
    <>
      {/* Custom Notification Popup */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] pointer-events-auto"
          >
            <div 
              className={`px-5 py-3 rounded-xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 ${
                notification.type === 'success' 
                  ? 'bg-emerald-500/20 border-emerald-500/30' 
                  : notification.type === 'warning'
                  ? 'bg-amber-500/20 border-amber-500/30'
                  : 'bg-red-500/20 border-red-500/30'
              }`}
            >
              <span className="text-lg">
                {notification.type === 'success' ? '✨' : notification.type === 'warning' ? '⚠️' : '❌'}
              </span>
              <p className="text-sm font-[family-name:var(--font-smooch-sans)] text-white/90">
                {notification.message}
              </p>
              <button 
                onClick={() => setNotification(null)}
                className="ml-2 text-white/40 hover:text-white/80 transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map container - full screen */}
      <div 
        ref={mapContainer} 
        className="fixed inset-0 w-screen h-screen z-0"
        style={{ background: "#050508" }}
      />

      {/* Atmospheric glow around globe edges */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,transparent_30%,rgba(34,211,238,0.03)_60%,rgba(5,5,8,0.95)_100%)]" />
      </div>

      {/* Subtle vignette for depth */}
      <div className="fixed inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_120%_120%_at_50%_50%,transparent_20%,rgba(5,5,8,0.5)_70%,rgba(5,5,8,0.9)_100%)]" />

      {/* Top gradient fade */}
      <div className="fixed top-0 left-0 right-0 h-32 z-[2] pointer-events-none bg-gradient-to-b from-zinc-950 via-zinc-950/50 to-transparent" />
      
      {/* Bottom gradient fade */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[2] pointer-events-none bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent"
        style={{ height: 'max(6rem, calc(env(safe-area-inset-bottom) + 5rem))' }}
      />

      {/* Galaxy Clusters - grouped feelings shown as orbiting dots */}
      <AnimatePresence>
        {Array.from(visibleComments.entries()).map(([locationKey, data]) => {
          return (
            <GalaxyCluster
              key={locationKey}
              feelings={data.feelings}
              position={{ x: data.x, y: data.y }}
              opacity={data.opacity}
              onClick={(feeling) => handleFeelingClick(feeling)}
            />
          );
        })}
      </AnimatePresence>

      {/* Interactive Controls Panel - Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-2 px-2 sm:px-0"
        style={{ bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
      >
        {/* Previous Feeling Button - Mobile only */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToPrevFeeling}
          className="w-9 h-9 sm:hidden rounded-lg flex items-center justify-center transition-all bg-zinc-900/90 border border-white/[0.08] hover:bg-zinc-800/90 backdrop-blur-xl text-white/70 hover:text-white"
          title="Previous feeling"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        {/* Drop Pin Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={getUserLocation}
          disabled={isGettingLocation}
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all bg-zinc-900/90 border border-white/[0.08] hover:bg-zinc-800/90 backdrop-blur-xl ${isGettingLocation ? "text-cyan-400" : "text-white/70 hover:text-white"}`}
          title="Drop a feeling at your location"
        >
          {isGettingLocation ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full"
            />
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </motion.button>

        {/* My Feelings Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            loadMyFeelings();
            setShowMyFeelings(true);
          }}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all bg-zinc-900/90 border border-white/[0.08] hover:bg-zinc-800/90 backdrop-blur-xl text-white/70 hover:text-white"
          title="My feelings"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </motion.button>

        {/* Rotation Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleRotation}
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all bg-zinc-900/90 border border-white/[0.08] hover:bg-zinc-800/90 backdrop-blur-xl ${isRotating ? "text-cyan-400" : "text-white/40"}`}
          title={isRotating ? "Pause rotation" : "Resume rotation"}
        >
          {isRotating ? (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
          )}
        </motion.button>

        {/* Reset View */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetView}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all bg-zinc-900/90 border border-white/[0.08] text-white/70 hover:text-white hover:bg-zinc-800/90 backdrop-blur-xl"
          title="Reset view"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.button>

        {/* Random Feeling */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToRandomFeeling}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all bg-zinc-900/90 border border-white/[0.08] text-white/70 hover:text-white hover:bg-zinc-800/90 backdrop-blur-xl"
          title="Discover a random feeling"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </motion.button>

        {/* Divider - hidden on very small screens */}
        <div className="w-px h-5 sm:h-6 bg-white/10 hidden xs:block" />

        {/* Zoom Out */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => map.current?.zoomOut()}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all bg-zinc-900/90 border border-white/[0.08] text-white/70 hover:text-white hover:bg-zinc-800/90 backdrop-blur-xl"
          title="Zoom out"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </motion.button>

        {/* Zoom In */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => map.current?.zoomIn()}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all bg-zinc-900/90 border border-white/[0.08] text-white/70 hover:text-white hover:bg-zinc-800/90 backdrop-blur-xl"
          title="Zoom in"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>

        {/* Divider - hidden on mobile */}
        <div className="w-px h-5 sm:h-6 bg-white/10 hidden sm:block" />

        {/* Feelings Counter - hidden on very small screens, compact on mobile */}
        <div className="h-9 sm:h-11 px-2 sm:px-4 rounded-lg sm:rounded-xl hidden xs:flex items-center gap-1.5 sm:gap-2 bg-zinc-900/90 border border-white/[0.08] backdrop-blur-xl">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400"
          />
          <p className="font-[family-name:var(--font-smooch-sans)] text-xs sm:text-sm text-white/60">
            <span className="text-cyan-400">{feelings.length}</span>
            <span className="hidden sm:inline"> feelings live</span>
          </p>
        </div>

        {/* Next Feeling Button - Mobile only */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToNextFeeling}
          className="w-9 h-9 sm:hidden rounded-lg flex items-center justify-center transition-all bg-zinc-900/90 border border-white/[0.08] hover:bg-zinc-800/90 backdrop-blur-xl text-white/70 hover:text-white"
          title="Next feeling"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>
      </motion.div>

      {/* Location Marker - shown when share modal is open */}
      <AnimatePresence>
        {showShareModal && userLocation && map.current && (
          <motion.div
            key="location-marker"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed z-40 pointer-events-none"
            style={{
              left: map.current.project([userLocation.lng, userLocation.lat]).x,
              top: map.current.project([userLocation.lng, userLocation.lat]).y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="flex flex-col items-center">
              {/* Pin */}
              <motion.div 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-cyan-500 border-4 border-white shadow-lg flex items-center justify-center"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-white rounded-full" />
              </motion.div>
              {/* Pin tip */}
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-cyan-500 -mt-1" />
              {/* Shadow */}
              <div className="w-4 h-1 bg-black/30 rounded-full mt-1 blur-sm" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Feeling Modal */}
      <AnimatePresence>
        {showShareModal && userLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center ${isAdjustingLocation ? 'bg-black/30' : 'bg-black/60'} backdrop-blur-sm`}
            onClick={(e) => {
              if (isAdjustingLocation && map.current) {
                // Get click position on map
                const rect = mapContainer.current?.getBoundingClientRect();
                if (rect) {
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const lngLat = map.current.unproject([x, y]);
                  setUserLocation({ lat: lngLat.lat, lng: lngLat.lng });
                  showNotification('success', 'Location updated!');
                  
                  // Fly to new location
                  map.current.flyTo({
                    center: [lngLat.lng, lngLat.lat],
                    zoom: 5,
                    duration: 1000,
                  });
                }
              } else {
                setShowShareModal(false);
                setIsAdjustingLocation(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900/95 border border-white/[0.08] rounded-2xl p-6 md:p-8 w-full max-w-md mx-4 backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-[family-name:var(--font-exo-2)] text-xl md:text-2xl text-white">
                  Share how you feel
                </h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all text-lg md:text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Location indicator */}
              <div className="flex items-center gap-3 mb-4 p-3 md:p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-cyan-400/20 flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs md:text-sm text-white/40 font-[family-name:var(--font-smooch-sans)]">
                    {isAdjustingLocation ? 'Click on the map to set your location' : 'Your location'}
                  </p>
                  <p className="text-sm md:text-base text-white/70 font-[family-name:var(--font-smooch-sans)]">
                    {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
                  </p>
                </div>
                <button
                  onClick={() => setIsAdjustingLocation(!isAdjustingLocation)}
                  className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-[family-name:var(--font-smooch-sans)] transition-all ${
                    isAdjustingLocation 
                      ? 'bg-cyan-500 text-white' 
                      : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1]'
                  }`}
                >
                  {isAdjustingLocation ? 'Done' : 'Adjust'}
                </button>
              </div>
              
              {/* Adjust location hint */}
              {isAdjustingLocation && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20"
                >
                  <p className="text-xs md:text-sm text-cyan-400 font-[family-name:var(--font-smooch-sans)] text-center">
                    📍 Click anywhere on the map behind this modal to set your exact location
                  </p>
                </motion.div>
              )}

              {/* Feeling selector */}
              <div className="mb-6">
                <p className="text-sm md:text-base text-white/50 font-[family-name:var(--font-smooch-sans)] mb-3">How are you feeling?</p>
                <div className="grid grid-cols-4 gap-2 md:gap-3">
                  {FEELING_OPTIONS.map((option) => (
                    <button
                      key={option.feeling}
                      onClick={() => setShareFeeling(option.feeling)}
                      className={`p-3 md:p-4 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                        shareFeeling === option.feeling
                          ? "border-cyan-400/50 bg-cyan-400/10"
                          : "border-white/[0.05] hover:border-white/[0.1] bg-white/[0.02]"
                      }`}
                    >
                      <span className="text-xl md:text-2xl">{option.emoji}</span>
                      <span className="text-[10px] md:text-xs font-[family-name:var(--font-smooch-sans)] text-white/60">{option.feeling}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message input */}
              <div className="mb-6">
                <p className="text-sm md:text-base text-white/50 font-[family-name:var(--font-smooch-sans)] mb-3">Say something (optional)</p>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="what's on your mind..."
                  maxLength={100}
                  className="w-full h-24 md:h-28 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/80 placeholder:text-white/30 font-[family-name:var(--font-smooch-sans)] text-sm md:text-base resize-none focus:outline-none focus:border-cyan-400/30 transition-all"
                />
                <p className="text-right text-xs md:text-sm text-white/30 mt-1">{shareMessage.length}/100</p>
              </div>

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShareFeeling}
                disabled={!shareFeeling || !shareMessage}
                className="w-full py-3 md:py-4 rounded-xl bg-cyan-500/90 hover:bg-cyan-500 text-white font-[family-name:var(--font-smooch-sans)] text-lg md:text-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-cyan-400/30"
              >
                Drop your feeling ✨
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Feelings Modal */}
      <AnimatePresence>
        {showMyFeelings && !isEditingPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowMyFeelings(false);
              setEditingFeeling(null);
              setIsEditingPosition(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900/95 border border-white/[0.08] rounded-2xl p-6 md:p-8 w-full max-w-md mx-4 backdrop-blur-xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-[family-name:var(--font-exo-2)] text-xl md:text-2xl text-white flex items-center gap-2">
                  <span>❤️</span> My Feelings
                </h3>
                <button 
                  onClick={() => {
                    setShowMyFeelings(false);
                    setEditingFeeling(null);
                    setIsEditingPosition(false);
                  }}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all text-lg md:text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Edit position hint */}
              {isEditingPosition && editingFeeling && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20"
                >
                  <p className="text-xs md:text-sm text-cyan-400 font-[family-name:var(--font-smooch-sans)] text-center">
                    📍 Click anywhere on the map to set new position for "{editingFeeling.feeling}"
                  </p>
                </motion.div>
              )}

              {/* Feelings list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {myFeelings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/40 font-[family-name:var(--font-smooch-sans)] text-lg">
                      You haven't shared any feelings yet
                    </p>
                    <p className="text-white/30 font-[family-name:var(--font-smooch-sans)] text-sm mt-2">
                      Drop a pin to share how you feel!
                    </p>
                  </div>
                ) : (
                  myFeelings.map((feeling) => {
                    const feelingOption = FEELING_OPTIONS.find(f => f.feeling === feeling.feeling);
                    return (
                      <motion.div
                        key={feeling.id}
                        className={`p-4 rounded-xl border transition-all ${
                          editingFeeling?.id === feeling.id 
                            ? 'bg-cyan-500/10 border-cyan-500/30' 
                            : 'bg-white/[0.03] border-white/[0.05] hover:border-white/[0.1]'
                        }`}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Emoji */}
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ background: (feelingOption?.color || '#22d3ee') + '20' }}
                          >
                            {feelingOption?.emoji || '✨'}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm md:text-base font-[family-name:var(--font-smooch-sans)] text-white/90 break-words">
                              <TruncatedText text={feeling.comment || 'No message'} maxLength={50} />
                            </p>
                            <p className="text-xs text-white/40 font-[family-name:var(--font-smooch-sans)] mt-1">
                              feeling <span style={{ color: feelingOption?.color }}>{feeling.feeling}</span>
                            </p>
                            <p className="text-[10px] text-white/30 font-[family-name:var(--font-smooch-sans)] mt-1">
                              📍 {feeling.latitude.toFixed(4)}°, {feeling.longitude.toFixed(4)}°
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                if (map.current) {
                                  map.current.flyTo({
                                    center: [feeling.longitude, feeling.latitude],
                                    zoom: 5,
                                    duration: 1500,
                                  });
                                }
                              }}
                              className="px-2 py-1 rounded-lg text-xs bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white transition-all"
                              title="View on map"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => {
                                setEditingFeeling(feeling);
                                setIsEditingPosition(true);
                              }}
                              className={`px-2 py-1 rounded-lg text-xs transition-all ${
                                editingFeeling?.id === feeling.id 
                                  ? 'bg-cyan-500 text-white' 
                                  : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white'
                              }`}
                              title="Edit position"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Position Mode - Floating Indicator */}
      <AnimatePresence>
        {isEditingPosition && editingFeeling && (
          <>
            {/* Clickable overlay to pick new position */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 cursor-crosshair"
              onClick={(e) => {
                if (map.current && mapContainer.current) {
                  const rect = mapContainer.current.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const lngLat = map.current.unproject([x, y]);
                  updateFeelingPosition(editingFeeling.id, lngLat.lat, lngLat.lng);
                  setIsEditingPosition(false);
                  setEditingFeeling(null);
                  setShowMyFeelings(true);
                }
              }}
            />
            
            {/* Floating indicator */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="bg-zinc-900/95 border border-cyan-500/30 rounded-2xl px-6 py-4 backdrop-blur-xl shadow-lg shadow-cyan-500/10">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">📍</div>
                  <div>
                    <p className="text-sm md:text-base text-white font-[family-name:var(--font-smooch-sans)]">
                      Click anywhere on the map to set new position
                    </p>
                    <p className="text-xs text-cyan-400 font-[family-name:var(--font-smooch-sans)]">
                      Editing: "{editingFeeling.feeling}" feeling
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingPosition(false);
                      setEditingFeeling(null);
                      setShowMyFeelings(true);
                    }}
                    className="ml-4 px-3 py-1.5 rounded-lg bg-white/[0.08] text-white/60 hover:bg-white/[0.15] hover:text-white text-xs transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {!isLoaded && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-zinc-950">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full mx-auto mb-4"
            />
            <p className="text-white/50 font-[family-name:var(--font-smooch-sans)] text-lg">
              Loading the world...
            </p>
          </motion.div>
        </div>
      )}

      {/* Selected feeling popup */}
      <AnimatePresence>
        {selectedFeeling && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed left-1/2 -translate-x-1/2 z-20"
            style={{ bottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 4rem))' }}
          >
            <div className="backdrop-blur-xl border rounded-2xl p-5 min-w-[320px] relative overflow-hidden bg-zinc-900/90 border-white/[0.08]">
              {/* Decorative corner lines */}
              <div className="absolute top-0 left-4 w-px h-10 bg-gradient-to-b from-cyan-400/40 to-transparent" />
              <div className="absolute top-4 left-0 h-px w-10 bg-gradient-to-r from-cyan-400/40 to-transparent" />
              <div className="absolute bottom-0 right-4 w-px h-10 bg-gradient-to-t from-purple-400/40 to-transparent" />
              <div className="absolute bottom-4 right-0 h-px w-10 bg-gradient-to-l from-purple-400/40 to-transparent" />
              
              {/* Glow effect */}
              <div 
                className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{ background: selectedFeeling.color }}
              />
              
              <div className="flex items-start gap-4 relative">
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-4 h-4 rounded-full mt-1"
                  style={{ background: selectedFeeling.color, boxShadow: `0 0 20px ${selectedFeeling.color}` }}
                />
                <div>
                  <p className="font-[family-name:var(--font-smooch-sans)] text-xl mb-1 text-white/90">
                    feeling <span style={{ color: selectedFeeling.color }} className="font-medium">{selectedFeeling.feeling}</span>
                  </p>
                  <p className="text-base font-[family-name:var(--font-smooch-sans)] mb-2 text-white/70 break-words">
                    <TruncatedText text={selectedFeeling.message} maxLength={60} />
                  </p>
                  <p className="text-sm font-[family-name:var(--font-smooch-sans)] text-white/40">
                    {selectedFeeling.user} · {selectedFeeling.time}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedFeeling(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all text-sm bg-white/[0.05] text-white/40 hover:text-white/70 hover:bg-white/[0.1]"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom styles */}
      <style jsx global>{`
        .maplibregl-canvas {
          outline: none;
        }
        
        .maplibregl-ctrl-attrib {
          display: none !important;
        }
        
        .maplibregl-ctrl-logo {
          display: none !important;
        }
        
        .maplibregl-ctrl-group {
          background: rgba(24, 24, 27, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 14px !important;
          overflow: hidden;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .maplibregl-ctrl-group button {
          width: 36px !important;
          height: 36px !important;
          background: transparent !important;
          border: none !important;
          color: rgba(255, 255, 255, 0.5) !important;
        }
        
        .maplibregl-ctrl-group button:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }
        
        .maplibregl-ctrl-group button + button {
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        
        .maplibregl-ctrl-zoom-in .maplibregl-ctrl-icon {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill='%23999'%3E%3Cpath d='M10 5v10M5 10h10' stroke='%23888' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") !important;
        }
        
        .maplibregl-ctrl-zoom-out .maplibregl-ctrl-icon {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 10h10' stroke='%23888' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") !important;
        }
        
        .maplibregl-ctrl-compass .maplibregl-ctrl-icon {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon fill='%2322d3ee' points='10,2 12,10 10,8 8,10'/%3E%3Cpolygon fill='%23666' points='10,18 12,10 10,12 8,10'/%3E%3C/svg%3E") !important;
        }
      `}</style>
    </>
  );
}
