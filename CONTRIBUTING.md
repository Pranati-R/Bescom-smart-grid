# Contributing to GridShield AI

Welcome to the GridShield AI development guide. The platform is currently configured as a functional demonstration with mock data generation. To transition this to a production deployment, several key architectural updates must be made.

## 1. Machine Learning Integration
Currently, the AI analytics (forecasts, theft detection, explainability) are powered by randomized mock generators located in `backend/app/utils/mock_data.py`. 

**Action Items:**
- Replace the mock generators in `routers/analytics.py` with calls to actual ML inference services (e.g., loading serialized PyTorch/Scikit-Learn models or making API calls to a dedicated inference server).
- Update the `AIExplanation` schema in `models/ai.py` to match the exact output features of your specific models.

## 2. Database & Persistence
The project uses SQLite via SQLAlchemy. The `database.lifespan` event automatically triggers the `seeder.py` script to populate the database with mock infrastructure if empty.

**Action Items:**
- Migrate to a robust RDBMS (PostgreSQL) for production.
- Disable the auto-seeding logic in `backend/app/main.py`.
- Configure actual database migration tools (e.g., Alembic).

## 3. Real-time Data Streaming
The WebSockets in `backend/app/routers/websocket.py` simulate live data streams using `asyncio.sleep` loops.

**Action Items:**
- Connect the WebSocket endpoints to a real message broker (Kafka, RabbitMQ, or Redis Pub/Sub) that is receiving live telemetry from physical smart meters.
- Implement robust client tracking and error handling in the WebSocket router to support thousands of concurrent connections.

## 4. Authentication & Security
The `routers/auth.py` file uses a simplified, non-secure mock JWT implementation to allow easy testing.

**Action Items:**
- Implement a secure JWT authentication strategy utilizing libraries like `passlib` and `python-jose`.
- Integrate actual password hashing (bcrypt).
- Move the `JWT_SECRET_KEY` into secure environment variables.

## 5. UI/UX Refinements
The frontend is built with React and Tailwind CSS.
- Ensure any new pages adhere to the established "Cyber-Energy" design language (defined in `index.css`).
- Use the existing `Components.jsx` library (`CyberCard`, `MetricCard`, `RadialGauge`, etc.) to maintain visual consistency.
