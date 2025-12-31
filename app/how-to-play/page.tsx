import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Play Sheeple - Party Game Rules & Instructions | Play Online",
  description:
    "Learn how to play Sheeple, the ultimate party game where you think like the herd! Complete rules, scoring system, and game modes for 3-12 players. Start playing online now.",
  keywords: [
    "sheeple rules",
    "how to play sheeple",
    "party game online",
    "multiplayer party game",
    "group thinking game",
    "question game online",
  ],
  openGraph: {
    title: "How to Play Sheeple - Online Party Game Rules",
    description:
      "Master the art of thinking like the herd! Learn the complete rules and start playing Sheeple online with friends.",
    type: "article",
  },
};

export default function HowToPlay() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            How to Play Sheeple
          </h1>
          <p className="text-xl text-gray-600">
            The online party game where thinking like everyone else pays off!
          </p>
        </header>

        {/* Quick Start */}
        <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Quick Start</h2>
          <p className="text-lg text-gray-700 mb-4">
            Sheeple is a multiplayer party game where players answer questions
            trying to match what everyone else thinks. The more you think like
            the herd, the more points you score!
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-gray-800">
              <strong>Perfect for:</strong> 3-12 players | Family game nights |
              Virtual hangouts | Party entertainment
            </p>
          </div>
        </section>

        {/* Game Setup */}
        <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Game Setup</h2>
          <ol className="space-y-4 text-lg text-gray-700">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                1
              </span>
              <div>
                <strong>Create or Join a Room:</strong> One player creates a
                game room and shares the room code with friends.
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                2
              </span>
              <div>
                <strong>Enter Your Name:</strong> Each player chooses a display
                name to identify themselves during the game.
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                3
              </span>
              <div>
                <strong>Wait for Players:</strong> The game requires at least 3
                players to start, supporting up to 12 players total.
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                4
              </span>
              <div>
                <strong>Start Playing:</strong> Once everyone is ready, the host
                starts the game and the questions begin!
              </div>
            </li>
          </ol>
        </section>

        {/* How to Play */}
        <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Game Rules & Mechanics
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                Answering Questions
              </h3>
              <p className="text-lg text-gray-700 mb-3">
                Each round, all players receive the same question. Your goal is
                to answer in a way that matches the majority of other players.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  Questions can be about anything: favorites, opinions,
                  associations, or creative responses
                </li>
                <li>Type your answer before the timer runs out</li>
                <li>
                  Think strategically - what will most people say? What's the
                  most obvious answer?
                </li>
                <li>
                  Spelling doesn't have to be perfect, but clarity helps match
                  answers
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-bold text-gray-900 mb-2">Pro Tip:</h4>
              <p className="text-gray-800">
                The best answers aren't always the "correct" ones - they're the
                ones everyone else will think of! Sometimes the most obvious
                answer wins.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                Scoring System
              </h3>
              <p className="text-lg text-gray-700 mb-3">
                Points are awarded based on how many other players gave the same
                answer as you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <strong>Majority Answer:</strong> If your answer matches the
                  most common response, you earn points equal to the number of
                  players who gave that answer
                </li>
                <li>
                  <strong>Pink Sheep:</strong> If you're the only one with a
                  unique answer, you get 0 points that round (don't be the odd
                  one out!)
                </li>
                <li>
                  <strong>Multiple Majorities:</strong> If there's a tie for
                  most common answer, all tied answers earn points
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                Winning the Game
              </h3>
              <p className="text-lg text-gray-700">
                The player with the most points after all rounds wins! The best
                sheep thinker takes the crown. Games typically last 8-10 rounds,
                but the host can customize this.
              </p>
            </div>
          </div>
        </section>

        {/* Strategy Tips */}
        <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Winning Strategies
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                💭 Think Simple
              </h3>
              <p className="text-gray-700">
                Your first instinct is often what others will think too. Don't
                overthink it - go with the obvious answer!
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                👥 Know Your Audience
              </h3>
              <p className="text-gray-700">
                Playing with family vs. friends? Age matters! Consider what your
                specific group is likely to say.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                🎯 Avoid Being Clever
              </h3>
              <p className="text-gray-700">
                The wittiest answer rarely wins. Save your creativity for other
                games - conformity is key here!
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                ⚡ Answer Quickly
              </h3>
              <p className="text-gray-700">
                Your gut reaction is usually more aligned with the crowd. Don't
                second-guess yourself too much!
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                How many players do I need?
              </h3>
              <p className="text-gray-700">
                You need a minimum of 3 players to start a game, and can play
                with up to 12 players. The sweet spot is 4-8 players for the
                best experience.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Can I play on mobile devices?
              </h3>
              <p className="text-gray-700">
                Yes! Sheeple works on any device with a web browser - phones,
                tablets, laptops, or desktop computers. No downloads required.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                How long does a game take?
              </h3>
              <p className="text-gray-700">
                A typical game lasts 10-15 minutes, depending on the number of
                rounds and how quickly players answer. Perfect for quick party
                entertainment!
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Do I need to create an account?
              </h3>
              <p className="text-gray-700">
                No account needed! Just enter your name and start playing
                immediately. It's completely free and hassle-free.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Can I play with friends remotely?
              </h3>
              <p className="text-gray-700">
                Absolutely! Share your room code with friends anywhere in the
                world, and they can join your game instantly. Perfect for
                virtual game nights and online gatherings.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Join the Herd?</h2>
          <p className="text-xl mb-6">
            Now that you know how to play, gather your friends and start your
            first game!
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Start Playing Now
          </Link>
        </section>

        {/* Schema.org structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HowTo",
              name: "How to Play Sheeple Online",
              description:
                "Learn how to play Sheeple, the online party game where players try to match answers with the majority.",
              step: [
                {
                  "@type": "HowToStep",
                  name: "Create or Join a Room",
                  text: "One player creates a game room and shares the room code with friends.",
                },
                {
                  "@type": "HowToStep",
                  name: "Enter Your Name",
                  text: "Each player chooses a display name to identify themselves during the game.",
                },
                {
                  "@type": "HowToStep",
                  name: "Wait for Players",
                  text: "The game requires at least 3 players to start, supporting up to 12 players total.",
                },
                {
                  "@type": "HowToStep",
                  name: "Answer Questions",
                  text: "Each round, answer questions trying to match what the majority will say.",
                },
                {
                  "@type": "HowToStep",
                  name: "Score Points",
                  text: "Earn points when your answer matches the most common response from other players.",
                },
              ],
            }),
          }}
        />
      </article>
    </div>
  );
}
