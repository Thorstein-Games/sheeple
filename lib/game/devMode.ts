import { Server as SocketIOServer } from "socket.io";
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

export function setupDevMode(io: SocketIOServer) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.log("\n🎮 DEV MODE ENABLED");
  console.log("📝 Creating test room 'DEV001' with 5 fake players...\n");

  const testRoomId = "DEV001";
  let gameManager: ReturnType<typeof getGameManager>;
  let fakePlayers: Array<{ id: string; name: string }> = [];
  let realPlayerJoined = false;

  // Wait for game manager to be initialized
  setTimeout(() => {
    gameManager = getGameManager();

    // Create fake players
    FAKE_PLAYER_NAMES.forEach((name, index) => {
      const fakeId = `fake-player-${index + 1}`;

      // Add player to game manager
      gameManager.addPlayer(testRoomId, fakeId, name);

      fakePlayers.push({
        id: fakeId,
        name,
      });

      // Emit player joined event to any connected clients
      io.to(testRoomId).emit(GameEvents.PLAYER_JOINED, {
        playerId: fakeId,
        playerName: name,
        roomId: testRoomId,
      });

      console.log(`✅ ${name} joined room ${testRoomId}`);
    });

    console.log(`\n✨ Test room ready!`);
    console.log(`   Room ID: ${testRoomId}`);
    console.log(`   Players: ${fakePlayers.length}`);
    console.log(`   Ready to play: Visit /room/${testRoomId}\n`);
    console.log(
      `   Note: You'll be player #6. Just join and click "I'm Ready!"\n`
    );
  }, 100);

  // Setup event listeners
  io.on("connection", (socket) => {
    // Auto-mark fake players as ready after real player joins the test room
    socket.on(
      GameEvents.JOIN_GAME,
      (data: { playerName: string; roomId?: string }) => {
        if (
          data.roomId === testRoomId &&
          fakePlayers.length > 0 &&
          !realPlayerJoined
        ) {
          realPlayerJoined = true;

          // Mark fake players as ready after a delay
          setTimeout(() => {
            fakePlayers.forEach((player) => {
              gameManager.setPlayerReady(testRoomId, player.id, true);
              io.to(testRoomId).emit(GameEvents.PLAYER_READY_STATUS, {
                playerId: player.id,
                playerName: player.name,
              });
            });
            console.log("🤖 All fake players are ready!");
          }, 1500);
        }
      }
    );

    // Auto-submit answers for fake players when round starts
    socket.on(
      GameEvents.ROUND_START,
      (data: { prompt: string; roundNumber: number }) => {
        if (socket.data.roomId !== testRoomId || fakePlayers.length === 0)
          return;

        // Auto-submit answers for fake players after a delay
        setTimeout(() => {
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
              if (gameManager) {
                gameManager.submitAnswer(testRoomId, player.id, answer);
                console.log(`🤖 ${player.name} submitted: ${answer}`);
              }
            }, Math.random() * 3000); // Random delay 0-3 seconds
          });
        }, 2000);
      }
    );
  });
}
