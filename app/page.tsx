"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useColyseus, setPendingGameRoom } from "@/lib/colyseus/ColyseusProvider";
import { joinOrCreateGameRoom, getRoomCode } from "@/lib/colyseus/RoomService";
import styles from "./page.module.css";

export default function Home() {
  const [playerNameInput, setPlayerNameInput] = useState("");
  const { playerName, setPlayerName, client } = useColyseus();
  const router = useRouter();

  // Set the input to the default player name when it's available
  useEffect(() => {
    if (playerName && !playerNameInput) {
      setPlayerNameInput(playerName);
    }
  }, [playerName]);

  const handleStartGame = () => {
    if (!playerNameInput.trim()) return;
    // Store player name in context (which syncs to localStorage)
    setPlayerName(playerNameInput.trim());
    router.push("/lobby");
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img
              src="/full_logo.png"
              alt="Sheeple - Play Herd Mentality Online Free Multiplayer Party Game"
              className="h-64 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Play Sheeple Online - Free Multiplayer Party Game
          </h1>
          <p className="text-xl text-gray-600">
            Think like the herd and win! Answer questions, match with the group,
            play with 3-12 friends - no downloads required
          </p>
        </div>

        {/* Player Name Input Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Ready to Play?
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Enter Your Name
              </label>
              <input
                type="text"
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartGame()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="Your name"
                autoFocus
              />
            </div>
            <button
              onClick={handleStartGame}
              disabled={!playerNameInput.trim()}
              className={`${styles.joinHerdBtn} relative overflow-hidden w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:cursor disabled:hover:scale-100`}
              style={{ minHeight: 56 }}
            >
              <span className={styles.sheepPopContainer}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <img
                    key={idx}
                    src="/sheep.png"
                    alt="sheep"
                    className={`${styles.sheepPop} ${
                      styles[`sheepPop${idx + 1}`]
                    }`}
                    width={256}
                    height={256}
                  />
                ))}
              </span>
              <span className="relative z-10">Join the Herd →</span>
            </button>

            {/* Dev Mode Link */}
            {process.env.NODE_ENV === "development" && (
              <div className="pt-4 border-t-2 border-gray-200">
                <p className="text-sm text-gray-600 mb-2 text-center">
                  🧪 Dev Mode
                </p>
                <button
                  onClick={async () => {
                    if (!playerNameInput.trim() || !client) return;
                    const name = playerNameInput.trim();
                    setPlayerName(name);
                    try {
                      const room = await joinOrCreateGameRoom(client, name);
                      const targetRoomCode = await getRoomCode(room);
                      for (let i = 0; i < 5; i++) {
                        room.send("add_fake_player", {});
                      }
                      // Brief pause so the server processes bot messages
                      await new Promise((r) => setTimeout(r, 200));
                      setPendingGameRoom(room, targetRoomCode);
                      router.push(`/room/${targetRoomCode}`);
                    } catch (err: any) {
                      alert(`Error creating dev room: ${err.message}`);
                    }
                  }}
                  disabled={!playerNameInput.trim() || !client}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Join Test Room (5 Bots)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rules Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">
            How to Play Sheeple
          </h2>
          <p className="text-center text-gray-600 mb-6">
            A group thinking party game inspired by popular herd mentality
            games. Play with friends anywhere!
          </p>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Join a Room</h3>
                <p className="text-gray-600">
                  Create a new room or join an existing one with a room code.
                  Share the code with your friends!
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Answer Prompts</h3>
                <p className="text-gray-600">
                  Each round, you'll see a prompt. Your goal is to answer the
                  same way as most other players!
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Think Like a Sheep
                </h3>
                <p className="text-gray-600">
                  Score points when your answer matches other players. The most
                  popular answer wins the round!
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Win the Game</h3>
                <p className="text-gray-600">
                  The player with the most points after all rounds wins! Will
                  you be the ultimate sheep?
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">💡 Pro Tip:</span> Don't try to be
              clever or unique—go with your first instinct and think about what
              everyone else might say!
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/how-to-play"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              Read Complete Rules & Strategy Guide →
            </Link>
          </div>
        </div>

        {/* Why Play Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Why Play Sheeple Online?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🌐</div>
              <h3 className="font-semibold text-lg mb-2">Play Anywhere</h3>
              <p className="text-gray-600">
                No downloads, no apps. Just share a link and start playing
                instantly!
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="font-semibold text-lg mb-2">3-12 Players</h3>
              <p className="text-gray-600">
                Perfect for small gatherings or big parties. The more, the
                merrier!
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🎮</div>
              <h3 className="font-semibold text-lg mb-2">Free Forever</h3>
              <p className="text-gray-600">
                100% free to play. No hidden costs, no subscriptions, just fun!
              </p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            Sheeple is an independent, fan-made party game inspired by classic
            word and deduction games. It is not affiliated with or endorsed by
            any other company or product. All original artwork, code, and assets
            are the property of their respective creators. By playing Sheeple,
            you agree to the use of cookies and advertisements, which are
            required to play the game. We use cookies to maintain your session
            and game state. For more information, please see our{" "}
            <Link
              href="/privacy"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
