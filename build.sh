#!/bin/bash

# Build script for Heroku deployment

echo "🚀 Starting TEC Platform build process..."

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd frontend
yarn install --frozen-lockfile

echo "🏗️ Building frontend..."
yarn build

# Go back to root
cd ..

# Install backend dependencies
echo "🐍 Installing backend dependencies..."
cd backend
pip install -r requirements.txt

echo "✅ Build completed successfully!"