"use client";

interface Player {
  sessionId: string;
  playerName: string;
  isReady: boolean;
  score: number;
}

interface RoundData {
  roundNumber: number;
  prompt: string;
  timeLimit: number;
}

interface RevealAnswersData {
  answers: Array<{
    sessionId: string;
    playerName: string;
    answer: string;
    points: number;
    count: number;
  }>;
}

interface RoundResultsProps {
  revealedAnswers: RevealAnswersData;
  players: Player[];
  currentSessionId: string | undefined;
  currentRound: RoundData | null;
  totalRounds: number;
  isHost: boolean;
  onNextRound: () => void;
}

export default function RoundResults({
  revealedAnswers,
  players,
  currentSessionId,
  currentRound,
  totalRounds,
  isHost,
  onNextRound,
}: RoundResultsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold mb-6">Round Results</h2>

      <div className="space-y-4 mb-6">
        {revealedAnswers.answers.map((answer, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-4 ${
              answer.points > 0
                ? "bg-green-50 border-green-400"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  {answer.playerName}
                </p>
                <p className="text-2xl mt-2 font-medium">{answer.answer}</p>
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${
                    answer.points > 0 ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  +{answer.points} pts
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Scores */}
      <div className="mt-6 bg-gray-100 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Current Scores</h3>
        <div className="space-y-2">
          {[...players]
            .sort((a, b) => b.score - a.score)
            .map((player) => (
              <div key={player.sessionId} className="flex justify-between">
                <span>
                  {player.playerName}
                  {player.sessionId === currentSessionId && " (You)"}
                </span>
                <span className="font-bold">{player.score} pts</span>
              </div>
            ))}
        </div>
      </div>

      {currentRound && currentRound.roundNumber < totalRounds && (
        <div className="w-full mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
          {isHost ? (
            <button
              onClick={onNextRound}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Start Next Round
            </button>
          ) : (
            <p className="text-blue-700 font-semibold">
              Waiting for the host to start the next round...
            </p>
          )}
        </div>
      )}

      <tg-ad game="sheeple" format="box" className="block mt-8"></tg-ad>
    </div>
  );
}
