"use client";

import { useEffect, useState } from "react";
import { useColyseus, getCurrentRoomCode } from "@/lib/colyseus/ColyseusProvider";
import GameEndScreen from "@/app/components/GameEndScreen";
import ReadyRoom from "@/app/components/ReadyRoom";
import RoundPlay from "@/app/components/RoundPlay";
import RoundResults from "@/app/components/RoundResults";
import RoundTransition from "@/app/components/RoundTransition";
import Chat from "@/app/components/Chat";
import { useGameRoom } from "./useGameRoom";

export default function RoomPageClient() {
  const { playerName, client } = useColyseus();
  // usePathname() / useParams() return "_" (pre-rendered shell param) in static
  // export. getCurrentRoomCode() uses sessionStorage → URL as authoritative sources.
  const [roomCode, setRoomCode] = useState("_");
  useEffect(() => {
    setRoomCode(getCurrentRoomCode());
  }, []);

  const { gameStarted, gameEnded, connection, players, round, gameEnd, actions, chat } =
    useGameRoom(roomCode, playerName, client);

  if (!playerName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {gameEnded && gameEnd.gameEndData ? (
          <GameEndScreen
            gameEndData={gameEnd.gameEndData}
            currentPlayerId={connection.currentSessionId || undefined}
            hostId={connection.hostId}
            room={connection.room}
            onPlayAgain={actions.handlePlayAgain}
          />
        ) : !gameStarted ? (
          <ReadyRoom
            players={players.list.map((p) => ({
              playerId: p.sessionId,
              playerName: p.playerName,
              isReady: p.isReady,
            }))}
            roomCode={roomCode}
            isConnected={connection.isConnected}
            isReady={players.isReady}
            readyPlayers={players.readyPlayers}
            previousWinners={players.previousWinners}
            currentPlayerId={connection.currentSessionId || undefined}
            hostId={connection.hostId}
            room={connection.room}
            onPlayerReady={actions.handlePlayerReady}
            onStartGame={actions.handleStartGame}
            onUpdatePlayerName={actions.handleUpdatePlayerName}
            onKickPlayer={actions.handleKickPlayer}
          />
        ) : (
          <div className="space-y-6">
            {round.currentRound && !round.revealedAnswers && (
              <RoundPlay
                currentRound={round.currentRound}
                totalRounds={round.totalRounds}
                players={players.list}
                currentSessionId={connection.currentSessionId}
                playerAnswer={round.playerAnswer}
                hasSubmitted={round.hasSubmitted}
                submittedPlayers={players.submittedPlayers}
                room={connection.room}
                onAnswerChange={round.setPlayerAnswer}
                onSubmitAnswer={actions.handleSubmitAnswer}
                onTimeUp={actions.handleTimeUp}
              />
            )}

            {round.revealedAnswers && (
              <RoundResults
                revealedAnswers={round.revealedAnswers}
                players={players.list}
                currentSessionId={connection.currentSessionId}
                currentRound={round.currentRound}
                totalRounds={round.totalRounds}
                isHost={connection.currentSessionId === connection.hostId}
                onNextRound={actions.handleNextRound}
              />
            )}

            {!round.currentRound && !round.revealedAnswers && <RoundTransition />}
          </div>
        )}
      </div>

      {/* Chat Component */}
      <Chat
        messages={chat.messages}
        myName={playerName}
        onSend={connection.isConnected ? chat.send : undefined}
      />
    </div>
  );
}
