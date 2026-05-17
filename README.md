[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/-LLdhYKz)
# DBMS Project Template

A full-stack project template with a React (Vite) frontend and a Node.js/Express backend.

## Project Structure

```
dbms-project-template/
├── frontend/        # React + Vite client application
└── backend/         # Node.js + Express API server
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A running database instance

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in both `frontend/` and `backend/` directories.

**frontend/.env**
```
VITE_API_URL=http://localhost:5000
```

**backend/.env**
```
PORT=5000
DB_URL=your_database_connection_string
```

## Scripts

| Location  | Command          | Description            |
|-----------|------------------|------------------------|
| frontend  | `npm run dev`    | Start Vite dev server  |
| frontend  | `npm run build`  | Build for production   |
| backend   | `npm run dev`    | Start backend server   |

## License

MIT
