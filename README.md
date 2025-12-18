# Retro - Team Retrospective Platform

A real-time team retrospective platform with AI-powered summaries and vibe images, built with React and Node.js.

## Features

- 📝 Real-time collaborative feedback (What Went Well, What Didn't Go Well, Feedback)
- 🤖 AI-generated summaries using Gemini 3 Pro
- 🎨 AI-generated team "vibe" images using Gemini 3 Pro Image
- ⚡ Real-time updates via WebSocket

## Prerequisites

- Node.js (v18 or higher)
- npm
- Gemini API Key ([Get one here](https://aistudio.google.com/apikey))

## Quick Start

### 1. Clone and Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Create a `.env` file in the `server/` directory:

```env
GEMINI_API_KEY=your_actual_api_key_here

# AI generation cron interval (cron syntax)
# Examples: '*/1 * * * *' = every 1 minute, '*/30 * * * *' = every 30 minutes
AI_CRON_INTERVAL=*/30 * * * *
```

### 3. Run the Application

**Terminal 1 - Start the server:**
```bash
cd server
node index.js
```

**Terminal 2 - Start the client:**
```bash
cd client
npm run dev
```

### 4. Open in Browser

Visit `http://localhost:5173` to use the app.

## Project Structure

```
retro/
├── client/          # React frontend (Vite)
│   ├── src/
│   └── package.json
├── server/          # Node.js backend
│   ├── index.js     # Main server file
│   ├── aiService.js # Gemini AI integration
│   ├── .env         # Environment variables
│   └── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Gemini API key | Required |
| `AI_CRON_INTERVAL` | Cron expression for AI generation | `*/30 * * * *` (every 30 min) |

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Socket.io-client
- **Backend:** Node.js, Express, Socket.io, SQLite
- **AI:** Gemini 3 Pro (text), Gemini 3 Pro Image (images)
