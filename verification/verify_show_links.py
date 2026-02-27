from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Navigate to Show Links Page
    print("Navigating to show_links.html...")
    page.goto("http://localhost:8000/show_links.html")

    # Verify Content
    print("Verifying content...")
    expect(page.get_by_text("Show Access Portal")).to_be_visible()

    # Use exact match or specific locator to avoid strict mode violation
    expect(page.get_by_role("heading", name="Admin Hub")).to_be_visible()

    # Verify Links
    print("Verifying links...")
    # Check if the button with text "Open Admin Hub" has correct href
    hub_link = page.get_by_role("link", name="Open Admin Hub")
    expect(hub_link).to_have_attribute("href", "admin.html")

    # Take a screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/show_links_card.png")

    browser.close()
    print("Verification complete.")

with sync_playwright() as playwright:
    run(playwright)
