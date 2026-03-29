# Share Notes - Frontend

The frontend client for the Share Notes application, built with React and TypeScript.

## Tech Stack

- React 19 + TypeScript
- Vite (build tool)
- Material UI (MUI)
- Quill (rich text editor)
- Socket.io Client (real-time collaboration)
- React Router (routing)
- SCSS (styling)

## Getting Started

### Prerequisites

- Node.js (v18+)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root:

```
VITE_SERVER_URL=<your_backend_url>
```

### Running

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── api/          # API service layer
├── assets/       # Styles (SCSS)
├── components/   # Reusable UI components
│   ├── auth/     # Authentication components
│   ├── common/   # Shared components
│   ├── layout/   # Layout components
│   └── notes/    # Note-related components
├── constants/    # App constants
├── context/      # React context (AuthContext)
├── hooks/        # Custom hooks (useSocket)
├── pages/        # Page components
│   ├── AdminPage.tsx
│   ├── DocumentPage.tsx
│   └── HelpPage.tsx
├── types/        # TypeScript type definitions
├── App.tsx       # Root component
├── main.tsx      # Entry point
└── theme.ts      # MUI theme configuration
```

## Features

- Real-time collaborative note editing via Socket.io
- Rich text editing with Quill
- Shareable note links
- Admin page for note management
- Help page with usage guide
