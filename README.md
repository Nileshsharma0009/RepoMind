# RepoMind

AI-powered repository search, chat, documentation, and architecture visualization.

## Project Structure

This project is structured as a monorepo containing both the backend and frontend components.

- `backend/`: Node.js/Express backend server containing AI services, code parsers, AST treesitter analysis, memory agent, and vector search integrations (Pinecone/Gemini Embeddings).
- `frontend/`: Vite/React frontend dashboard, featuring Monaco Editor for code view, Mermaid for architectural flowcharts, Chat interface, and Project Management dashboards.
