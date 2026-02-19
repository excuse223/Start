#!/bin/bash

echo "🚀 Setting up Work Hours Tracker Backend..."

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Setup database
echo "🗄️  Setting up database..."
bash scripts/setup-db.sh

# Initialize admin user
echo "👤 Creating default admin user..."
python init_db.py

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Start the server: uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo "   2. Test login:"
echo '      curl -X POST http://localhost:8000/api/auth/login \'
echo '        -H "Content-Type: application/json" \'
echo '        -d '"'"'{"username": "admin", "password": "admin123"}'"'"''
echo ""
echo "📝 Default credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   ⚠️  Change password after first login!"
