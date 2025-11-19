"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, type HighScore } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Play, RotateCcw } from "lucide-react";

type GameState = "menu" | "playing" | "gameOver";

export default function FlappyBirdGamePC() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);

  const gameRef = useRef<{
    box: { x: number; y: number; velocity: number };
    pipes: Array<{ x: number; gapY: number; scored?: boolean }>;
    score: number;
    animationId: number | null;
    frameCount: number;
  }>({
    box: { x: 100, y: 250, velocity: 0 },
    pipes: [],
    score: 0,
    animationId: null,
    frameCount: 0,
  });

  const birdFrames = useRef<HTMLImageElement[]>([]);
  const birdFrameIndex = useRef(0);
  const birdFrameSpeed = 5;

  // Load bird frames
  useEffect(() => {
    const frames: HTMLImageElement[] = [];
    for (let i = 1; i <= 6; i++) {
      const img = new Image();
      img.src = `/bird${i}.png`;
      frames.push(img);
    }
    birdFrames.current = frames;
  }, []);

  // Load background
  const bgImage = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = "/bg.jpg";
    bgImage.current = img;
  }, []);

  // Load leaderboard
  const loadHighScores = useCallback(async () => {
    const { data, error } = await supabase
      .from("high_scores")
      .select("*")
      .order("score", { ascending: false })
      .limit(10);
    if (data && !error) setHighScores(data);
  }, []);

  useEffect(() => {
    loadHighScores();
  }, [loadHighScores]);

  // Save score
  const saveHighScore = async () => {
    if (score > 0) {
      const name = playerName.trim() || "Anonymous";
      await supabase.from("high_scores").insert({
        player_name: name,
        score: score,
      });
      await loadHighScores();
      setShowNameInput(false);
      setPlayerName("");
    }
  };

  // Start game
  const startGame = () => {
    const canvas = canvasRef.current;
    const game = gameRef.current;
    const width = canvas ? canvas.width : window.innerWidth;
    const height = canvas ? canvas.height : window.innerHeight;

    game.box = { x: width / 6, y: height / 2, velocity: 0 };
    game.pipes = [{ x: width - 150, gapY: 200 }];
    game.score = 0;
    game.frameCount = 0;

    setScore(0);
    setGameState("playing");
    setShowNameInput(false);
  };

  const jump = useCallback(() => {
    if (gameState === "playing") gameRef.current.box.velocity = -8;
  }, [gameState]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (gameState === "menu") startGame();
        else if (gameState === "playing") jump();
        else if (gameState === "gameOver") startGame();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameState, jump]);

  // Main game loop
  useEffect(() => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const game = gameRef.current;
    const GRAVITY = 0.5;
    const PIPE_SPEED = 3;

    const loop = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const BOX_SIZE = Math.min(width, height) / 15;
      const PIPE_WIDTH = Math.min(width, height) / 7;
      const PIPE_GAP = Math.min(width, height) / 3.5;

      ctx.clearRect(0, 0, width, height);

      // Background
      if (bgImage.current?.complete) {
        ctx.drawImage(bgImage.current, 0, 0, width, height);
      } else {
        ctx.fillStyle = "#0ea5e9";
        ctx.fillRect(0, 0, width, height);
      }

      // Update bird
      game.box.velocity += GRAVITY;
      game.box.y += game.box.velocity;

      if (birdFrames.current.length > 0) {
        if (game.frameCount % birdFrameSpeed === 0) {
          birdFrameIndex.current =
            (birdFrameIndex.current + 1) % birdFrames.current.length;
        }
        const currentFrame = birdFrames.current[birdFrameIndex.current];
        if (currentFrame.complete) {
          ctx.drawImage(currentFrame, game.box.x, game.box.y, BOX_SIZE, BOX_SIZE);
        } else {
          ctx.fillStyle = "#fde047";
          ctx.fillRect(game.box.x, game.box.y, BOX_SIZE, BOX_SIZE);
        }
      }

      game.frameCount++;

      // Pipes
      game.pipes.forEach((pipe, index) => {
        pipe.x -= PIPE_SPEED;
        ctx.fillStyle = "#000";
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, height);

        ctx.strokeStyle = "#16a34a";
        ctx.lineWidth = 3;
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        ctx.strokeRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, height);

        if (pipe.x + PIPE_WIDTH < game.box.x && !pipe.scored) {
          game.score++;
          setScore(game.score);
          pipe.scored = true;
        }

        if (pipe.x < -PIPE_WIDTH) game.pipes.splice(index, 1);
      });

      // Add new pipes
      if (game.pipes.length === 0 || game.pipes[game.pipes.length - 1].x < width - 250) {
        game.pipes.push({
          x: width + 50,
          gapY: Math.random() * (height - PIPE_GAP - 100) + 50,
        });
      }

      // Collision detection
      if (
        game.box.y < 0 ||
        game.box.y + BOX_SIZE > height ||
        game.pipes.some(
          (p) =>
            game.box.x + BOX_SIZE > p.x &&
            game.box.x < p.x + PIPE_WIDTH &&
            (game.box.y < p.gapY || game.box.y + BOX_SIZE > p.gapY + PIPE_GAP)
        )
      ) {
        setGameState("gameOver");
        setShowNameInput(true);
        if (game.animationId) cancelAnimationFrame(game.animationId);
        return;
      }

      game.animationId = requestAnimationFrame(loop);
    };

    game.animationId = requestAnimationFrame(loop);
    return () => {
      if (game.animationId) cancelAnimationFrame(game.animationId);
    };
  }, [gameState]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-0">
      <div className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          onClick={jump}
          className="w-full h-full cursor-pointer"
        />

        {/* Score */}
        <div className="absolute top-4 left-4 px-6 py-3 rounded-xl bg-black/60 backdrop-blur-lg border border-white/10 shadow-lg">
          <p className="text-3xl font-bold text-yellow-400 drop-shadow-lg">{score}</p>
        </div>

        {/* Menu */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center">
            <Button
              onClick={startGame}
              size="lg"
              className="text-xl px-10 py-6 rounded-xl shadow-xl hover:scale-110 transition"
            >
              <Play className="mr-2" /> Start
            </Button>
          </div>
        )}

        {/* Game Over */}
        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xl gap-4 p-2">
            {/* Leaderboard */}
            <Card className="bg-slate-800/70 border-slate-700 rounded-2xl shadow-xl w-full max-w-md mb-4">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-400">
                  <Trophy className="mr-2" /> Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {highScores.length === 0 ? (
                  <p className="text-slate-400 text-center py-2">No scores yet</p>
                ) : (
                  <div className="space-y-2">
                    {highScores.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl shadow-md ${
                          index === 0
                            ? "bg-yellow-500/20 border border-yellow-500"
                            : "bg-slate-700/50"
                        }`}
                      >
                        <span className="text-white font-medium">
                          #{index + 1} {entry.player_name}
                        </span>
                        <span className="text-yellow-400 font-bold">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center bg-slate-800/70 p-6 rounded-2xl border border-slate-700 shadow-xl animate-fadeIn w-full max-w-md">
              <p className="text-3xl text-yellow-400 mb-4">Score: {score}</p>

              {showNameInput && (
                <div className="mb-4">
                  <Input
                    placeholder="Enter Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveHighScore()}
                    className="bg-slate-700 text-white border-slate-600 mb-3"
                  />
                  <Button onClick={saveHighScore} className="w-full mb-2">
                    <Trophy className="mr-2" /> Save Score
                  </Button>
                </div>
              )}

              <Button onClick={startGame} size="lg" className="w-full mt-2">
                <RotateCcw className="mr-2" /> Try Again
              </Button>

              <p className="mt-4 text-sm text-white/70">Made by Tanzeel Khan from ❤</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
