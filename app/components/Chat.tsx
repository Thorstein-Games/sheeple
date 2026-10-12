"use client";

import { useState, useEffect, useRef } from "react";

/** A chat message as megingjord sends it (`chat` / `chat_history`). */
export interface ChatEntry {
  playerName: string;
  message: string;
  timestamp: number;
}

interface ChatProps {
  /** Messages to show, oldest first. */
  messages: ChatEntry[];
  /** This player's name; their own messages are shown on the right. */
  myName: string | null;
  /** Send a message; omit to make the chat read-only (e.g. not connected yet). */
  onSend?: (text: string) => void;
  title?: string;
}

export default function Chat({ messages, myName, onSend, title = "Room Chat" }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  // Newest message seen while the chat was last open (or at mount)
  const [seenUpTo, setSeenUpTo] = useState<ChatEntry | undefined>(messages[messages.length - 1]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Unread dot: someone else wrote after the last message seen with the chat open
  const seenIndex = seenUpTo ? messages.indexOf(seenUpTo) : -1;
  const hasUnreadMessages =
    !isOpen && messages.slice(seenIndex + 1).some((m) => m.playerName !== myName);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!onSend || !message.trim()) return;

    onSend(message.trim());
    setMessage("");
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    setSeenUpTo(messages[messages.length - 1]);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div
          className="mb-4 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col"
          style={{ height: "500px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-semibold text-lg">{title}</h3>
            <button
              onClick={handleToggleChat}
              className="hover:bg-blue-500 rounded p-1 transition-colors"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>No messages yet</p>
                <p className="text-sm">Be the first to say hi! 👋</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    msg.playerName === myName ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      msg.playerName === myName
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1">
                      {msg.playerName}
                    </p>
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 px-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!onSend || !message.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chat Bubble Button */}
      <button
        onClick={handleToggleChat}
        className="relative w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center"
        aria-label="Toggle chat"
      >
        {/* Unread indicator */}
        {hasUnreadMessages && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}

        {isOpen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

