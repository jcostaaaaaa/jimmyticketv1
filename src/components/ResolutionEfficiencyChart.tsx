'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

interface ResolutionEfficiencyChartProps {
  score: number; // Score from 0 to 100
  size?: number; // Size of the chart in pixels
  strokeWidth?: number; // Width of the circle stroke
  className?: string; // Additional CSS classes
  animated?: boolean; // Whether to animate the chart on load
  journalPath?: string; // Custom path to navigate to when clicked
  tooltipText?: string; // Custom tooltip text
}

export const ResolutionEfficiencyChart: React.FC<ResolutionEfficiencyChartProps> = ({
  score,
  size = 120,
  strokeWidth = 8,
  className = '',
  animated = true,
  journalPath = '/journal',
  tooltipText = 'Click to view journal',
}) => {
  const router = useRouter();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // Ensure score is between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, score));
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Use animated score for the chart if animation is enabled
  const displayScore = animated ? animatedScore : normalizedScore;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;
  
  // Calculate center position
  const center = size / 2;
  
  // Animate the score on load
  useEffect(() => {
    if (animated) {
      // Start from 0
      setAnimatedScore(0);
      
      // Animate to the actual score
      const timeout = setTimeout(() => {
        const interval = setInterval(() => {
          setAnimatedScore(prev => {
            const next = prev + 1;
            if (next >= normalizedScore) {
              clearInterval(interval);
              return normalizedScore;
            }
            return next;
          });
        }, 20); // Speed of animation
        
        return () => clearInterval(interval);
      }, 300); // Delay before starting animation
      
      return () => clearTimeout(timeout);
    }
  }, [normalizedScore, animated]);
  
  // Handle click to navigate to journal page
  const handleClick = () => {
    router.push(journalPath);
  };

  // Determine color based on score
  const getScoreColor = () => {
    if (normalizedScore >= 80) return '#4CAF50'; // Green for high efficiency
    if (normalizedScore >= 60) return '#FF8000'; // Orange for medium efficiency
    return '#F44336'; // Red for low efficiency
  };

  const scoreColor = getScoreColor();

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background circle */}
      <svg width={size} height={size} className="absolute">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#3C3C3C"
          strokeWidth={strokeWidth}
        />
      </svg>
      
      {/* Progress circle */}
      <svg width={size} height={size} className="absolute transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      
      {/* Score text */}
      <button
        onClick={handleClick}
        className="relative z-10 flex flex-col items-center justify-center w-full h-full rounded-full focus:outline-none hover:bg-black/10 transition-colors"
        aria-label={`Resolution efficiency score: ${normalizedScore}%. ${tooltipText}`}
      >
        <span className="text-2xl font-bold" style={{ color: scoreColor }}>{Math.round(displayScore)}%</span>
        <span className="text-xs text-[#E0E0E0] mt-1">Efficiency</span>
      </button>
      
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
          {tooltipText}
        </div>
      )}
    </div>
  );
};
