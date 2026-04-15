#!/bin/bash

# TeamRio Full Stack Launcher
# ---------------------------

echo "🛑 Stopping any existing instances..."
pkill -f "log-analyzer-service"
pkill -f "vite"
sleep 2

echo "🧹 Cleaning and Building Backend..."
cd log-analyzer-service
./mvnw clean package -DskipTests -q
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed! Attempting with system maven..."
    mvn clean package -DskipTests -q
    if [ $? -ne 0 ]; then
        echo "❌ Backend build failed again. Exiting."
        exit 1
    fi
fi
cd ..

echo "📦 Installing Frontend Dependencies..."
cd dashboard
npm install
cd ..

echo "🚀 Starting Services..."

# 1. Start Backend
echo "   > Starting Backend (Port 8090)..."
nohup ./start-analyzer.sh > analyzer.log 2>&1 &
BACKEND_PID=$!
echo "     Started with PID $BACKEND_PID"

# 2. Wait for Backend
echo "   > Waiting for Backend to be ready..."
timeout 60s bash -c 'until grep -q "Started LogAnalyzerServiceApplication" analyzer.log 2>/dev/null; do sleep 1; done'
if [ $? -eq 0 ]; then
    echo "     ✅ Backend is READY!"
else
    echo "     ⚠️ Backend startup timed out or logs not found. Check analyzer.log."
fi

# 3. Start Frontend
echo "   > Starting Frontend (Port 5173)..."
cd dashboard
nohup npm run dev > ../dashboard.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "     Started with PID $FRONTEND_PID"

echo "------------------------------------------------"
echo "✅ TEAMRIO SYSTEM IS LIVE!"
echo "------------------------------------------------"
echo "📊 Dashboard: http://localhost:5173"
echo "⚙️  Backend:   http://localhost:8090"
echo "------------------------------------------------"
echo "📝 Logs:"
echo "   Backend:  tail -f analyzer.log"
echo "   Frontend: tail -f dashboard.log"
echo "------------------------------------------------"
