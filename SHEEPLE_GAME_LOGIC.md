# Sheeple Game Logic for Colyseus Server

This document describes the Sheeple-specific game logic required for implementing the game on an external Colyseus server. It assumes you already have generic logic for player setup, room setup, and basic game state management. This focuses on the unique rules, scoring, and prompt/answer mechanics of Sheeple.

---

## Game Overview

- **Sheeple** is a party game where players answer prompts and score points by matching their answers with other players ("think like the herd").
- The game consists of multiple rounds. Each round, a prompt is shown, and players submit answers. Points are awarded for matching answers.

---

## Core Game State

- **Room State** extends your base game state with:
  - `currentPrompt: string` — The prompt for the current round.
  - `roundStartTime: number` — Timestamp when the round started.
  - `roundDuration: number` — Duration of each round (default: 30,000 ms).
  - `waitingForNextRound: boolean` — True if waiting for host to start next round.
  - `answers: Map<sessionId, string>` — Raw answers submitted by players.
  - `normalizedAnswers: Map<sessionId, string>` — Normalized answers for matching.
  - `submittedPlayers: Map<sessionId, boolean>` — Tracks who has submitted.
  - `previousWinners: string[]` — Session IDs of previous round winners.
- **Player State** extends your base player schema with:
  - `score: number` — Player's current score.

---

## Prompt Logic

- Prompts are drawn from a large, shuffled list (see `GAME_PROMPTS` in code).
- Use a `PromptQueue` that shuffles and cycles through prompts, ensuring no repeats until all prompts are used.
- Example prompt categories: Food, Animals, Places, Entertainment, Sports, etc.

---

## Answer Normalization & Matching

- **Normalization:**
  - Convert to lowercase.
  - Remove all non-alphanumeric characters (punctuation, spaces, special chars).
- **Matching:**
  - Answers are considered a match if:
    - They are identical after normalization.
    - One is a substring of the other.
    - Levenshtein distance ≤ 1 (minor typo tolerance).

---

## Round Flow

1. **Start Round:**
   - Increment round counter.
   - Clear previous answers and submitted flags.
   - Draw next prompt from the queue.
   - Broadcast prompt and round timer to all players.
2. **Answer Submission:**
   - Players submit answers (one per round).
   - Store both raw and normalized answers.
   - When all players have submitted (or timer expires), reveal answers.
3. **Reveal Answers & Scoring:**
   - Group answers by similarity (using matching logic above).
   - For each group with >1 player:
     - Each player in the group receives points equal to the group size, capped at 3 points per round.
   - Broadcast all answers, group sizes, and points awarded.
   - Broadcast updated scores.
4. **Next Round:**
   - Host can trigger next round if rounds remain.
   - If all rounds complete, broadcast final scores and winner(s).

---

## Scoring Example

- If 4 players submit: "apple", "Apple", "appl", "banana"
  - "apple", "Apple", and "appl" are grouped (match by normalization/Levenshtein).
  - Each of those 3 players gets 3 points (group size, capped at 3).
  - "banana" gets 0 points.

---

## End of Game

- After the last round, broadcast final scores and declare winner(s) (highest score).
- Reset scores and ready state for next game.

---

## Additional Notes

- Minimum 2 players required to start.
- Only host can start game and next round.
- Player names can only be changed in lobby.
- All state changes should be broadcast to clients as appropriate.

---

## Prompt List Example

- See the default prompts array in `SheepleRoom.ts` (megingjord server repo) for the full list. Example prompts:
  - Name a fruit
  - Name a pizza topping
  - Name a country
  - Name a video game
  - Name a sport
  - Name something you do every day

---

## Implementation References

- See `SheepleRoom.ts` (megingjord server repo) for round/answer logic, scoring, and prompt cycling.
- See `SheepleState.ts` (both repos) and `Player.ts` (`shared/schema/`, this repo) for state structure.

---

This should provide all Sheeple-specific logic needed for an external Colyseus server implementation. For further details, refer to the code files mentioned above.
