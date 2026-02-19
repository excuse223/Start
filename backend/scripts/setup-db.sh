#!/bin/bash

echo "🔄 Setting up PostgreSQL database..."

# Start PostgreSQL service
echo "Starting PostgreSQL..."
sudo service postgresql start

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until sudo -u postgres pg_isready -q; do
  sleep 1
done

# Create database and user
echo "Creating database..."
sudo -u postgres psql << EOF
-- Create database if not exists
SELECT 'CREATE DATABASE work_hours_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'work_hours_db')\gexec

-- Set password for postgres user
ALTER USER postgres PASSWORD 'postgres';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE work_hours_db TO postgres;
EOF

# Run schema
echo "Running schema..."
sudo -u postgres psql -d work_hours_db -f "$(dirname "$0")/../schema.sql"

echo "✅ Database setup complete!"
