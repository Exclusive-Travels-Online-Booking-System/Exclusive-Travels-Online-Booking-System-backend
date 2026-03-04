# Tourism Treasure Backend

A basic Node.js/Express backend server for the Tourism Treasure application.

## Installation

```bash
npm install
```

## Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Available Routes

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/destinations` - Get all destinations
- `GET /api/tours` - Get all tours

## Environment Variables

Create a `.env` file in the backend directory:

```
PORT=5000
NODE_ENV=development
```

## Server

The server runs on `http://localhost:5000` by default.
