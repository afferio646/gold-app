from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Navigate to Dashboard
    print("Navigating to dashboard...")
    page.goto("http://localhost:8000/dashboard.html")

    # Verify Dashboard Title Updated
    print("Verifying Dashboard Title...")
    expect(page.get_by_role("heading", name="Goldmorr Client Dashboard v2.0 LIVE")).to_be_visible()

    # Wait for the Lead Archive section to be visible
    print("Waiting for dashboard to load...")
    try:
        expect(page.get_by_text("Lead Archive", exact=False)).to_be_visible(timeout=10000)
    except Exception as e:
        print(f"Error waiting for Lead Archive text: {e}")
        page.screenshot(path="verification/debug_error.png")
        raise e

    # Verify Admin Buttons exist
    print("Verifying Admin Buttons...")
    export_btn = page.get_by_role("button", name="Export CSV")
    reset_btn = page.get_by_role("button", name="System Reset")

    expect(export_btn).to_be_visible()
    expect(reset_btn).to_be_visible()

    # Take a screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/dashboard_v2_live.png")

    browser.close()
    print("Verification complete.")

with sync_playwright() as playwright:
    run(playwright)
