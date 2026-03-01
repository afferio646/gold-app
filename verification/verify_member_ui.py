from playwright.sync_api import sync_playwright
import time

def verify_ui(page):
    # Set mobile viewport
    page.set_viewport_size({"width": 390, "height": 844})

    # Go to member page locally
    page.goto("http://localhost:8000/member.html")

    # Wait for page to load and mock user settings to bypass modal
    page.evaluate("""
        localStorage.setItem('gm_user', JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            company: 'Test Co',
            phone: '555-0100',
            certId: 'GM-1234',
            region: 'US'
        }));
    """)
    page.reload()

    # Just to make absolutely sure the settings modal is hidden
    page.evaluate("document.getElementById('settings-modal').classList.add('hidden')")

    # Wait for the main UI to be visible
    page.wait_for_selector('#quantifier-view', state='visible')

    # Scroll to the top tabs to see them
    page.evaluate("window.scrollTo(0, 0)")
    time.sleep(1) # wait for render
    page.screenshot(path="verification/mobile_top_tabs.png")

    # Change bid amount to test wrapping
    page.evaluate("document.getElementById('p-bid').innerText = '$1,234,567.89'")

    # Scroll to the bottom of the Quantifier view to see the "Next: Profit Guard" button
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(1) # wait for render
    page.screenshot(path="verification/mobile_bottom_quantifier.png")

    # Click the "Next: Profit Guard" button using JS to avoid interception issues
    page.evaluate("document.querySelector('button[onclick=\"switchTab(\\'profit\\')\"]').click()")

    # Wait for Profit view to be visible
    page.wait_for_selector('#profit-view', state='visible')

    # Scroll to the bottom to see the "Start New Project" button
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(1) # wait for render
    page.screenshot(path="verification/mobile_bottom_profit.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_ui(page)
        finally:
            browser.close()
