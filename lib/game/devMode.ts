import { Server as SocketIOServer, Socket } from "socket.io";
import { GameEvents } from "../socket/events";
import { getGameManager } from "../socket/handlers";

const FAKE_PLAYER_NAMES = [
  "Alice the Awesome",
  "Bob the Builder",
  "Charlie the Champion",
  "Diana the Daring",
  "Eve the Explorer",
];

const FAKE_ANSWERS = {
  fruit: ["apple", "banana", "orange", "apple", "grape"],
  color: ["blue", "red", "blue", "green", "blue"],
  "pizza topping": [
    "pepperoni",
    "cheese",
    "pepperoni",
    "mushroom",
    "pepperoni",
  ],
  "day of the week": ["friday", "monday", "friday", "saturday", "friday"],
  country: ["usa", "canada", "usa", "mexico", "usa"],
  animal: ["dog", "cat", "dog", "bird", "dog"],
  sport: ["soccer", "basketball", "soccer", "tennis", "soccer"],
  "movie genre": ["action", "comedy", "action", "horror", "action"],
  "breakfast food": ["eggs", "pancakes", "eggs", "cereal", "eggs"],
  "school subject": ["math", "english", "math", "science", "math"],
  "musical instrument": ["guitar", "piano", "guitar", "drums", "guitar"],
  "type of weather": ["sunny", "rainy", "sunny", "cloudy", "sunny"],
  beverage: ["water", "coffee", "water", "tea", "water"],
  "car brand": ["toyota", "honda", "toyota", "ford", "toyota"],
  city: ["new york", "london", "new york", "paris", "new york"],
  "video game": ["minecraft", "fortnite", "minecraft", "among us", "minecraft"],
  dessert: ["ice cream", "cake", "ice cream", "cookies", "ice cream"],
  vegetable: ["carrot", "broccoli", "carrot", "spinach", "carrot"],
  season: ["summer", "winter", "summer", "fall", "summer"],
  superhero: ["spider-man", "batman", "spider-man", "superman", "spider-man"],
};

// Track fake players per room
const roomFakePlayers = new Map<string, Array<{ id: string; name: string }>>();

export function setupDevMode(io: SocketIOServer) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.log("\n🎮 DEV MODE ENABLED");
  console.log("📝 Use ADD_FAKE_PLAYER event to add fake players to any room\n");

  // Setup event listeners
  io.on("connection", (socket) => {
    // Auto-mark fake players as ready when any player in a room with fake players gets ready
    socket.on(GameEvents.PLAYER_READY, () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const fakePlayers = roomFakePlayers.get(roomId);
      if (!fakePlayers || fakePlayers.length === 0) return;

      // Mark fake players as ready after a delay
      setTimeout(() => {
        const gameManager = getGameManager();
        fakePlayers.forEach((player) => {
          gameManager.setPlayerReady(roomId, player.id, true);
          io.to(roomId).emit(GameEvents.PLAYER_READY_STATUS, {
            playerId: player.id,
            playerName: player.name,
          });
        });
        console.log(`🤖 All fake players in room ${roomId} are ready!`);
      }, 1500);
    });

    // Auto-submit answers for fake players when round starts
    socket.on(
      GameEvents.ROUND_START,
      (data: { prompt: string; roundNumber: number }) => {
        const roomId = socket.data.roomId;
        if (!roomId) return;

        const fakePlayers = roomFakePlayers.get(roomId);
        if (!fakePlayers || fakePlayers.length === 0) return;

        // Auto-submit answers for fake players after a delay
        setTimeout(() => {
          const gameManager = getGameManager();
          fakePlayers.forEach((player, index) => {
            setTimeout(() => {
              // Find answer based on prompt
              const promptLower = data.prompt.toLowerCase();
              let answer = "test answer";

              // Try to find matching fake answer
              for (const [key, answers] of Object.entries(FAKE_ANSWERS)) {
                if (promptLower.includes(key)) {
                  answer = answers[index] || answers[0];
                  break;
                }
              }

              // Submit answer for fake player
              gameManager.submitAnswer(roomId, player.id, answer);
              console.log(`🤖 ${player.name} submitted: ${answer}`);
            }, Math.random() * 3000); // Random delay 0-3 seconds
          });
        }, 2000);
      },
    );
  });
}

// Handler for adding fake players to a room
export function handleAddFakePlayer(
  io: SocketIOServer,
  socket: Socket,
  data: { count?: number },
) {
  if (process.env.NODE_ENV !== "development") {
    socket.emit(GameEvents.ERROR, {
      message: "Fake players only available in development mode",
    });
    return;
  }

  const roomId = socket.data.roomId;
  if (!roomId) {
    socket.emit(GameEvents.ERROR, { message: "Not in a room" });
    return;
  }

  const count = data.count || 1;
  if (count < 1 || count > 5) {
    socket.emit(GameEvents.ERROR, {
      message: "Can only add 1-5 fake players at a time",
    });
    return;
  }

  const gameManager = getGameManager();
  const existingFakePlayers = roomFakePlayers.get(roomId) || [];
  const startIndex = existingFakePlayers.length;

  if (startIndex + count > FAKE_PLAYER_NAMES.length) {
    socket.emit(GameEvents.ERROR, {
      message: `Can only add ${FAKE_PLAYER_NAMES.length - startIndex} more fake players to this room`,
    });
    return;
  }

  const newFakePlayers: Array<{ id: string; name: string }> = [];

  // Create fake players
  for (let i = 0; i < count; i++) {
    const index = startIndex + i;
    const name = FAKE_PLAYER_NAMES[index];
    const fakeId = `fake-player-${roomId}-${index + 1}`;

    // Add player to game manager
    gameManager.addPlayer(roomId, fakeId, name);

    newFakePlayers.push({ id: fakeId, name });

    // Emit player joined event to all clients in room
    io.to(roomId).emit(GameEvents.PLAYER_JOINED, {
      playerId: fakeId,
      playerName: name,
      roomId,
    });

    console.log(`🤖 ${name} added to room ${roomId}`);
  }

  // Update fake players for this room
  roomFakePlayers.set(roomId, [...existingFakePlayers, ...newFakePlayers]);

  console.log(
    `✅ Added ${count} fake player(s) to room ${roomId} (${roomFakePlayers.get(roomId)?.length} total)`,
  );
}
