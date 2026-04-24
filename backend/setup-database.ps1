# SiteScout Database Setup Script
# Run this after installing PostgreSQL

Write-Host "Setting up SiteScout database..." -ForegroundColor Green

# Database configuration
$DB_NAME = "sitescout"
$DB_USER = "postgres"
$DB_PASSWORD = "$!t3$c0ut"
$DB_PORT = "5433"

# Check if PostgreSQL is installed
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    Write-Host "PostgreSQL executable not found at $psqlPath" -ForegroundColor Red
    exit 1
}
Write-Host "Using PostgreSQL at: $psqlPath" -ForegroundColor Green

# Create database
Write-Host "Creating database '$DB_NAME'..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = $DB_PASSWORD
    & $psqlPath -U $DB_USER -h localhost -p $DB_PORT -c "CREATE DATABASE \"$DB_NAME\";" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Database might already exist, continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error creating database: $_" -ForegroundColor Red
    exit 1
}

# Run schema
Write-Host "Setting up database schema..." -ForegroundColor Yellow
try {
    & $psqlPath -U $DB_USER -h localhost -p $DB_PORT -d $DB_NAME -f "database/schema.sql"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Schema created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Error creating schema. Check the error messages above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error running schema: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host "You can now start the backend server with: npm run dev" -ForegroundColor Cyan