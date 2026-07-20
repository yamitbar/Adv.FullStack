# Pathly — client

The React frontend for Pathly, a collaborative travel-memory journal. Built with React 19 and Vite, using React Router for routing, Redux Toolkit for trips/memories state, and React Context for authentication.

The full project documentation — architecture, environment variables, API reference, authentication flow, deployment, and known limitations — lives in the [root README](../README.md). This file only covers the client itself.

## Environment variable

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend API, including the `/api` prefix, e.g. `http://localhost:3000/api`. If unset, falls back to `http://localhost:3000/api` (see `src/services/api.js`). |

Copy `.env.example` to `.env` and adjust if your API isn't running on the default port.

## Scripts

```bash
npm install     # install dependencies
npm run dev      # start the Vite dev server (http://localhost:5173 by default)
npm run build     # production build into dist/
npm run lint       # oxlint
npm run preview     # serve the production build locally
```
