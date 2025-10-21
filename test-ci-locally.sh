#!/bin/bash

echo "🚀 Testing CI/CD Pipeline Locally"
echo "================================="

# Test Backend
echo ""
echo "📦 Testing Backend..."
cd backend || exit 1

echo "   Installing dependencies..."
npm ci --silent

echo "   Running linting..."
npm run lint

echo "   Running tests..."
npm run test:coverage -- --runInBand --detectOpenHandles --silent

# Test Frontend  
echo ""
echo "🎨 Testing Frontend..."
cd ../frontend || exit 1

echo "   Installing dependencies..."
npm ci --silent

echo "   Running linting..."
npm run lint

echo "   Running tests..."
npm run test:coverage -- --run --silent

echo ""
echo "✅ Local CI tests completed successfully!"
echo ""
echo "💡 Next steps to fix billing:"
echo "   1. Make repository public for unlimited CI minutes"
echo "   2. Or add payment method to GitHub account"
echo "   3. Or use alternative free CI service (GitLab, CircleCI)"
