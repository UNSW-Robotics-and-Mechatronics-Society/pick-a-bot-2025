import sys
import time
from datetime import datetime, timedelta

import requests


def parse_args():
    port = "8787"
    interval = 10
    for i, arg in enumerate(sys.argv):
        if arg == "--port" and i + 1 < len(sys.argv):
            port = sys.argv[i + 1]
        if arg == "--interval" and i + 1 < len(sys.argv):
            interval = sys.argv[i + 1]
    if not str(interval).isdigit():
        print(f"Invalid interval: {interval}. Must be a number.")
        sys.exit(1)
    return port, int(interval)

PORT, TIME_INTERVAL = parse_args()
URL = f"http://localhost:{PORT}/__scheduled?cron=*+*+*+*+*"

def log(level, message):
    print(f"{datetime.now().strftime('%H:%M:%S')} [{level.upper():5}] {message}")

def job():
    log("info", f"Fetching scheduled endpoint: {URL}")
    try:
        res = requests.get(URL, headers={"Connection": "close"})
        if not res.ok:
            raise Exception(f"Fetch failed with status {res.status_code}: {res.text}")
        log("info", "Job completed")
    except Exception as e:
        log("error", f"Job failed, stopping scheduler.\n  ↳ Error: {e}")
        sys.exit(1)

def run_interval():
    log("info", f"Starting cron job every {TIME_INTERVAL} seconds")
    while True:
        log("info", "Running scheduled job...")
        job()
        next_run = datetime.now() + timedelta(seconds=TIME_INTERVAL)
        log("info", f"Next run at {next_run.strftime('%H:%M:%S')}")
        time.sleep(TIME_INTERVAL)

if __name__ == "__main__":
    run_interval()
