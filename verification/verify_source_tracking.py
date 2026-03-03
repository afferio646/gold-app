from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800}) # Normal viewport
        page = context.new_page()

        # Load the facility.html file WITH SOURCE PARAMETER
        cwd = os.getcwd()
        page.goto(f'file://{cwd}/facility.html?source=Randy')

        # Handle Settings Modal if it appears
        try:
            page.wait_for_selector('#settings-modal', state='visible', timeout=2000)
            print("Settings modal detected. Filling details...")
            page.fill('#set-name', 'Verifier')
            page.fill('#set-company', 'Test Corp')
            page.fill('#set-email', 'test@example.com')
            page.evaluate("API.saveSettings({name: 'Verifier', company: 'Test Corp', email: 'test@example.com'}); document.getElementById('settings-modal').classList.add('hidden');")
            page.wait_for_selector('#settings-modal', state='hidden', timeout=2000)
            print("Settings modal closed.")
        except:
            print("Settings modal check skipped.")

        # Fill inputs to enable report generation
        page.fill('#p-name', 'Source Tracking Test')
        page.select_option('#f-type', 'Commercial Office')
        page.select_option('#f-source', 'Surface Water')
        page.select_option('#f-mold-growth', '2')
        page.select_option('#f-hvac-risk', '2')
        page.evaluate("document.getElementById('p-name').dispatchEvent(new Event('input'))")

        # Run audit
        page.click('button[onclick="runAuditProcess()"]')
        page.wait_for_selector('#f-res:not(.hidden)', state='visible')

        # Open Report Modal
        page.click('button[onclick="openReportModal()"]')
        page.wait_for_selector('#report-modal', state='visible')

        # Click "Export / Email Report" to trigger uploadReport() which saves the data
        # Note: This will trigger an alert. We need to handle it.
        page.on("dialog", lambda dialog: dialog.accept())
        page.click('button[onclick="uploadReport()"]')

        # Now verify data in LocalStorage (via API mock)
        # We can check the leads via console evaluation of API.getLeads()
        # Since API is globally available
        leads = page.evaluate("API.getLeads()")
        print(f"Leads found: {len(leads)}")

        found_source = False
        for lead in leads:
            if lead['project']['name'] == 'Source Tracking Test':
                print(f"Lead Found. Source: {lead.get('source')}")
                if lead.get('source') == 'Randy':
                    found_source = True

        if found_source:
            print("PASS: Source 'Randy' correctly saved.")
        else:
            print("FAIL: Source 'Randy' NOT found.")

        browser.close()

if __name__ == '__main__':
    run()
