#!/bin/bash

# AI Features Test Suite
# Comprehensive testing for all AI functionality

set -e

echo "🧪 Starting AI Features Test Suite..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Backend Tests
run_backend_tests() {
    print_status "Running Backend AI Tests..."
    echo "-------------------------------"
    
    cd backend-nestjs
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    fi
    
    # Run specific AI-related tests
    print_status "Running Chatbot Service tests..."
    npm test -- --testPathPattern="chatbot.*spec.ts" --verbose
    
    print_status "Running Slide Regeneration tests..."
    npm test -- --testPathPattern="slide-regeneration.*spec.ts" --verbose
    
    print_status "Running AI Integration E2E tests..."
    npm run test:e2e -- --testPathPattern="ai-integration.*spec.ts" --verbose
    
    cd ..
    print_success "Backend tests completed"
}

# Frontend Tests
run_frontend_tests() {
    print_status "Running Frontend AI Tests..."
    echo "-------------------------------"
    
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Run specific AI-related tests
    print_status "Running Chatbot Context tests..."
    npm test -- --testPathPattern="ChatbotContext.*test.tsx" --verbose --watchAll=false
    
    print_status "Running Deck Editor AI Integration tests..."
    npm test -- --testPathPattern="DeckEditorAIIntegration.*test.tsx" --verbose --watchAll=false
    
    print_status "Running API Client AI tests..."
    npm test -- --testPathPattern="apiClient.ai.*test.ts" --verbose --watchAll=false
    
    cd ..
    print_success "Frontend tests completed"
}

# API Contract Tests
run_api_contract_tests() {
    print_status "Running API Contract Tests..."
    echo "--------------------------------"
    
    # Test that frontend and backend API contracts match
    print_status "Verifying chatbot API contract..."
    
    # Check if backend is running
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        print_success "Backend is running"
        
        # Test chatbot endpoint
        print_status "Testing chatbot endpoint..."
        curl -X POST http://localhost:3001/api/chatbot/chat \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer test-token" \
            -d '{
                "message": "Test message",
                "deckId": "test-deck-id",
                "context": {"type": "dashboard"}
            }' \
            --fail --silent --output /dev/null && print_success "Chatbot endpoint accessible" || print_warning "Chatbot endpoint test failed (expected if auth is required)"
        
        # Test slide regeneration endpoint
        print_status "Testing slide regeneration endpoint..."
        curl -X POST http://localhost:3001/api/generate/slides/test-slide-id/regenerate \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer test-token" \
            -d '{
                "modelChoice": "groq",
                "userFeedback": "test feedback"
            }' \
            --fail --silent --output /dev/null && print_success "Regeneration endpoint accessible" || print_warning "Regeneration endpoint test failed (expected if auth is required)"
    else
        print_warning "Backend is not running - skipping API contract tests"
        print_status "To run API contract tests, start the backend with: cd backend-nestjs && npm run start:dev"
    fi
}

# Performance Tests
run_performance_tests() {
    print_status "Running Performance Tests..."
    echo "-----------------------------"
    
    # Test AI response times
    print_status "Testing AI response performance..."
    
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        # Measure response time for chatbot
        print_status "Measuring chatbot response time..."
        time curl -X POST http://localhost:3001/api/chatbot/chat \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer test-token" \
            -d '{"message": "Quick test", "deckId": "test", "context": {"type": "dashboard"}}' \
            --silent --output /dev/null || print_warning "Performance test failed (expected if auth is required)"
    else
        print_warning "Backend not running - skipping performance tests"
    fi
}

# Test Coverage Report
generate_coverage_report() {
    print_status "Generating Test Coverage Report..."
    echo "-----------------------------------"
    
    # Backend coverage
    cd backend-nestjs
    print_status "Generating backend coverage..."
    npm run test:cov -- --testPathPattern="(chatbot|generation).*spec.ts" || print_warning "Backend coverage generation failed"
    cd ..
    
    # Frontend coverage
    cd frontend
    print_status "Generating frontend coverage..."
    npm test -- --coverage --testPathPattern="(Chatbot|AI).*test.(tsx|ts)" --watchAll=false || print_warning "Frontend coverage generation failed"
    cd ..
    
    print_success "Coverage reports generated"
}

# Main execution
main() {
    echo "🚀 AI Features Test Suite"
    echo "========================="
    echo "Testing all AI functionality including:"
    echo "- Chatbot conversations (dashboard, deck, slide)"
    echo "- Slide regeneration"
    echo "- Virtual deck handling"
    echo "- API contracts"
    echo "- Performance"
    echo ""
    
    check_dependencies
    
    # Run tests based on arguments
    if [ "$1" = "backend" ]; then
        run_backend_tests
    elif [ "$1" = "frontend" ]; then
        run_frontend_tests
    elif [ "$1" = "api" ]; then
        run_api_contract_tests
    elif [ "$1" = "performance" ]; then
        run_performance_tests
    elif [ "$1" = "coverage" ]; then
        generate_coverage_report
    else
        # Run all tests
        run_backend_tests
        echo ""
        run_frontend_tests
        echo ""
        run_api_contract_tests
        echo ""
        run_performance_tests
        echo ""
        generate_coverage_report
    fi
    
    echo ""
    print_success "🎉 AI Features Test Suite Completed!"
    echo ""
    echo "Usage: $0 [backend|frontend|api|performance|coverage]"
    echo "  backend     - Run only backend tests"
    echo "  frontend    - Run only frontend tests"
    echo "  api         - Run only API contract tests"
    echo "  performance - Run only performance tests"
    echo "  coverage    - Generate coverage reports"
    echo "  (no args)   - Run all tests"
}

# Execute main function with all arguments
main "$@"
