from playwright.sync_api import sync_playwright
import os
import json

def verify_source_tracking():
    cwd = os.getcwd()
    # Using member.html as test bed
    filepath = f"file://{cwd}/member.html?source=REP_TEST_01"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        print(f"Navigating to {filepath}...")
        page.goto(filepath)

        # 1. Fill Settings (Simulate Registration)
        page.evaluate("""
            localStorage.setItem('goldmorr_settings', JSON.stringify({
                name: 'Test User',
                company: 'Test Co',
                email: 'test@example.com'
            }));
        """)
        page.reload()

        # 2. Switch to Profitability Tab to make the button visible
        print("Switching to Profitability Tab...")
        page.click('text=02. Profitability Guard')

        # 3. Fill Report Inputs (Minimal)
        # Note: We don't strictly need to fill the form for the button to work,
        # but we do need costs to be calculated so the button isn't weird.
        page.fill('#c-product', '100')
        page.fill('#c-techs', '1')

        # 4. Trigger Modal Open (Button should now be visible)
        print("Clicking Review Button...")
        page.click('text=Review Certified Report')

        # 5. Trigger Upload/Save
        print("Clicking Export Button...")
        page.click('text=Export PDF Report')

        # 6. Check Local Storage for the saved lead
        leads_json = page.evaluate("localStorage.getItem('goldmorr_leads')")
        leads = json.loads(leads_json)

        if len(leads) > 0:
            latest_lead = leads[0]
            lead_id = latest_lead.get('id', '')
            source = latest_lead.get('source', '')

            print(f"Latest Lead ID: {lead_id}")
            print(f"Latest Source: {source}")

            if "REP_TEST_01" in lead_id and source == "REP_TEST_01":
                print("PASS: Source ID correctly used in Lead Generation.")
            else:
                print(f"FAIL: Expected REP_TEST_01 in ID/Source, got {lead_id} / {source}")
        else:
            print("FAIL: No leads saved.")

        browser.close()

if __name__ == "__main__":
    verify_source_tracking()
