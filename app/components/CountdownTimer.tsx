"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { GameEvents } from "@/lib/socket/events";
import type { TimeRemainingData } from "@/lib/socket/types";
import "./CountdownTimer.css";

interface CountdownTimerProps {
  timeLimit: number; // in milliseconds
  onTimeUp: () => void;
  socket?: Socket | null;
  currentRound?: number;
}

export default function CountdownTimer({
  timeLimit,
  onTimeUp,
  socket,
  currentRound,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    setTimeRemaining(timeLimit);
    setHasEnded(false);
  }, [timeLimit, currentRound]);

  // Sync with backend every 5 seconds
  useEffect(() => {
    if (!socket || hasEnded) return;

    const syncInterval = setInterval(() => {
      socket.emit(GameEvents.GET_TIME_REMAINING);
    }, 5000);

    const handleTimeSync = (data: TimeRemainingData) => {
      // Only update if it's for the current round
      if (data.roundNumber === currentRound) {
        setTimeRemaining(data.timeRemaining);
      }
    };

    socket.on(GameEvents.TIME_REMAINING, handleTimeSync);

    return () => {
      clearInterval(syncInterval);
      socket.off(GameEvents.TIME_REMAINING, handleTimeSync);
    };
  }, [socket, hasEnded, currentRound]);

  useEffect(() => {
    if (hasEnded) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 100) {
          setHasEnded(true);
          onTimeUp();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [hasEnded, onTimeUp]);

  const seconds = Math.ceil(timeRemaining / 1000);
  const percentage = (timeRemaining / timeLimit) * 100;

  // Determine color based on time remaining
  const getColorClass = () => {
    if (percentage > 50) return "text-green-600 border-green-500";
    if (percentage > 25) return "text-yellow-600 border-yellow-500";
    return "text-red-600 border-red-500";
  };

  const getProgressColor = () => {
    if (percentage > 50) return "#16a34a"; // green-600
    if (percentage > 25) return "#ca8a04"; // yellow-600
    return "#dc2626"; // red-600
  };

  // Add pulse animation when time is running low
  const shouldPulse = percentage <= 25;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg className="countdown-svg" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={getProgressColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentage / 100)}`}
            className="countdown-progress"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
            }}
          />
        </svg>
        <div
          className={`absolute inset-0 flex items-center justify-center ${
            shouldPulse ? "countdown-pulse" : ""
          }`}
        >
          <span
            className={`text-4xl font-bold transition-colors ${getColorClass()}`}
          >
            {seconds}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 font-medium">seconds remaining</p>
    </div>
  );
}
