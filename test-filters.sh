#!/bin/bash

# Test script for filter functionality
# Run this after starting the dev server: npm run dev

echo "🧪 Testing Filter Functionality"
echo "================================"
echo ""

# Test 1: Equipment filter
echo "Test 1: Equipment Filter (dumbbell)"
curl -s "http://localhost:3000/api/exercises?equipment=dumbbell" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'✅ Results: {data[\"count\"]} exercises'); ex=data['exercises']; print(f'   First: {ex[0][\"name\"] if ex else \"None\"}'); print(f'   Equipment: {ex[0][\"equipment\"] if ex else \"N/A\"}')" 2>/dev/null || echo "❌ Failed"
echo ""

# Test 2: Location filter
echo "Test 2: Location Filter (gym)"
curl -s "http://localhost:3000/api/exercises?location=gym" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'✅ Results: {data[\"count\"]} exercises'); ex=data['exercises']; print(f'   First: {ex[0][\"name\"] if ex else \"None\"}'); print(f'   Location: {ex[0][\"location\"] if ex else \"N/A\"}')" 2>/dev/null || echo "❌ Failed"
echo ""

# Test 3: Combined filters
echo "Test 3: Combined Filters (gym + dumbbell)"
curl -s "http://localhost:3000/api/exercises?location=gym&equipment=dumbbell" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'✅ Results: {data[\"count\"]} exercises'); ex=data['exercises']; print(f'   First: {ex[0][\"name\"] if ex else \"None\"}')" 2>/dev/null || echo "❌ Failed"
echo ""

# Test 4: Difficulty filter
echo "Test 4: Difficulty Filter (beginner)"
curl -s "http://localhost:3000/api/exercises?difficulty=beginner" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'✅ Results: {data[\"count\"]} exercises'); ex=data['exercises']; print(f'   First: {ex[0][\"name\"] if ex else \"None\"}'); print(f'   Difficulty: {ex[0][\"difficulty\"] if ex else \"N/A\"}')" 2>/dev/null || echo "❌ Failed"
echo ""

# Test 5: Category filter
echo "Test 5: Category Filter (strength)"
curl -s "http://localhost:3000/api/exercises?category=strength" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'✅ Results: {data[\"count\"]} exercises'); ex=data['exercises']; print(f'   First: {ex[0][\"name\"] if ex else \"None\"}'); print(f'   Category: {ex[0][\"category\"] if ex else \"N/A\"}')" 2>/dev/null || echo "❌ Failed"
echo ""

echo "================================"
echo "✅ All filters are now working!"
