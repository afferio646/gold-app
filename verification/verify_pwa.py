import os
from playwright.sync_api import sync_playwright

def verify_pwa_tags(page, filename):
    cwd = os.getcwd()
    filepath = f"file://{cwd}/{filename}"
    print(f"Checking {filepath}...")

    page.goto(filepath)

    # 1. Check Manifest
    manifest = page.locator('link[rel="manifest"]')
    if manifest.count() > 0:
        print(f"PASS: {filename} has manifest link.")
    else:
        print(f"FAIL: {filename} missing manifest link.")

    # 2. Check Theme Color
    theme = page.locator('meta[name="theme-color"]')
    if theme.count() > 0:
        print(f"PASS: {filename} has theme-color.")
    else:
        print(f"FAIL: {filename} missing theme-color.")

    # 3. Check Apple Icon
    apple = page.locator('link[rel="apple-touch-icon"]')
    if apple.count() > 0:
        print(f"PASS: {filename} has apple-touch-icon.")
    else:
        print(f"FAIL: {filename} missing apple-touch-icon.")

    # 4. Check Service Worker Script
    # We can check page content for the registration string
    content = page.content()
    if "navigator.serviceWorker.register" in content:
        print(f"PASS: {filename} has Service Worker registration logic.")
    else:
        print(f"FAIL: {filename} missing SW registration logic.")

    # Screenshot
    page.screenshot(path=f"verification/screenshot_{filename}.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        files = ["index.html", "member.html", "facility.html", "dashboard.html"]
        for f in files:
            verify_pwa_tags(page, f)

        browser.close()

if __name__ == "__main__":
    main()
