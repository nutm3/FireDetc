#!/bin/bash

# FireDetc Build & Management Script
# Created by Falatehan Anshor

DEFAULT_PORT=9115
PORT=$DEFAULT_PORT

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_banner() {
    clear
    echo -e "${CYAN}"
    echo "  ███████╗██╗██████╗ ███████╗██████╗ ███████╗████████╗ ██████╗"
    echo "  ██╔════╝██║██╔══██╗██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝"
    echo "  █████╗  ██║██████╔╝█████╗  ██║  ██║█████╗     ██║   ██║     "
    echo "  ██╔══╝  ██║██╔══██╗██╔══╝  ██║  ██║██╔══╝     ██║   ██║     "
    echo "  ██║     ██║██║  ██║███████╗██████╔╝███████╗    ██║   ╚██████╗"
    echo "  ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═════╝ ╚══════╝    ╚═╝    ╚═════╝"
    echo -e "  Firewall Detector Command Center | Created by Falatehan Anshor"
    echo -e "  Link: https://github.com/nutm3"
    echo -e "${NC}"
}

check_dependencies() {
    echo -e "${BLUE}[*] Checking dependencies...${NC}"
    for cmd in node npm powershell.exe; do
        if ! command -v $cmd &> /dev/null; then
            echo -e "${RED}[!] Missing: $cmd${NC}"
            exit 1
        fi
    done
    echo -e "${GREEN}[+] Dependencies satisfied.${NC}"
}

handle_port() {
    IS_BUSY=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
    
    if [ ! -z "$IS_BUSY" ]; then
        PID=$IS_BUSY
        PROC_NAME=$(ps -p $PID -o comm=)
        echo -e "${YELLOW}[!] Alert: Port $PORT is occupied by: $PROC_NAME (PID: $PID)${NC}"
        echo -en "${CYAN}[?] Choice: (k)ill, (n)ew port, (e)xit: ${NC}"
        read -r opt
        case $opt in
            k|K)
                echo -e "${BLUE}[*] Killing PID $PID...${NC}"
                kill -9 $PID
                sleep 1
                ;;
            n|N)
                echo -en "${CYAN}[?] Enter new port: ${NC}"
                read -r NEW_PORT
                PORT=$NEW_PORT
                ;;
            *)
                echo -e "${RED}[!] Aborted.${NC}"
                exit 0
                ;;
        esac
    fi
}

install() {
    echo -e "${BLUE}[*] Installing Node dependencies...${NC}"
    cd src && npm install && cd ..
    echo -e "${GREEN}[+] Installed.${NC}"
}

run_prod() {
    handle_port
    echo -e "${BLUE}[*] Starting Production Server...${NC}"
    cd src && PORT=$PORT node app.js
}

run_dev() {
    handle_port
    echo -e "${BLUE}[*] Starting Dev Server with npx nodemon...${NC}"
    cd src && PORT=$PORT npx nodemon app.js
}

clean_env() {
    echo -en "${RED}[!] Are you sure you want to remove node_modules and lock files? (y/n): ${NC}"
    read -r confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        echo -e "${BLUE}[*] Cleaning dependencies...${NC}"
        rm -rf src/node_modules src/package-lock.json
        echo -e "${GREEN}[+] Environment cleaned.${NC}"
    else
        echo -e "${YELLOW}[*] Action aborted.${NC}"
    fi
}

# Main Logic
while true; do
    show_banner
    check_dependencies
    echo -e "\n${CYAN}--- FireDetc Local Management ---${NC}"
    echo "1. Install Dependencies"
    echo "2. Start Production Server"
    echo "3. Start Development Server (Nodemon)"
    echo "4. Clean Environment"
    echo "5. Exit"
    echo -en "${CYAN}Choice: ${NC}"
    read -r choice

    case $choice in
        1) install ;;
        2) run_prod ;;
        3) run_dev ;;
        4) clean_env ;;
        5) exit 0 ;;
        *) echo -e "${RED}[!] Invalid option.${NC}" ;;
    esac
done
