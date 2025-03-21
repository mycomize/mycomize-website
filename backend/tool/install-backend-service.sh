#!/bin/bash

# Help function
function show_help {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -u, --usr USER         User to run the service (REQUIRED)"
    echo "  -w, --working-dir DIR  Working directory for the service (REQUIRED)"
    echo "  -v, --venv-bin PATH    Path to the virtual environment bin directory (REQUIRED)"
    echo "  -h, --help             Show this help message"
    exit 1
}

# Initialize variables
usr=""
working_dir=""
venv_bin_path=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--usr)
            usr="$2"
            shift 2
            ;;
        -w|--working-dir)
            working_dir="$2"
            shift 2
            ;;
        -v|--venv-bin)
            venv_bin_path="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            ;;
    esac
done

# Check if required parameters are provided
if [ -z "$usr" ]; then
    echo "Error: User (-u, --usr) is required"
    show_help
fi

if [ -z "$working_dir" ]; then
    echo "Error: Working directory (-w, --working-dir) is required"
    show_help
fi

if [ -z "$venv_bin_path" ]; then
    echo "Error: Virtual environment bin path (-v, --venv-bin) is required"
    show_help
fi

# Calculate derived values
fastapi_path="$venv_bin_path/fastapi"

echo "Installing Mycomize Backend Service with the following settings:"
echo "  User: $usr"
echo "  Group: $usr"
echo "  Working Directory: $working_dir"
echo "  Virtual Environment Binary Path: $venv_bin_path"
echo ""

# Create a temporary service file with replacements
echo "Creating service file with custom settings..."
TMP_SERVICE_FILE=$(mktemp)
sed -e "s|MYCOMIZE_USR|$usr|g" \
    -e "s|MYCOMIZE_GRP|$usr|g" \
    -e "s|MYCOMIZE_WORKING_DIR|$working_dir|g" \
    -e "s|MYCOMIZE_VENV_BIN_PATH|$venv_bin_path|g" \
    -e "s|MYCOMIZE_VENV_BIN_FASTAPI|$fastapi_path|g" \
    mycomize-backend.service > $TMP_SERVICE_FILE

# Copy service file to systemd directory
echo "Installing systemd service (requires sudo)..."
sudo cp $TMP_SERVICE_FILE /etc/systemd/system/mycomize-backend.service
rm $TMP_SERVICE_FILE

# Reload systemd
sudo systemctl daemon-reload

# Enable and start the service
echo "Enabling and starting the service..."
sudo systemctl enable mycomize-backend.service
sudo systemctl start mycomize-backend.service

# Check service status
echo "Service status:"
sudo systemctl status mycomize-backend.service

echo ""
echo "✅ Installation complete!"
