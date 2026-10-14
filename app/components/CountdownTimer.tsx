"use client";

import { useEffect, useState } from "react";
import type { Room } from "@colyseus/sdk";
import "./CountdownTimer.css";

interface CountdownTimerProps {
  timeLimit: number; // in milliseconds
  onTimeUp: () => void;
  room?: Room | null;
  currentRound?: number;
}

export default function CountdownTimer({
  timeLimit,
  onTimeUp,
  room,
  currentRound,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    setTimeRemaining(timeLimit);
    setHasEnded(false);
  }, [timeLimit, currentRound]);

  useEffect(() => {
    if (hasEnded) return;

    const interval = setInterval(() => {
      // Prefer the authoritative server end time when available, so the
      // displayed time can't drift from the backend's actual round timer.
      const roundEndTime = room?.state?.roundEndTime;
      const next =
        roundEndTime != null && roundEndTime > 0
          ? Math.max(0, roundEndTime - Date.now())
          : null;

      setTimeRemaining((prev) => {
        const remaining = next ?? Math.max(0, prev - 100);
        if (remaining <= 0) {
          setHasEnded(true);
          onTimeUp();
          return 0;
        }
        return remaining;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [hasEnded, onTimeUp, room]);

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
