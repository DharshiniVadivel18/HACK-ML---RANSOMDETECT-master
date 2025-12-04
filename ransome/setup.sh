#!/bin/bash

echo "🚀 Setting up RansomDetect - Ransomware Detection System"
echo "=================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup Backend
echo ""
echo "🔧 Setting up Backend..."
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Backend dependencies installed"

# Setup Frontend
echo ""
echo "🔧 Setting up Frontend..."
cd ../frontend

# Install Node.js dependencies
npm install

echo "✅ Frontend dependencies installed"

# Return to root directory
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && source venv/bin/activate && python app.py"
echo "2. Frontend: cd frontend && npm start"
echo ""
echo "Access the application at: http://localhost:3000"
echo "API documentation at: http://localhost:8000/docs"