#!/bin/bash
# Abdaa Academy - Full Platform Launcher (English)
# Usage: ./start-en.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "  ============================================================"
echo "                                                              "
echo "            IBRAR ACADEMY - Full Platform Launcher            "
echo "            One-click setup & run                             "
echo "                                                              "
echo "  ============================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "  ${RED}[ERROR] Node.js is not installed.${NC}"
    echo -e "  Download from: https://nodejs.org"
    echo ""
    exit 1
fi

# Check Bun
USE_BUN=0
if command -v bun &> /dev/null; then
    echo -e "  ${GREEN}[OK] Bun detected - will use it for faster performance${NC}"
    USE_BUN=1
else
    echo -e "  ${YELLOW}[WARN] Bun not installed - will use npm${NC}"
fi
echo ""

# Check .env
if [ ! -f ".env" ]; then
    echo -e "  ${CYAN}[INFO] Creating .env from template...${NC}"
    cp .env.example .env
    echo -e "  ${GREEN}[OK] .env created - edit values before production${NC}"
    echo ""
fi

# Step 1: Install
echo -e "  ${BLUE}============================================================${NC}"
echo -e "  ${YELLOW}[1/5] Installing dependencies...${NC}"
echo -e "  ${BLUE}============================================================${NC}"
if [ "$USE_BUN" -eq 1 ]; then
    bun install
else
    npm install
fi
echo -e "  ${GREEN}[OK] Dependencies installed${NC}"
echo ""

# Step 2: Prisma generate
echo -e "  ${BLUE}============================================================${NC}"
echo -e "  ${YELLOW}[2/5] Generating Prisma Client...${NC}"
echo -e "  ${BLUE}============================================================${NC}"
if [ "$USE_BUN" -eq 1 ]; then
    bun run db:generate
else
    npx prisma generate
fi
echo -e "  ${GREEN}[OK] Prisma Client generated${NC}"
echo ""

# Step 3: Database
echo -e "  ${BLUE}============================================================${NC}"
echo -e "  ${YELLOW}[3/5] Creating database...${NC}"
echo -e "  ${BLUE}============================================================${NC}"
if [ "$USE_BUN" -eq 1 ]; then
    bun run db:push
else
    npx prisma db push --accept-data-loss
fi
echo -e "  ${GREEN}[OK] Database created${NC}"
echo ""

# Step 4: Seed
echo -e "  ${BLUE}============================================================${NC}"
echo -e "  ${YELLOW}[4/5] Seeding initial data...${NC}"
echo -e "  ${BLUE}============================================================${NC}"
if [ "$USE_BUN" -eq 1 ]; then
    bun run prisma/seed.ts
    bun run prisma/seed-payments.ts
    bun run prisma/seed-gamification.ts
else
    npx tsx prisma/seed.ts
    npx tsx prisma/seed-payments.ts
    npx tsx prisma/seed-gamification.ts
fi
echo -e "  ${GREEN}[OK] Data seeded${NC}"
echo ""

# Step 5: Start servers
echo -e "  ${BLUE}============================================================${NC}"
echo -e "  ${YELLOW}[5/5] Starting servers...${NC}"
echo -e "  ${BLUE}============================================================${NC}"
echo ""

echo -e "  ${CYAN}Starting classroom service (port 3003)...${NC}"
cd mini-services/classroom-service
if [ "$USE_BUN" -eq 1 ]; then
    bun install 2>/dev/null || true
    bun run dev &
    CLASSROOM_PID=$!
else
    npm install 2>/dev/null || true
    npm run dev &
    CLASSROOM_PID=$!
fi
cd ../..

echo -e "  ${CYAN}Waiting 3 seconds...${NC}"
sleep 3

echo ""
echo -e "  ${GREEN}============================================================${NC}"
echo -e "  ${GREEN}                                                            ${NC}"
echo -e "  ${GREEN}  SUCCESS! Platform is running!                              ${NC}"
echo -e "  ${GREEN}                                                            ${NC}"
echo -e "  ${GREEN}  Open browser: http://localhost:3000                        ${NC}"
echo -e "  ${GREEN}                                                            ${NC}"
echo -e "  ${GREEN}  Demo accounts:                                             ${NC}"
echo -e "  ${GREEN}    Admin:    01000000001                                    ${NC}"
echo -e "  ${GREEN}    Teacher:  01000000010                                    ${NC}"
echo -e "  ${GREEN}    Parent:   01012345678                                    ${NC}"
echo -e "  ${GREEN}                                                            ${NC}"
echo -e "  ${GREEN}  OTP code shows in yellow box on the page                   ${NC}"
echo -e "  ${GREEN}                                                            ${NC}"
echo -e "  ${GREEN}  Press Ctrl+C to stop                                       ${NC}"
echo -e "  ${GREEN}                                                            ${NC}"
echo -e "  ${GREEN}============================================================${NC}"
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo -e "  ${RED}Stopping servers...${NC}"
    kill $CLASSROOM_PID 2>/dev/null || true
    echo -e "  ${GREEN}Stopped.${NC}"
    exit 0
}
trap cleanup INT TERM

# Start main platform
if [ "$USE_BUN" -eq 1 ]; then
    bun run dev
else
    npm run dev
fi
