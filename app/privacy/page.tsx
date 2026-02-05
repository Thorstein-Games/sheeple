import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: February 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to Sheeple. This Privacy Policy explains how we collect,
              use, and protect your information when you play our game.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Information We Collect
            </h2>
            <h3 className="text-xl font-semibold mb-3">
              Information You Provide
            </h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Player name (username you choose when joining a game)</li>
              <li>Game responses and answers you submit during gameplay</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">
              Automatically Collected Information
            </h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address</li>
              <li>Game session data and statistics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p className="text-gray-700 mb-4">
              Sheeple uses cookies and similar technologies to maintain your
              game session and provide core functionality. Cookies are required
              to play the game as they:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Maintain your player name and session information</li>
              <li>Keep you connected to your game room</li>
              <li>Remember your game preferences</li>
              <li>Ensure proper game state management</li>
            </ul>
            <p className="text-gray-700 mb-4">
              By playing Sheeple, you consent to the use of these essential
              cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Advertisements</h2>
            <p className="text-gray-700 mb-4">
              Sheeple displays advertisements to support the free operation of
              the game. These advertisements may use cookies and similar
              technologies to provide relevant ads. By playing Sheeple, you
              agree to the display of advertisements as a condition of using the
              free service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Provide and maintain the game service</li>
              <li>Enable multiplayer gameplay and real-time interactions</li>
              <li>Display player names and answers during gameplay</li>
              <li>Improve game performance and user experience</li>
              <li>Diagnose technical issues and provide support</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Data Storage and Security
            </h2>
            <p className="text-gray-700 mb-4">
              Game session data is temporarily stored during active gameplay and
              is automatically deleted when the game session ends. We implement
              reasonable security measures to protect your information, but
              please note that no method of transmission over the internet is
              100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Third-Party Services
            </h2>
            <p className="text-gray-700 mb-4">
              We may use third-party services for analytics, advertisements, and
              hosting. These services may have their own privacy policies and
              may collect information according to their terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Sheeple is intended for general audiences. We do not knowingly
              collect personal information from children under 18. If you are a
              parent or guardian and believe your child has provided us with
              personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. Any changes
              will be posted on this page with an updated "Last Updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy, please visit our{" "}
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                contact page
              </Link>{" "}
              or{" "}
              <Link
                href="/faq"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                FAQ
              </Link>
              .
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
