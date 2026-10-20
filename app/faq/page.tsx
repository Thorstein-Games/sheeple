import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ: Playing Herd Mentality Online",
  description:
    "Can you play Herd Mentality online? Answers about Sheeple, the free herd mentality game for the browser: rules, player counts, phones, and playing with friends far away.",
  keywords: [
    "can you play herd mentality online",
    "herd mentality online faq",
    "sheeple faq",
    "online party game help",
  ],
  openGraph: {
    title: "Sheeple FAQ: Playing Herd Mentality Online",
    description:
      "Answers to common questions about playing Sheeple, a free herd mentality game, online with friends",
    type: "article",
  },
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
};

export default function FAQ() {
  const faqs = [
    {
      question: "How do I play Sheeple online?",
      answer:
        "Playing Sheeple is simple! Just enter your name on the homepage, create or join a room, and share the room code with friends. Once everyone joins, the game starts automatically. Answer questions trying to match what others will say - the most popular answer wins!",
    },
    {
      question: "Can you play Herd Mentality online?",
      answer:
        "Yes. Sheeple is a free herd mentality game that runs in your browser. Everyone gets the same question, answers on their own device, and scores by matching the most popular answer, just like the board game. Create a room, share the link, and play with friends wherever they are.",
    },
    {
      question: "Is Sheeple the same as Herd Mentality?",
      answer:
        "Sheeple is an independent game inspired by Herd Mentality, the party game by Big Potato Games. It isn't affiliated with Big Potato, and it uses its own questions and scoring, but the idea is the same: the answer that matches the herd wins.",
    },
    {
      question: "Is Sheeple free to play?",
      answer:
        "Yes! Sheeple is completely free to play. There are no hidden costs, no subscriptions, and no downloads required. Just visit our website and start playing instantly.",
    },
    {
      question: "How many players can play Sheeple?",
      answer:
        "You can play with 3 to 12 players in a single game. The game works best with 4-8 players, but it's fun with any group size within that range!",
    },
    {
      question: "Do I need to download anything?",
      answer:
        "No downloads required! Sheeple runs entirely in your web browser. Just visit the website, and you're ready to play.",
    },
    {
      question: "Can I play on mobile devices?",
      answer:
        "Absolutely! Sheeple works on all devices - phones, tablets, and computers. As long as you have a web browser and internet connection, you can play.",
    },
    {
      question: "How long does a game take?",
      answer:
        "A typical game lasts 10-20 minutes, depending on the number of rounds and players. You can customize the game length when creating a room.",
    },
    {
      question: "Can I play with friends in different locations?",
      answer:
        "Yes! That's one of the best things about playing a herd mentality game online. Share your room code with friends anywhere, and they can join instantly.",
    },
    {
      question: "Is there a chat feature?",
      answer:
        "Yes! Each room has a built-in chat where you can talk with other players during the game.",
    },
    {
      question: "What happens if someone disconnects?",
      answer:
        "If a player disconnects, they can rejoin using the same room code and name. The game will continue with the remaining players.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Everything you need to know about playing Sheeple
          </p>
        </header>

        {/* FAQ Items */}
        <section
          className="space-y-6"
          itemScope
          itemType="https://schema.org/FAQPage"
        >
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-xl p-8"
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                itemProp="name"
              >
                {faq.question}
              </h2>
              <div
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
              >
                <p className="text-lg text-gray-700" itemProp="text">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* CTA Section */}
        <section className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
          <p className="text-xl mb-6">
            Join thousands of players enjoying Sheeple!
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            Start Playing Now →
          </Link>
        </section>

        {/* Additional Help */}
        <section className="mt-8 text-center">
          <p className="text-gray-600">
            Still have questions?{" "}
            <Link
              href="/contact"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Contact us
            </Link>{" "}
            or check out our{" "}
            <Link
              href="/how-to-play"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              complete rules guide
            </Link>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
