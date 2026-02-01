#!/bin/bash
# Startup script to install Playwright browsers for PDF generation
# This script is run during deployment to ensure Playwright is ready

echo "Installing Playwright browsers..."

# Install Playwright Chromium browser
python -m playwright install chromium 2>/dev/null || playwright install chromium 2>/dev/null

echo "Playwright browser installation complete."
