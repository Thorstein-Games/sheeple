"use client";

import { useEffect, useState } from "react";
import "./SheepExplosion.css";

interface SheepParticle {
  id: number;
  tx: number;
  ty: number;
  rotate: number;
  delay: number;
}

interface SheepExplosionProps {
  rank: number; // 1, 2, or 3 for top 3 winners
}

export default function SheepExplosion({ rank }: SheepExplosionProps) {
  const [particles, setParticles] = useState<SheepParticle[]>([]);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [showBigSheep, setShowBigSheep] = useState(false);

  useEffect(() => {
    // Start animation slightly staggered based on rank
    const timeout = setTimeout(() => {
      setShouldAnimate(true);
    }, rank * 200);

    return () => clearTimeout(timeout);
  }, [rank]);

  useEffect(() => {
    if (!shouldAnimate) return;

    const runCycle = () => {
      // Show big sheep
      setShowBigSheep(true);

      // After 1.5 seconds (time for sheep to appear and shake), trigger explosion
      setTimeout(() => {
        setShowBigSheep(false);

        // Generate 100 particles with random trajectories
        const newParticles: SheepParticle[] = [];
        const particleCount = 100;

        for (let i = 0; i < particleCount; i++) {
          // Random angle in radians
          const angle = Math.random() * Math.PI * 2;

          // Random distance (150px to 400px)
          const distance = 150 + Math.random() * 250;

          // Calculate x and y based on angle and distance
          const tx = Math.cos(angle) * distance;
          const ty = Math.sin(angle) * distance;

          // Random rotation
          const rotate = Math.random() * 720 - 360;

          // Stagger the start time slightly
          const delay = Math.random() * 300;

          newParticles.push({
            id: i,
            tx,
            ty,
            rotate,
            delay,
          });
        }

        setParticles(newParticles);
      }, 1500);

      // Clear particles after explosion completes (2s animation + delays)
      setTimeout(() => {
        setParticles([]);
      }, 4000);
    };

    // Run initial cycle
    runCycle();

    // Repeat the cycle every 5 seconds
    const interval = setInterval(runCycle, 5000);

    return () => clearInterval(interval);
  }, [shouldAnimate]);

  if (!shouldAnimate) return null;

  return (
    <div className="sheep-explosion-container">
      {showBigSheep && <div className="big-sheep" />}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="sheep-particle"
          style={
            {
              "--tx": `${particle.tx}px`,
              "--ty": `${particle.ty}px`,
              "--rotate": `${particle.rotate}deg`,
              animationDelay: `${particle.delay}ms`,
              left: "50%",
              top: "50%",
            } as React.CSSProperties & { [key: string]: string }
          }
        />
      ))}
    </div>
  );
}
