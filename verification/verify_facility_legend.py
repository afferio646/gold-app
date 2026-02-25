from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 2000})
        page = context.new_page()

        # Load the facility.html file
        cwd = os.getcwd()
        page.goto(f'file://{cwd}/facility.html')

        # Handle Settings Modal if it appears (Fresh run simulation)
        try:
            # Wait briefly to see if modal appears
            page.wait_for_selector('#settings-modal', state='visible', timeout=2000)
            print("Settings modal detected. Filling details...")
            page.fill('#set-name', 'Verifier')
            page.fill('#set-company', 'Test Corp')
            page.fill('#set-email', 'test@example.com')
            page.click('button[onclick="saveUserSettings()"]')
            # Wait for modal to disappear
            page.wait_for_selector('#settings-modal', state='hidden')
            print("Settings modal closed.")
        except:
            print("Settings modal not detected or already closed.")

        # Fill in data to enable/populate the report
        page.fill('#p-name', 'Test Project Legend Verification')
        page.select_option('#f-type', 'Commercial Office')
        page.select_option('#f-source', 'Surface Water')
        page.select_option('#f-mold-growth', '2') # Moderate
        page.select_option('#f-hvac-risk', '2') # Yes

        # Trigger inputs
        page.evaluate("document.getElementById('p-name').dispatchEvent(new Event('input'))")

        # Click "Fungal Risk Assessment" button
        page.click('button[onclick="runAuditProcess()"]')

        # Wait for the results
        page.wait_for_selector('#f-res:not(.hidden)', state='visible')

        # Click "View Full Project Report" button
        page.click('button[onclick="openReportModal()"]')

        # Wait for the modal
        page.wait_for_selector('#report-modal', state='visible')

        # Wait for render
        page.wait_for_timeout(1000)

        # Locate the report content
        modal_content = page.locator('#modal-content')

        # Scroll to the bottom to ensure the legend is visible
        page.evaluate("document.querySelector('#modal-content').lastElementChild.scrollIntoView()")

        page.wait_for_timeout(500)

        # Take a screenshot
        page.locator('#report-modal > div').screenshot(path='verification/facility_report_modal_legend.png')
        print("Screenshot saved to verification/facility_report_modal_legend.png")

        browser.close()

if __name__ == '__main__':
    run()
