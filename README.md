# Sheeple Game

A real-time multiplayer game built with Next.js and Socket.IO.

## Features

- 🎮 Real-time multiplayer gameplay with Socket.IO
- ⚡ Custom Node.js server for WebSocket connections
- 🎨 Built with Next.js 16 and React 19
- 💅 Styled with Tailwind CSS
- 🔧 TypeScript for type safety

## Getting Started

First, install dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Custom Server with Socket.IO

This project uses a custom Node.js server instead of the default Next.js server to enable Socket.IO functionality. The server is defined in `server.ts`.

For detailed information about the Socket.IO setup, see [SOCKET_SETUP.md](./SOCKET_SETUP.md).

## Project Structure

```
sheeple-game/
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/
│   └── socket/            # Socket.IO setup
│       ├── handlers.ts    # Socket event handlers
│       ├── events.ts      # Event constants
│       ├── types.ts       # TypeScript types
│       ├── SocketProvider.tsx  # React context
│       └── index.ts       # Module exports
├── server.ts              # Custom Node.js server
└── next.config.ts         # Next.js configuration
```

## Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [SOCKET_SETUP.md](./SOCKET_SETUP.md) - Detailed Socket.IO setup guide
