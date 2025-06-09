#!/bin/bash

# Traders Mastery Development Startup Script
# Starts both backend and frontend in development mode

echo "🚀 Starting Traders Mastery Development Environment..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if backend dependencies are installed
if [ ! -d "traders-mastery-backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd traders-mastery-backend
    npm install
    cd ..
fi

# Check if frontend dependencies are installed  
if [ ! -d "traders-mastery-frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd traders-mastery-frontend
    npm install
    cd ..
fi

# Start backend server
echo "🔧 Starting backend server on port 3001..."
cd traders-mastery-backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend development server
echo "🎨 Starting frontend server on port 5173..."
cd traders-mastery-frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Development environment is running!"
echo ""
echo "📡 Backend API: http://localhost:3001"
echo "🌐 Frontend App: http://localhost:5173"
echo ""
echo "💡 Make sure to:"
echo "   1. Add your Claude API key to traders-mastery-backend/.env"
echo "   2. Set ANTHROPIC_API_KEY=your_actual_api_key"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes to finish
wait