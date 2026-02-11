import os
from playwright.sync_api import sync_playwright

def verify_pwa_logic(page, filename):
    cwd = os.getcwd()
    filepath = f"file://{cwd}/{filename}"
    print(f"Checking {filepath}...")

    page.goto(filepath)

    # 1. Check for pwa.js inclusion
    pwa_script = page.locator('script[src="assets/pwa.js"]')
    if pwa_script.count() > 0:
        print(f"PASS: {filename} includes assets/pwa.js")
    else:
        print(f"FAIL: {filename} missing assets/pwa.js")

    # 2. Check for Notification API usage in pwa.js
    # We can't easily check internal logic of external script via static analysis of the HTML,
    # but we can check if the file exists and has content.
    if os.path.exists("assets/pwa.js"):
        with open("assets/pwa.js", "r") as f:
            content = f.read()
            if "Notification.requestPermission" in content:
                 print(f"PASS: assets/pwa.js contains permission request logic.")
            else:
                 print(f"FAIL: assets/pwa.js missing permission logic.")
    else:
        print(f"FAIL: assets/pwa.js file not found.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Only checking the main app pages where we added pwa.js
        files = ["member.html", "facility.html", "dashboard.html"]
        for f in files:
            verify_pwa_logic(page, f)

        browser.close()

if __name__ == "__main__":
    main()
