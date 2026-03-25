# Game Integration Guide

Complete guide for adding new games to the Megingjord server.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Step-by-Step Tutorial](#step-by-step-tutorial)
- [Architecture Overview](#architecture-overview)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

Megingjord uses a **game-agnostic architecture** that provides common functionality (players, lobbies, persistence, reconnection) while allowing you to focus on game-specific logic.

**What the framework provides:**
- ✅ Player management (join/leave/reconnect)
- ✅ Host migration
- ✅ Ready status tracking
- ✅ State persistence
- ✅ Chat system
- ✅ Lobby integration
- ✅ Timer utilities
- ✅ Error handling

**What you implement:**
- 🎮 Game rules and mechanics
- 🎮 Game-specific state
- 🎮 Custom messages
- 🎮 Win conditions
- 🎮 Scoring logic

## Quick Start

### Minimal Game (5 minutes)

1. **Create State Schema**

```typescript
// src/schema/MyGameState.ts
import { Schema, type } from '@colyseus/schema';
import { BaseGameState } from './BaseGameState';

export class MyGameState extends BaseGameState {
  @type("number") someGameData: number = 0;
}
```

2. **Create Room Class**

```typescript
// src/rooms/MyGameRoom.ts
import { Client } from 'colyseus';
import { BaseGameRoom } from './BaseGameRoom';
import { MyGameState } from '../schema/MyGameState';

export class MyGameRoom extends BaseGameRoom<MyGameState> {
  onCreate(options: any): void {
    super.onCreate(options);
    this.setState(new MyGameState());
    
    this.onMessage("my_action", (client, data) => {
      // Handle game action
      this.state.someGameData++;
    });
  }
}
```

3. **Register in Server**

```typescript
// src/index.ts
import { MyGameRoom } from './rooms/MyGameRoom';

gameServer.define("my_game", MyGameRoom);
```

4. **Test It**

```typescript
const room = await client.create("my_game", {
  playerName: "Alice"
});
```

Done! You now have a working game integrated with lobbies, persistence, and reconnection.

## Step-by-Step Tutorial

Let's create a complete game: **Number Guessing Game**

Players guess a random number, closest guess wins.

### Step 1: Define Game State

```typescript
// src/schema/NumberGuessingState.ts
import { Schema, type, MapSchema } from '@colyseus/schema';
import { BaseGameState } from './BaseGameState';

export class NumberGuessingState extends BaseGameState {
  @type("number") targetNumber: number = 0;
  @type("number") minRange: number = 1;
  @type("number") maxRange: number = 100;
  @type("boolean") guessesRevealed: boolean = false;
  @type({ map: "number" }) guesses = new MapSchema<number>();
}
```

**Key Points:**
- Extend `BaseGameState` to get all base functionality
- Use `@type()` decorators for Colyseus schema
- Use `MapSchema` for key-value data
- Keep state serializable (no functions, complex objects)

### Step 2: Create Room Logic

```typescript
// src/rooms/NumberGuessingRoom.ts
import { Client } from 'colyseus';
import { BaseGameRoom } from './BaseGameRoom';
import { NumberGuessingState } from '../schema/NumberGuessingState';

export class NumberGuessingRoom extends BaseGameRoom<NumberGuessingState> {
  maxClients = 8;

  onCreate(options: any): void {
    super.onCreate(options);
    
    // Initialize state
    this.setState(new NumberGuessingState());
    
    // Set game configuration
    this.state.maxRounds = 5;
    this.state.minRange = options.minRange || 1;
    this.state.maxRange = options.maxRange || 100;
    
    // Register message handlers
    this.onMessage("submit_guess", this.handleGuess.bind(this));
    this.onMessage("start_game", this.handleStartGame.bind(this));
    this.onMessage("next_round", this.handleNextRound.bind(this));
  }

  handleStartGame(client: Client): void {
    // Validate host
    if (!this.isHost(client)) {
      client.send("error", { message: "Only host can start game" });
      return;
    }

    // Validate all ready
    if (!this.checkAllReady()) {
      client.send("error", { message: "Not all players ready" });
      return;
    }

    // Start game
    this.state.gameStarted = true;
    this.state.gamePhase = "playing";
    this.startNewRound();
    
    this.broadcast("game_started");
  }

  startNewRound(): void {
    // Generate random number
    const { minRange, maxRange } = this.state;
    this.state.targetNumber = Math.floor(
      Math.random() * (maxRange - minRange + 1)
    ) + minRange;
    
    // Clear previous guesses
    this.state.guesses.clear();
    this.state.guessesRevealed = false;
    
    console.log(`[NumberGuessing] New round, target: ${this.state.targetNumber}`);
    
    this.broadcast("round_started", {
      roundNumber: this.state.currentRound,
      minRange,
      maxRange
    });
  }

  handleGuess(client: Client, data: { guess: number }): void {
    // Validate game state
    if (!this.state.gameStarted || this.state.gamePhase !== "playing") {
      client.send("error", { message: "Game not in progress" });
      return;
    }

    // Validate already guessed
    if (this.state.guesses.has(client.sessionId)) {
      client.send("error", { message: "Already submitted guess" });
      return;
    }

    // Validate guess in range
    const { guess } = data;
    if (typeof guess !== "number" || guess < this.state.minRange || guess > this.state.maxRange) {
      client.send("error", { message: "Invalid guess" });
      return;
    }

    // Store guess
    this.state.guesses.set(client.sessionId, guess);
    
    client.send("guess_received", { guess });
    
    // Check if all players guessed
    const connectedPlayers = Array.from(this.state.players.values())
      .filter(p => p.isConnected);
    
    if (this.state.guesses.size === connectedPlayers.length) {
      this.revealResults();
    }
  }

  revealResults(): void {
    this.state.guessesRevealed = true;
    
    // Calculate results
    const results: any[] = [];
    const target = this.state.targetNumber;
    
    this.state.guesses.forEach((guess, sessionId) => {
      const player = this.state.players.get(sessionId);
      if (player) {
        const distance = Math.abs(guess - target);
        results.push({
          playerName: player.playerName,
          guess,
          distance
        });
      }
    });
    
    // Sort by distance (closest first)
    results.sort((a, b) => a.distance - b.distance);
    
    // Award points (1st = 3pts, 2nd = 2pts, 3rd = 1pt)
    if (results.length > 0) {
      const winner = results[0];
      const player = Array.from(this.state.players.values())
        .find(p => p.playerName === winner.playerName);
      if (player) player.score += 3;
    }
    if (results.length > 1) {
      const second = results[1];
      const player = Array.from(this.state.players.values())
        .find(p => p.playerName === second.playerName);
      if (player && second.distance !== results[0].distance) {
        player.score += 2;
      }
    }
    if (results.length > 2) {
      const third = results[2];
      const player = Array.from(this.state.players.values())
        .find(p => p.playerName === third.playerName);
      if (player && third.distance !== results[1].distance) {
        player.score += 1;
      }
    }
    
    // Broadcast results
    this.broadcast("round_ended", {
      targetNumber: target,
      results,
      scores: this.getScores()
    });
    
    // Check if game complete
    this.state.currentRound++;
    if (this.state.currentRound > this.state.maxRounds) {
      this.endGame();
    }
  }

  handleNextRound(client: Client): void {
    if (!this.isHost(client)) {
      client.send("error", { message: "Only host can start next round" });
      return;
    }
    
    if (this.state.currentRound > this.state.maxRounds) {
      client.send("error", { message: "Game already complete" });
      return;
    }
    
    this.startNewRound();
  }

  endGame(): void {
    this.state.gamePhase = "ended";
    
    const finalScores = this.getScores();
    
    this.broadcast("game_ended", {
      finalScores,
      winner: finalScores[0]
    });
    
    console.log(`[NumberGuessing] Game ended, winner: ${finalScores[0].playerName}`);
  }

  getScores(): any[] {
    return Array.from(this.state.players.values())
      .map(p => ({
        playerName: p.playerName,
        score: p.score
      }))
      .sort((a, b) => b.score - a.score);
  }
}
```

### Step 3: Register Room

```typescript
// src/index.ts
import { NumberGuessingRoom } from './rooms/NumberGuessingRoom';

gameServer.define("number_guessing", NumberGuessingRoom);
```

### Step 4: Test Game

```typescript
// test-number-guessing.ts
import * as Colyseus from "colyseus.js";

async function test() {
  const client = new Colyseus.Client("ws://localhost:2567");
  
  // Player 1 creates room
  const room1 = await client.create("number_guessing", {
    playerName: "Alice",
    minRange: 1,
    maxRange: 50
  });
  
  console.log(`Room created: ${room1.id}`);
  
  // Player 2 joins
  const room2 = await client.joinById(room1.id, {
    playerName: "Bob"
  });
  
  // Listen to game events
  room1.onMessage("round_started", (data) => {
    console.log(`Round ${data.roundNumber} started`);
    
    // Submit guess
    const guess = Math.floor(Math.random() * (data.maxRange - data.minRange + 1)) + data.minRange;
    room1.send("submit_guess", { guess });
  });
  
  room1.onMessage("round_ended", (data) => {
    console.log("Round ended:", data);
    console.log("Target was:", data.targetNumber);
  });
  
  // Ready up and start
  room1.send("ready");
  room2.send("ready");
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  room1.send("start_game");
}

test();
```

## Architecture Overview

### Class Hierarchy

```
Room (Colyseus)
  └── BaseGameRoom<T extends BaseGameState>
        ├── GenericGameRoom (example)
        ├── NumberGuessingRoom (your game)
        └── YourGameRoom (your game)

Schema (Colyseus)
  └── BaseGameState
        ├── GenericGameState (example)
        ├── NumberGuessingState (your game)
        └── YourGameState (your game)
```

### BaseGameRoom Provides

**Lifecycle Methods (Already Implemented):**
- `onCreate()` - Room initialization
- `onJoin()` - Player joins
- `onLeave()` - Player leaves (with reconnection support)
- `onDispose()` - Room cleanup

**Helper Methods:**
- `checkAllReady()` - Check if all players ready
- `migrateHost()` - Migrate host to next player
- `getPlayerByName(name)` - Find player by name
- `isHost(client)` - Check if client is host

**Message Handlers (Built-in):**
- `"ready"` - Toggle ready status
- `"chat"` - Send chat message

**Features:**
- Automatic host assignment
- Host migration on disconnect
- Player reconnection (5-minute window)
- State persistence (automatic)
- Input validation
- Error handling

### What You Override

**Required:**
```typescript
onCreate(options: any): void {
  super.onCreate(options);  // MUST call super
  this.setState(new YourGameState());
  // Your initialization
}
```

**Optional:**
```typescript
// Add custom message handlers
onMessage("action", handler)

// Override lifecycle for custom logic
onJoin(client, options) {
  super.onJoin(client, options);
  // Your custom join logic
}

// Add custom methods
yourGameMethod() { }
```

## Advanced Features

### Custom State Persistence

Override serialization for game-specific data:

```typescript
export class MyGameRoom extends BaseGameRoom<MyGameState> {
  serializeGameSpecificState(): any {
    return {
      customData: this.state.customData,
      privateData: this.myPrivateArray
    };
  }

  async restoreGameSpecificState(savedState: any): Promise<void> {
    if (savedState.customData) {
      this.state.customData = savedState.customData;
    }
    if (savedState.privateData) {
      this.myPrivateArray = savedState.privateData;
    }
  }
}
```

### Using Timers

```typescript
import { RoundTimer } from '../utils/timerManager';

export class MyGameRoom extends BaseGameRoom<MyGameState> {
  private roundTimer: RoundTimer;

  onCreate(options: any): void {
    super.onCreate(options);
    this.roundTimer = new RoundTimer();
  }

  startRound(): void {
    this.roundTimer.start(30000, () => {
      // Timer expired
      this.endRound();
    });
    
    // Optionally sync remaining time
    this.clock.setInterval(() => {
      this.state.timeLeft = this.roundTimer.getRemainingTime();
    }, 1000);
  }

  onDispose(): void {
    this.roundTimer.cancel();
    super.onDispose();
  }
}
```

### Teams/Groups

```typescript
// Add to your state
export class TeamGameState extends BaseGameState {
  @type({ map: "string" }) playerTeams = new MapSchema<string>();
  @type({ map: "number" }) teamScores = new MapSchema<number>();
}

// In your room
assignTeams(): void {
  const players = Array.from(this.state.players.keys());
  players.forEach((sessionId, index) => {
    const team = index % 2 === 0 ? "red" : "blue";
    this.state.playerTeams.set(sessionId, team);
  });
  this.state.teamScores.set("red", 0);
  this.state.teamScores.set("blue", 0);
}
```

### Turn-Based Games

```typescript
export class TurnBasedRoom extends BaseGameRoom<TurnBasedState> {
  private turnOrder: string[] = [];
  private currentTurnIndex: number = 0;

  startGame(): void {
    // Set turn order
    this.turnOrder = Array.from(this.state.players.keys());
    this.currentTurnIndex = 0;
    this.state.currentTurn = this.turnOrder[0];
    
    this.nextTurn();
  }

  nextTurn(): void {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
    this.state.currentTurn = this.turnOrder[this.currentTurnIndex];
    
    this.broadcast("turn_changed", {
      playerId: this.state.currentTurn
    });
  }

  onMessage("take_turn", (client, data) => {
    if (client.sessionId !== this.state.currentTurn) {
      client.send("error", { message: "Not your turn" });
      return;
    }
    
    // Process turn action
    this.processTurnAction(client, data);
    this.nextTurn();
  });
}
```

### Private Information

Some games need hidden information:

```typescript
export class CardGameRoom extends BaseGameRoom<CardGameState> {
  private playerHands: Map<string, Card[]> = new Map();

  dealCards(): void {
    this.state.players.forEach((player, sessionId) => {
      const hand = this.drawCards(5);
      this.playerHands.set(sessionId, hand);
      
      // Send only to specific player
      const client = this.clients.find(c => c.sessionId === sessionId);
      if (client) {
        client.send("your_hand", { cards: hand });
      }
    });
  }
}
```

### Room Options

Allow clients to configure games:

```typescript
onCreate(options: any): void {
  super.onCreate(options);
  
  const {
    maxPlayers = 4,
    roundTime = 30,
    difficulty = "normal"
  } = options;
  
  this.maxClients = maxPlayers;
  this.state.roundDuration = roundTime * 1000;
  this.state.difficulty = difficulty;
}
```

Clients specify when creating:

```typescript
const room = await client.create("my_game", {
  playerName: "Alice",
  maxPlayers: 6,
  roundTime: 60,
  difficulty: "hard"
});
```

## Best Practices

### 1. State Design

**✅ DO:**
```typescript
@type("number") score: number = 0;
@type("string") phase: string = "lobby";
@type({ map: "number" }) data = new MapSchema<number>();
```

**❌ DON'T:**
```typescript
// Arrays of objects are complex
@type([ComplexObject]) items: ComplexObject[];

// Functions don't serialize
someMethod = () => { };

// Circular references cause issues
parent: ParentObject;
```

### 2. Message Validation

Always validate incoming messages:

```typescript
onMessage("action", (client, data) => {
  // Validate data exists
  if (!data || typeof data.value !== "number") {
    client.send("error", { message: "Invalid data" });
    return;
  }
  
  // Validate player state
  const player = this.state.players.get(client.sessionId);
  if (!player || !player.isConnected) {
    return;
  }
  
  // Validate game state
  if (this.state.gamePhase !== "playing") {
    client.send("error", { message: "Wrong game phase" });
    return;
  }
  
  // Process action
  this.processAction(client, data);
});
```

### 3. Error Handling

Wrap complex operations:

```typescript
onMessage("complex_action", (client, data) => {
  try {
    this.doComplexThing(data);
  } catch (error) {
    console.error("[MyGame] Error:", error);
    client.send("error", { message: "Action failed" });
  }
});
```

### 4. Cleanup Resources

```typescript
onDispose(): void {
  // Cancel timers
  this.roundTimer?.cancel();
  
  // Clear intervals
  this.clock.clear();
  
  // Call parent cleanup
  super.onDispose();
}
```

### 5. Logging

Add helpful logs:

```typescript
onCreate(options: any): void {
  super.onCreate(options);
  console.log(`[MyGame] Room ${this.roomId} created`);
}

startGame(): void {
  console.log(`[MyGame] ${this.roomId} - Game started with ${this.state.players.size} players`);
}
```

### 6. Testing

Create test scripts:

```typescript
// test-my-game.ts
async function testGameFlow() {
  console.log("Test 1: Basic game flow");
  // Create room
  // Join players
  // Start game
  // Play through one round
  // Verify scores
  // Clean up
}
```

## Examples

### Example 1: Voting Game

```typescript
export class VotingGameState extends BaseGameState {
  @type("string") question: string = "";
  @type({ map: "string" }) votes = new MapSchema<string>();
  @type("boolean") votingOpen: boolean = false;
}

export class VotingGameRoom extends BaseGameRoom<VotingGameState> {
  onCreate(options: any): void {
    super.onCreate(options);
    this.setState(new VotingGameState());
    
    this.onMessage("ask_question", this.handleAskQuestion.bind(this));
    this.onMessage("vote", this.handleVote.bind(this));
  }

  handleAskQuestion(client: Client, data: { question: string }): void {
    if (!this.isHost(client)) return;
    
    this.state.question = data.question;
    this.state.votingOpen = true;
    this.state.votes.clear();
    
    this.broadcast("voting_started", { question: data.question });
  }

  handleVote(client: Client, data: { choice: string }): void {
    if (!this.state.votingOpen) return;
    
    this.state.votes.set(client.sessionId, data.choice);
    
    // Check if all voted
    if (this.state.votes.size === this.state.players.size) {
      this.revealResults();
    }
  }

  revealResults(): void {
    this.state.votingOpen = false;
    
    const results: Map<string, number> = new Map();
    this.state.votes.forEach(choice => {
      results.set(choice, (results.get(choice) || 0) + 1);
    });
    
    this.broadcast("voting_ended", {
      results: Array.from(results.entries())
    });
  }
}
```

### Example 2: Drawing Game

```typescript
export class DrawingGameState extends BaseGameState {
  @type("string") currentArtist: string = "";
  @type("string") word: string = "";
  @type({ map: "boolean" }) hasGuessed = new MapSchema<boolean>();
}

export class DrawingGameRoom extends BaseGameRoom<DrawingGameState> {
  onCreate(options: any): void {
    super.onCreate(options);
    this.setState(new DrawingGameState());
    
    this.onMessage("draw", this.handleDraw.bind(this));
    this.onMessage("guess", this.handleGuess.bind(this));
  }

  handleDraw(client: Client, data: { x: number, y: number, color: string }): void {
    if (client.sessionId !== this.state.currentArtist) return;
    
    // Broadcast to all except artist
    this.broadcast("drawing_data", data, { except: client });
  }

  handleGuess(client: Client, data: { guess: string }): void {
    if (client.sessionId === this.state.currentArtist) return;
    if (this.state.hasGuessed.get(client.sessionId)) return;
    
    const correct = data.guess.toLowerCase() === this.state.word.toLowerCase();
    
    if (correct) {
      this.state.hasGuessed.set(client.sessionId, true);
      const player = this.state.players.get(client.sessionId);
      if (player) player.score += 10;
      
      client.send("correct_guess");
      this.broadcast("player_guessed", { playerName: player.playerName });
    } else {
      client.send("wrong_guess");
    }
  }
}
```

## Next Steps

1. **Study existing rooms** - Look at `GenericGameRoom.ts` for patterns
2. **Start simple** - Build basic version first, add features later
3. **Test thoroughly** - Use test scripts to verify behavior
4. **Read Colyseus docs** - https://docs.colyseus.io/
5. **Ask questions** - Open GitHub issues for help

## Common Pitfalls

1. **Forgetting super.onCreate()** - Always call parent method
2. **Complex state objects** - Keep state simple and serializable
3. **Not validating inputs** - Always validate client messages
4. **Memory leaks** - Cancel timers in onDispose()
5. **Not handling disconnects** - BaseGameRoom handles this, trust it
6. **Mutating state incorrectly** - Use Schema types, not plain objects

## Resources

- [Colyseus Schema Documentation](https://docs.colyseus.io/colyseus/state/schema/)
- [Colyseus Room API](https://docs.colyseus.io/colyseus/server/room/)
- [API.md](API.md) - Message protocol reference
- [PERSISTENCE_GUIDE.md](docs/PERSISTENCE_GUIDE.md) - Persistence system

---

**Ready to build?** Start with the Quick Start example and expand from there!
