#!/bin/bash
echo "🔪 Killing any process on port 3000..."
kill $(lsof -ti:3000) 2>/dev/null && echo "✅ Killed old process" || echo "ℹ️  No process was running"
sleep 0.5
echo "🚀 Starting Cat-See-World..."
npm start
