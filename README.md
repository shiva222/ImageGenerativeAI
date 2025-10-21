# Mini AI Studio

A full-stack web application that simulates an AI image generation studio with user authentication and generation history.

## Features

- 🔐 User authentication with JWT
- 🖼️ Image upload with preview
- ✨ Simulated AI generation with style options
- 📊 Generation history (last 5 results)
- 🔄 Error handling with retry mechanism
- 📱 Responsive design with accessibility features

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- React Router
- Axios for API calls

### Backend
- Node.js + TypeScript
- Express
- SQLite database
- JWT authentication
- Multer for file uploads

### Testing
- Jest + Supertest (Backend)
- React Testing Library (Frontend)
- Playwright (E2E)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd aiProject
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Start the backend:
```bash
cd ../backend
npm run dev
```

5. Start the frontend:
```bash
cd ../frontend
npm run dev
```

The application will be available at `http://localhost:3000`

## API Documentation

See `OPENAPI.yaml` for complete API specification.

## Testing

Run all tests:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Project Structure

```
.
├── backend/          # Node.js + Express API
├── frontend/         # React application
├── tests/           # E2E tests
├── docs/            # Documentation
├── README.md
├── OPENAPI.yaml
├── EVAL.md
└── AI_USAGE.md
```

## Development

This project was built with AI assistance to accelerate development. See `AI_USAGE.md` for details on how AI tools were used.

## License

MIT
