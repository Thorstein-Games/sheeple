"use client";

import { useEffect, useState } from "react";
import "./BackgroundGrazers.css";

function generateGrazers() {
  const count = Math.floor(Math.random() * 4) + 3;
  const placed: Array<{ top: number; left: number }> = [];
  const minDistance = 15;

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

    do {
      top = Math.random() * 80 + 10;
      left = Math.random() * 80 + 10;
      attempts++;
    } while (isOverlapping(top, left) && attempts < maxAttempts);

    if (attempts < maxAttempts) {
      placed.push({ top, left });
      grazers.push({
        id: i,
        gif: Math.random() > 0.5 ? "graze1.gif" : "graze2.gif",
        top,
        left,
        scale: Math.random() * 0.4 + 0.6,
        flipX: Math.random() > 0.5,
      });
    }
  }

  return grazers;
}

export function BackgroundGrazers() {
  const [grazers, setGrazers] = useState<ReturnType<typeof generateGrazers>>([]);

  useEffect(() => {
    setGrazers(generateGrazers());
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
