#!/bin/bash

echo "============================================"
echo "🚀 Starting Agentic AI Platform"
echo "============================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Set environment variables
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
export FLASK_APP=backend/agentic_api_server.py

# Activate virtual environment if exists
if [ -d "venv" ]; then
    echo -e "\n${YELLOW}Activating virtual environment...${NC}"
    source venv/bin/activate
fi

# Check dependencies
echo -e "\n${YELLOW}Checking Python dependencies...${NC}"
if ! python3 -c "import flask" 2>/dev/null; then
    echo "⚠️  Dependencies not installed. Installing..."
    pip install -r requirements.txt
fi

# Start backend server in background
echo -e "\n${GREEN}Starting Backend API Server...${NC}"
python3 backend/agentic_api_server.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 5

# Start frontend
echo -e "\n${GREEN}Starting Frontend Dashboard...${NC}"
cd frontend

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start frontend dev server
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Return to root
cd ..

echo -e "\n============================================"
echo -e "${GREEN}✅ Agentic AI Platform Started Successfully!${NC}"
echo "============================================"
echo ""
echo "📡 Backend API: http://localhost:5000"
echo "🔄 WebSocket: ws://localhost:5000"
echo "🌐 Frontend Dashboard: http://localhost:3000"
echo ""
echo "API Endpoints:"
echo "  - Generate Code: POST /api/generate-code"
echo "  - Analyze Complexity: POST /api/analyze-complexity"
echo "  - Platform Stats: GET /api/platform/stats"
echo ""
echo "Press Ctrl+C to stop all services..."
echo "============================================"

# Handle cleanup on exit
cleanup() {
    echo -e "\n\n${YELLOW}Stopping services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
