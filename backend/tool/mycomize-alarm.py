#!/usr/bin/env python3

import subprocess
import time
import requests
import json
import logging
import os
import shutil
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Configuration
CONFIG_FILE = '../config/alarm-config.json'

def load_config():
    """Load configuration from alarm-config.json file."""
    try:
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"Configuration file {CONFIG_FILE} not found.")
        exit(1)
    except json.JSONDecodeError:
        logger.error(f"Error parsing {CONFIG_FILE}. Make sure it's valid JSON.")
        exit(1)

def send_telegram_message(bot_token, chat_id, message):
    """Send a message via Telegram bot."""

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    data = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown"
    }

    try:
        response = requests.post(url, data=data)
        response.raise_for_status()
        logger.info("Telegram message sent successfully")
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Error sending Telegram message: {e}")
        return False

def systemd_service_is_active(service_name):
    """Check if a systemd service is active."""
    try:
        result = subprocess.run(
            ['systemctl', 'is-active', service_name],
            capture_output=True,
            text=True,
            check=False
        )

        return result.stdout.strip() == 'active'
    except Exception as e:
        logger.error(f"Error checking service status: {e}")
        return False

def init_systemd_checks(bot_token, chat_id, systemd_services_list):
    systemd_state = {}

    for s in systemd_services_list:
        active = systemd_service_is_active(s)
        systemd_state[s] = active

        status = "active" if active else "inactive"
        send_telegram_message(
            bot_token,
            chat_id,
            f"🔔 *Telegram Alarm Started*\n"
            f"Monitoring systemd service: `{s}`\n"
            f"Current status: `{status}`\n"
            f"Time: `{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`"
        )

    return systemd_state

def check_systemd_services(bot_token, chat_id, systemd_state):
    for service, was_active in systemd_state.items():
        is_active = systemd_service_is_active(service)

        if was_active and not is_active:
            logger.warning(f"Service {service} has stopped!")
            send_telegram_message(
                bot_token,
                chat_id,
                f"🚨 *ALERT: Service Down*\n"
                f"The `{service}` service has *stopped*.\n"
                f"Time: `{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`"
            )

        if not was_active and is_active:
            logger.info(f"Service {service} has started!")
            send_telegram_message(
                bot_token,
                chat_id,
                f"✅ *Service Recovered*\n"
                f"The `{service}` service is now *running*.\n"
                f"Time: `{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`"
            )

        systemd_state[service] = is_active

    return systemd_state

def check_backend_log_with_pattern(bot_token, chat_id, backend_service, level, pattern):
    try:
        # Calculate timestamp for ~ 2 minutes ago
        two_min_ago = datetime.now().timestamp() - 125
        since_time = datetime.fromtimestamp(two_min_ago).strftime('%Y-%m-%d %H:%M:%S')

        # Run journalctl command with --since argument
        result = subprocess.run(
            [
                'sudo', 'journalctl', '-u', backend_service, '-o', 'cat',
                '--grep', pattern,
                '--since', since_time
             ],
            capture_output=True,
            text=True,
            check=False
        )

        if result.returncode != 0:
            logger.error(f"Error checking {backend_service} {level}: {result.stderr}")
            return

        output = result.stdout.strip()

        if output != '-- No entries --':
            if level == 'info':
                send_telegram_message(
                    bot_token,
                    chat_id,
                    f"✅ *INFO: mycomize backend info*\n"
                    f"```\n{output}\n```\n"
                    f"Time: `{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`"
                )
            else:
                send_telegram_message(
                    bot_token,
                    chat_id,
                    f"🚨 *ALERT: mycomize backend {level}*\n"
                    f"```\n{output}\n```\n"
                    f"Time: `{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`"
                )
    except Exception as e:
        logger.error(f"Error checking {backend_service} {level}: {e}")

def backup_databases(backup_dir, db_dir):
    """Backup all .db files in the specified directory."""
    if not backup_dir or not db_dir:
        logger.warning("Missing backup directory or database directory, skipping database backup")
        return
    
    try:
        # Create backup directory if it doesn't exist
        os.makedirs(backup_dir, exist_ok=True)
        
        if not os.path.exists(db_dir):
            logger.warning(f"Database directory {db_dir} does not exist, skipping backup")
            return
            
        db_files_backed_up = 0
        
        # Find all .db files in the directory
        for filename in os.listdir(db_dir):
            if filename.endswith('.db'):
                db_path = os.path.join(db_dir, filename)
                backup_path = os.path.join(backup_dir, f"{filename}.backup")
                
                # Using shutil for file copy - safer for binary files than subprocess
                shutil.copy2(db_path, backup_path)
                logger.info(f"Backed up {db_path} to {backup_path}")
                db_files_backed_up += 1
                
        if db_files_backed_up == 0:
            logger.warning(f"No .db files found in {db_dir}")
        else:
            logger.info(f"Backed up {db_files_backed_up} database files")
            
        return True
    except Exception as e:
        logger.error(f"Error backing up databases: {e}")
        return False

def main():
    """Main function to monitor service and send alerts."""
    config = load_config()
    bot_token = config.get('telegram_bot_token')
    chat_id = config.get('telegram_chat_id')
    check_interval = config.get('check_interval', 120)  # seconds
    systemd_services = config.get('systemd_services', [])
    backup_dir = config.get('backup_directory')
    db_dir = config.get('db_dir')
    
    if backup_dir and db_dir:
        logger.info(f"Database backups will be stored in: {backup_dir}")
        logger.info(f"Database directory to scan for .db files: {db_dir}")
    else:
        logger.warning("Missing backup configuration in config, database backups disabled")

    if not bot_token or not chat_id:
        logger.error("Telegram bot token or chat ID not configured.")
        exit(1)

    systemd_state = None
    if systemd_services:
        logger.info(f"Initializing systemd service monitoring for: {', '.join(systemd_services)}")
        systemd_state = init_systemd_checks(bot_token, chat_id, systemd_services)

    logger.info(f"Monitoring started with check interval of {check_interval} seconds")
    
    # Perform initial backup
    if backup_dir and db_dir:
        backup_databases(backup_dir, db_dir)
        
    # Track time for database backups (every 5 minutes)
    last_backup_time = time.time()
    backup_interval = 300  # 5 minutes in seconds

    while True:
        # Check systemd services if configured
        if systemd_state is not None:
            systemd_state = check_systemd_services(bot_token, chat_id, systemd_state)

        check_backend_log_with_pattern(bot_token, chat_id, 'mycomize-backend', 'error', "mycomize-backend:.* ERROR")
        check_backend_log_with_pattern(bot_token, chat_id, 'mycomize-backend', 'warning', "mycomize-backend:.* WARNING")
        check_backend_log_with_pattern(bot_token, chat_id, 'mycomize-backend', 'info', "INFO: invoice (stripe)")
        check_backend_log_with_pattern(bot_token, chat_id, 'mycomize-backend', 'info', "INFO: invoice (btcpay)")
        check_backend_log_with_pattern(bot_token, chat_id, 'mycomize-backend', 'info', "INFO: stripe webhook:")
        check_backend_log_with_pattern(bot_token, chat_id, 'mycomize-backend', 'info', "INFO: btcpay webhook:")
        check_backend_log_with_pattern(bot_token, chat_id, 'mycomize-backend', 'info', "INFO: fulfilling order")
        check_backend_log_with_pattern(bot_token, chat_id, 'mycomize-backend', 'info', "INFO: sent fulfillment email")
        
        # Check if it's time for a database backup
        current_time = time.time()
        if backup_dir and db_dir and (current_time - last_backup_time) >= backup_interval:
            logger.info("Performing scheduled database backup")
            backup_databases(backup_dir, db_dir)
            last_backup_time = current_time

        # Sleep for the specified interval
        time.sleep(check_interval)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Monitoring stopped by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
