import "./Footer.css";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Links Section */}
          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
            <a
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Home
            </a>
            <a
              href="/how-to-play"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              How to Play
            </a>
            <a
              href="/faq"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              FAQ
            </a>
            <a
              href="/contact"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Contact
            </a>
          </div>

          {/* More Games Button */}
          <a
            href="https://thorsteingames.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="more-games-button bg-purple-600 text-white font-medium px-6 py-2 rounded-lg shadow-sm"
          >
            More Games
          </a>
        </div>

        {/* Copyright */}
        <div className="mt-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Sheeple Game. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
