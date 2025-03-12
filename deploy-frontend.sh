#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Navigate to the frontend directory
cd frontend

# Run the build command
echo "Building the application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful!"
    
    # Create destination directory if it doesn't exist
    sudo mkdir -p /var/www/mycomize/
    
    # Copy the dist folder contents to the destination
    echo "Copying files to /var/www/mycomize/..."
    sudo cp -r dist/* /var/www/mycomize/
    
    # Check if copy was successful
    if [ $? -eq 0 ]; then
        echo "Deployment completed successfully!"
    else
        echo "Error: Failed to copy files to /var/www/mycomize/"
        exit 1
    fi
else
    echo "Error: Build failed!"
    exit 1
fi

echo "Deployment process completed!"
