"use client";

import { useMemo } from "react";
import "./BackgroundGrazers.css";

export function BackgroundGrazers() {
  // Generate random positions for grazer gifs
  const grazers = useMemo(() => {
    const count = Math.floor(Math.random() * 4) + 3; // 3-6 grazers
    const placed: Array<{ top: number; left: number }> = [];
    const minDistance = 15; // Minimum distance between grazers (in percentage)

    const isOverlapping = (newTop: number, newLeft: number) => {
      return placed.some((pos) => {
        const distance = Math.sqrt(
          Math.pow(pos.top - newTop, 2) + Math.pow(pos.left - newLeft, 2)
        );
        return distance < minDistance;
      });
    };

    const grazers = [];
    for (let i = 0; i < count; i++) {
      let top, left;
      let attempts = 0;
      const maxAttempts = 50;

      // Try to find a non-overlapping position
      do {
        top = Math.random() * 80 + 10; // 10-90% from top
        left = Math.random() * 80 + 10; // 10-90% from left
        attempts++;
      } while (isOverlapping(top, left) && attempts < maxAttempts);

      // Only add if we found a valid position
      if (attempts < maxAttempts) {
        placed.push({ top, left });
        grazers.push({
          id: i,
          gif: Math.random() > 0.5 ? "graze1.gif" : "graze2.gif",
          top,
          left,
          scale: Math.random() * 0.4 + 0.6, // 0.6-1.0 scale
          flipX: Math.random() > 0.5, // Random horizontal flip
        });
      }
    }

    return grazers;
  }, []);

  return (
    <div className="background-grazers">
      {grazers.map((grazer) => (
        <img
          key={grazer.id}
          src={`/${grazer.gif}`}
          alt=""
          className="grazer"
          style={{
            top: `${grazer.top}%`,
            left: `${grazer.left}%`,
            transform: `translate(-50%, -50%) scale(${grazer.scale}) scaleX(${
              grazer.flipX ? -1 : 1
            })`,
          }}
        />
      ))}
    </div>
  );
}
