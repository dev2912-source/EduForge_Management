FROM node:18-alpine

WORKDIR /app

# 1. Root dependencies (for concurrently)
COPY package.json package-lock.json* ./
RUN npm install --production

# 2. Backend Setup
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY backend ./backend/

# 3. Frontend Setup
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend ./frontend/
RUN cd frontend && npm run build

# 4. Environment Variables
ENV NODE_ENV production
ENV BACKEND_PORT 5000
# Note: The PORT environment variable will be dynamically provided by Render for the frontend.

# 5. Start both servers simultaneously
CMD ["npm", "start"]
