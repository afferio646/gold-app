from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Navigate to Dashboard
    print("Navigating to dashboard...")
    page.goto("http://localhost:8000/dashboard.html")

    # Wait for the Lead Archive section to be visible
    # Using a broader selector or text match to be safe
    print("Waiting for dashboard to load...")
    try:
        expect(page.get_by_text("Lead Archive", exact=False)).to_be_visible(timeout=10000)
    except Exception as e:
        print(f"Error waiting for Lead Archive text: {e}")
        # Take a debug screenshot
        page.screenshot(path="verification/debug_error.png")
        raise e

    # Verify Admin Buttons exist
    print("Verifying Admin Buttons...")
    export_btn = page.get_by_role("button", name="Export CSV")
    reset_btn = page.get_by_role("button", name="System Reset")

    expect(export_btn).to_be_visible()
    expect(reset_btn).to_be_visible()

    # Scroll to the Lead Archive section to ensure it's in view for the screenshot
    page.get_by_text("Lead Archive", exact=False).scroll_into_view_if_needed()

    # Take a screenshot of the Admin Tools area
    print("Taking screenshot...")
    page.screenshot(path="verification/dashboard_admin_tools.png")

    browser.close()
    print("Verification complete.")

with sync_playwright() as playwright:
    run(playwright)
