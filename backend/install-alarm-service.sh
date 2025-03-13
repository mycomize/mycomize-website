#!/bin/bash

# Help function
function show_help {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -u, --usr USER         User to run the service (REQUIRED)"
    echo "  -w, --working-dir DIR  Working directory for the service (REQUIRED)"
    echo "  -b, --bin_path PATH         Path to alarm script (REQUIRED)"
    echo "  -h, --help             Show this help message"
    exit 1
}

# Initialize variables
usr=""
working_dir=""
bin_path=""

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
        -b|--bin-path)
            bin_path="$2"
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

if [ -z "$bin_path" ]; then
    echo "Error: Alarm script bin path (-b, --bin-path) is required"
    show_help
fi

echo "Installing Mycomize Alarm Service with the following settings:"
echo "  User: $usr"
echo "  Working Directory: $working_dir"
echo "  Alarm Binary Path: $bin_path"
echo ""

pip3 install requests

# Create a temporary service file with replacements
echo "Creating service file with custom settings..."
TMP_SERVICE_FILE=$(mktemp)
sed -e "s|MYCOMIZE_USR|$usr|g" \
    -e "s|ALARM_WORKDIR|$working_dir|g" \
    -e "s|ALARM_PATH|$bin_path|g" \
    mycomize-alarm.service > $TMP_SERVICE_FILE

# Copy service file to systemd directory
echo "Installing systemd service (requires sudo)..."
sudo cp $TMP_SERVICE_FILE /etc/systemd/system/mycomize-alarm.service
rm $TMP_SERVICE_FILE

# Reload systemd
sudo systemctl daemon-reload

# Enable and start the service
echo "Enabling and starting the service..."
sudo systemctl enable mycomize-alarm.service
sudo systemctl start mycomize-alarm.service

# Check service status
echo "Service status:"
sudo systemctl status mycomize-alarm.service

echo ""
echo "✅ Installation complete!"
