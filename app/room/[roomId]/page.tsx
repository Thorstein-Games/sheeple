"use client";

import { useParams } from "next/navigation";
import { useColyseus } from "@/lib/colyseus/ColyseusProvider";
import GameEndScreen from "@/app/components/GameEndScreen";
import ReadyRoom from "@/app/components/ReadyRoom";
import RoundPlay from "@/app/components/RoundPlay";
import RoundResults from "@/app/components/RoundResults";
import RoundTransition from "@/app/components/RoundTransition";
import Chat from "@/app/components/Chat";
import { useGameRoom } from "./useGameRoom";

export default function RoomPage() {
  const params = useParams();
  const { playerName, client } = useColyseus();
  const roomId = params.roomId as string;

  const { gameStarted, gameEnded, connection, players, round, gameEnd, ui, actions } =
    useGameRoom(roomId, playerName, client);

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
        {ui.showHostNotice && (
          <div className="mb-4 bg-blue-100 border-2 border-blue-300 text-blue-800 rounded-lg p-3 text-center font-medium">
            You are now the host
          </div>
        )}
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
            roomId={roomId}
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
                nextRoundCountdown={round.nextRoundCountdown}
              />
            )}

            {!round.currentRound && !round.revealedAnswers && <RoundTransition />}
          </div>
        )}
      </div>

      {/* Chat Component */}
      <Chat roomId={roomId} />
    </div>
  );
}
