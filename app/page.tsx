"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import taake SSR me canvas load na ho
const FlappyBirdGamePC = dynamic(() => import("../app/FlappyBirdGamePC/page"), { ssr: false });
const FlappyBirdGameMobile = dynamic(() => import("../app/FlappyBirdGameMobile/page"), { ssr: false });

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // 🌟 PWA Service Worker Register
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("Service Worker Registered"))
        .catch((err) => console.log("Service Worker Error:", err));
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const startGame = () => setGameStarted(true);

  return (
    <div className="w-full h-screen relative">
      {!gameStarted && (
        <div
          className="w-full h-full flex flex-col items-center justify-center bg-cover bg-center"
          style={{ backgroundImage: 'url("/bg.png")' }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            Flappy Bird
          </h1>

          <div className="flex flex-col gap-4">
            <button
              onClick={startGame}
              className="px-8 py-4 rounded-xl bg-yellow-400 text-black font-bold text-lg shadow-lg hover:scale-105 transition"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {gameStarted && (isMobile ? <FlappyBirdGameMobile /> : <FlappyBirdGamePC />)}
    </div>
  );
}
