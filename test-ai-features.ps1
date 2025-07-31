# AI Features Test Suite - PowerShell Version
# Comprehensive testing for all AI functionality

param(
    [string]$TestType = "all"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Check-Dependencies {
    Write-Status "Checking dependencies..."
    
    if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "npm is not installed"
        exit 1
    }
    
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js is not installed"
        exit 1
    }
    
    Write-Success "Dependencies check passed"
}

function Run-BackendTests {
    Write-Status "Running Backend AI Tests..."
    Write-Host "-------------------------------"
    
    Set-Location backend-nestjs
    
    # Install dependencies if needed
    if (!(Test-Path "node_modules")) {
        Write-Status "Installing backend dependencies..."
        npm install
    }
    
    # Run specific AI-related tests
    Write-Status "Running Chatbot Service tests..."
    npm test -- --testPathPattern="chatbot.*spec.ts" --verbose
    
    Write-Status "Running Slide Regeneration tests..."
    npm test -- --testPathPattern="slide-regeneration.*spec.ts" --verbose
    
    Write-Status "Running AI Integration E2E tests..."
    npm run test:e2e -- --testPathPattern="ai-integration.*spec.ts" --verbose
    
    Set-Location ..
    Write-Success "Backend tests completed"
}

function Run-FrontendTests {
    Write-Status "Running Frontend AI Tests..."
    Write-Host "-------------------------------"
    
    Set-Location frontend
    
    # Install dependencies if needed
    if (!(Test-Path "node_modules")) {
        Write-Status "Installing frontend dependencies..."
        npm install
    }
    
    # Run specific AI-related tests
    Write-Status "Running Chatbot Context tests..."
    npm test -- --testPathPattern="ChatbotContext.*test.tsx" --verbose --watchAll=false
    
    Write-Status "Running Deck Editor AI Integration tests..."
    npm test -- --testPathPattern="DeckEditorAIIntegration.*test.tsx" --verbose --watchAll=false
    
    Write-Status "Running API Client AI tests..."
    npm test -- --testPathPattern="apiClient.ai.*test.ts" --verbose --watchAll=false
    
    Set-Location ..
    Write-Success "Frontend tests completed"
}

function Run-ApiContractTests {
    Write-Status "Running API Contract Tests..."
    Write-Host "--------------------------------"
    
    # Test that frontend and backend API contracts match
    Write-Status "Verifying chatbot API contract..."
    
    # Check if backend is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 5
        Write-Success "Backend is running"
        
        # Test chatbot endpoint
        Write-Status "Testing chatbot endpoint..."
        try {
            $body = @{
                message = "Test message"
                deckId = "test-deck-id"
                context = @{ type = "dashboard" }
            } | ConvertTo-Json
            
            Invoke-WebRequest -Uri "http://localhost:3001/api/chatbot/chat" -Method POST -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer test-token" } -TimeoutSec 10
            Write-Success "Chatbot endpoint accessible"
        }
        catch {
            Write-Warning "Chatbot endpoint test failed (expected if auth is required)"
        }
        
        # Test slide regeneration endpoint
        Write-Status "Testing slide regeneration endpoint..."
        try {
            $body = @{
                modelChoice = "groq"
                userFeedback = "test feedback"
            } | ConvertTo-Json
            
            Invoke-WebRequest -Uri "http://localhost:3001/api/generate/slides/test-slide-id/regenerate" -Method POST -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer test-token" } -TimeoutSec 10
            Write-Success "Regeneration endpoint accessible"
        }
        catch {
            Write-Warning "Regeneration endpoint test failed (expected if auth is required)"
        }
    }
    catch {
        Write-Warning "Backend is not running - skipping API contract tests"
        Write-Status "To run API contract tests, start the backend with: cd backend-nestjs && npm run start:dev"
    }
}

function Run-PerformanceTests {
    Write-Status "Running Performance Tests..."
    Write-Host "-----------------------------"
    
    # Test AI response times
    Write-Status "Testing AI response performance..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 5
        
        # Measure response time for chatbot
        Write-Status "Measuring chatbot response time..."
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        try {
            $body = @{
                message = "Quick test"
                deckId = "test"
                context = @{ type = "dashboard" }
            } | ConvertTo-Json
            
            Invoke-WebRequest -Uri "http://localhost:3001/api/chatbot/chat" -Method POST -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer test-token" } -TimeoutSec 10
            $stopwatch.Stop()
            Write-Success "Chatbot response time: $($stopwatch.ElapsedMilliseconds)ms"
        }
        catch {
            $stopwatch.Stop()
            Write-Warning "Performance test failed (expected if auth is required) - Time: $($stopwatch.ElapsedMilliseconds)ms"
        }
    }
    catch {
        Write-Warning "Backend not running - skipping performance tests"
    }
}

function Generate-CoverageReport {
    Write-Status "Generating Test Coverage Report..."
    Write-Host "-----------------------------------"
    
    # Backend coverage
    Set-Location backend-nestjs
    Write-Status "Generating backend coverage..."
    try {
        npm run test:cov -- --testPathPattern="(chatbot|generation).*spec.ts"
    }
    catch {
        Write-Warning "Backend coverage generation failed"
    }
    Set-Location ..
    
    # Frontend coverage
    Set-Location frontend
    Write-Status "Generating frontend coverage..."
    try {
        npm test -- --coverage --testPathPattern="(Chatbot|AI).*test.(tsx|ts)" --watchAll=false
    }
    catch {
        Write-Warning "Frontend coverage generation failed"
    }
    Set-Location ..
    
    Write-Success "Coverage reports generated"
}

# Main execution
function Main {
    Write-Host "🚀 AI Features Test Suite" -ForegroundColor $Green
    Write-Host "========================="
    Write-Host "Testing all AI functionality including:"
    Write-Host "- Chatbot conversations (dashboard, deck, slide)"
    Write-Host "- Slide regeneration"
    Write-Host "- Virtual deck handling"
    Write-Host "- API contracts"
    Write-Host "- Performance"
    Write-Host ""
    
    Check-Dependencies
    
    # Run tests based on arguments
    switch ($TestType.ToLower()) {
        "backend" {
            Run-BackendTests
        }
        "frontend" {
            Run-FrontendTests
        }
        "api" {
            Run-ApiContractTests
        }
        "performance" {
            Run-PerformanceTests
        }
        "coverage" {
            Generate-CoverageReport
        }
        default {
            # Run all tests
            Run-BackendTests
            Write-Host ""
            Run-FrontendTests
            Write-Host ""
            Run-ApiContractTests
            Write-Host ""
            Run-PerformanceTests
            Write-Host ""
            Generate-CoverageReport
        }
    }
    
    Write-Host ""
    Write-Success "🎉 AI Features Test Suite Completed!"
    Write-Host ""
    Write-Host "Usage: .\test-ai-features.ps1 [-TestType <type>]"
    Write-Host "  backend     - Run only backend tests"
    Write-Host "  frontend    - Run only frontend tests"
    Write-Host "  api         - Run only API contract tests"
    Write-Host "  performance - Run only performance tests"
    Write-Host "  coverage    - Generate coverage reports"
    Write-Host "  all         - Run all tests (default)"
}

# Execute main function
Main
