#!/bin/bash
# Deployment script to ensure production server gets updated

echo "Deploying Schedule v3 Server..."
echo "Version: 2.1.0"
echo "Timestamp: $(date)"

# Add any deployment commands here
# This file forces git to recognize changes

echo "Deployment marker: $(date)" >> deployment.log