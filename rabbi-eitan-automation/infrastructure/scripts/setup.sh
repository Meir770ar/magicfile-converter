#!/bin/bash

# Rabbi Eitan - Setup Script
# Automated setup for the Tanya Automation System

set -e

echo "========================================"
echo "  Rabbi Eitan - Setup Script"
echo "  Tanya Automation System"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: Please run this script from the rabbi-eitan-automation directory${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

if ! command_exists docker-compose; then
    # Try docker compose (v2)
    if ! docker compose version >/dev/null 2>&1; then
        echo -e "${RED}Docker Compose is not installed. Please install Docker Compose.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Create .env file if it doesn't exist
echo -e "\n${YELLOW}Setting up environment...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file from template${NC}"
        echo -e "${YELLOW}  Please edit .env and add your API keys${NC}"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Create necessary directories
echo -e "\n${YELLOW}Creating directories...${NC}"

mkdir -p backend/media/{audio,video,temp,final,assets}
mkdir -p frontend/public
mkdir -p infrastructure/logs

echo -e "${GREEN}✓ Media directories created${NC}"

# Build Docker images
echo -e "\n${YELLOW}Building Docker images...${NC}"

docker-compose build --no-cache

echo -e "${GREEN}✓ Docker images built${NC}"

# Start services
echo -e "\n${YELLOW}Starting services...${NC}"

docker-compose up -d

echo -e "${GREEN}✓ Services started${NC}"

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"

sleep 10

# Check service status
echo -e "\n${YELLOW}Checking service status...${NC}"

docker-compose ps

# Display access information
echo -e "\n========================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "========================================"
echo -e "\n${YELLOW}Access Points:${NC}"
echo -e "  Dashboard:     http://localhost:3000"
echo -e "  API Docs:      http://localhost:8000/api/docs"
echo -e "  API Health:    http://localhost:8000/health"
echo -e "  Flower:        http://localhost:5555"
echo -e ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Edit .env file with your API keys:"
echo -e "     - GEMINI_API_KEY"
echo -e "     - ELEVENLABS_API_KEY"
echo -e "     - HEYGEN_API_KEY"
echo -e "     - TELEGRAM_BOT_TOKEN"
echo -e "     - OPENAI_API_KEY (for Whisper)"
echo -e ""
echo -e "  2. Restart services after updating .env:"
echo -e "     docker-compose restart"
echo -e ""
echo -e "  3. View logs:"
echo -e "     docker-compose logs -f"
echo -e ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  Stop:          docker-compose down"
echo -e "  Restart:       docker-compose restart"
echo -e "  Logs:          docker-compose logs -f [service]"
echo -e "  Shell:         docker-compose exec backend bash"
echo -e "========================================"
