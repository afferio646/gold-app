from playwright.sync_api import sync_playwright
import os

def verify_visuals():
    cwd = os.getcwd()
    filepath = f"file://{cwd}/facility.html"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        print(f"Checking {filepath}...")
        page.goto(filepath)

        # 1. Fill Settings
        page.evaluate("""
            localStorage.setItem('goldmorr_settings', JSON.stringify({
                name: 'Test', company: 'Test', email: 'test@example.com'
            }));
        """)
        page.reload()

        # 2. Run Calculation
        page.select_option('#f-mold-growth', '2')
        page.click('text=Fungal Risk Assessment')

        # 3. Screenshot Result Card
        page.screenshot(path="verification/facility_result_card.png")
        print("Captured Result Card: verification/facility_result_card.png")

        # 4. Open Modal
        page.click('text=View Full Project Report')

        # 5. Screenshot Modal
        page.screenshot(path="verification/facility_report_modal.png")
        print("Captured Report Modal: verification/facility_report_modal.png")

        browser.close()

if __name__ == "__main__":
    verify_visuals()
