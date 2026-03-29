# PiperQL Frontend

Next.js 16 + React 19 frontend for PiperQL. A real-time conversational interface for querying PostgreSQL databases using natural language.

## What it does

- Chat interface where you ask questions in plain English and get direct answers
- Real-time streaming responses via Server-Sent Events (SSE)
- 10+ chart types auto-generated from query results (bar, line, pie, area, scatter, radar, donut, stacked bar, radial bar, composed)
- Time range filters and PNG chart downloads
- Three access modes: Read Only, CRUD, Full Access
- Destructive query confirmation (type table name to confirm DROP/TRUNCATE)
- Light/dark/auto theme switching
- Admin panel: user management, settings configuration
- Conversation history with search and delete
- AI memory indicator (Mem0-powered cross-session context)

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Charts | Recharts 3.8 |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| Export | html-to-image (PNG chart download) |
| Auth | JWT stored in localStorage |

## Prerequisites

- Node.js 20+
- Backend running on port 8000

## Setup

```bash
# From root directory
make install-frontend

# Or manually
cd frontend
npm install
```

## Configure

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Run

```bash
make run-frontend       # Development server on http://localhost:3000
```

Or manually:
```bash
npm run dev             # Development
npm run build           # Production build
npm start               # Production server
```

## Components

### Core Chat
| Component | Purpose |
|-----------|---------|
| `ChatWindow.tsx` | Main chat with SSE streaming, message state, database/mode selection |
| `MessageBubble.tsx` | Renders user/assistant messages with tables, charts, markdown |
| `MarkdownRenderer.tsx` | GFM markdown with syntax highlighting and code copy |
| `SqlResult.tsx` | Query result data tables |
| `ChartRenderer.tsx` | 10+ chart types with time filters and PNG download |
| `ConfirmationPrompt.tsx` | Write operation confirm/cancel with type-to-confirm for destructive ops |

### Navigation
| Component | Purpose |
|-----------|---------|
| `Sidebar.tsx` | Logo, conversation list, new chat, profile/settings/sign out |
| `ConversationList.tsx` | Conversation items with smart timestamps and delete |

### Admin
| Component | Purpose |
|-----------|---------|
| `UserManagement.tsx` | Create, edit, delete users (admin only) |
| `Settings.tsx` | Configure API keys, database credentials, integrations |
| `Profile.tsx` | View/edit profile, change password |

### Auth
| Component | Purpose |
|-----------|---------|
| `LoginForm.tsx` | Username/password login form |
| `ThemeSwitch.tsx` | Light/dark/auto theme toggle |

## API Integration

All API calls go through `lib/api.ts` which:
- Adds `Authorization: Bearer {token}` to every request
- Reads token from `localStorage.auth_token`
- Redirects to login on 401 responses
- Base URL from `NEXT_PUBLIC_API_URL`

### Key Endpoints Used
| Endpoint | Purpose |
|----------|---------|
| `POST /api/chat/stream` | SSE streaming chat (main feature) |
| `POST /api/chat/confirm` | Confirm write operations |
| `GET /api/databases/` | List available databases |
| `GET /api/conversations/` | Load conversation history |
| `GET /api/settings/validate` | Check for missing API keys |

## Theme System

Three modes: auto (system preference), light, dark. CSS custom properties switch all colors dynamically. Stored in `localStorage`.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout, metadata, theme
│   │   ├── page.tsx          # Main app (chat, admin views)
│   │   └── login/page.tsx    # Login page
│   ├── components/           # All React components
│   └── lib/
│       ├── api.ts            # API client with auth
│       └── types.ts          # TypeScript type definitions
├── public/
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

## License

AGPL-3.0
