from playwright.sync_api import sync_playwright
import os

def verify_facility_revert():
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

        # 2. Check for New Dropdowns
        # Expected: Visible Mold, Surface, Moisture, Sensory, HVAC
        dropdowns = [
            '#f-mold-growth',
            '#f-surface-type',
            '#f-moisture-hist',
            '#f-sensory',
            '#f-hvac-risk'
        ]

        for d in dropdowns:
            if page.locator(d).count() > 0:
                print(f"PASS: Found dropdown {d}")
            else:
                print(f"FAIL: Missing dropdown {d}")

        # 3. Check for Photo Upload in Top Section
        # It's in the first card, let's just check existence of ID
        if page.locator('#f-photos').count() > 0:
            print("PASS: Found Photo Upload Input")
        else:
            print("FAIL: Missing Photo Upload Input")

        # 4. Check Optional Inputs
        rh_ph = page.get_attribute('#f-rh', 'placeholder')
        temp_ph = page.get_attribute('#f-temp', 'placeholder')

        if rh_ph == "Optional" and temp_ph == "Optional":
            print("PASS: RH/Temp inputs are marked Optional")
        else:
            print(f"FAIL: Placeholders are {rh_ph}, {temp_ph}")

        # 5. Run Calculation (With Empty RH/Temp)
        page.select_option('#f-mold-growth', '2') # Moderate (30pts)
        page.select_option('#f-surface-type', '2') # Drywall (10pts)
        page.click('text=Fungal Risk Assessment')

        # 6. Check Results Visibility
        if page.is_visible('#f-res'):
            print("PASS: Result Card Appeared")
        else:
            print("FAIL: Result Card Did Not Appear")

        # 7. Check Legend Existence
        if page.locator('text=Scoring Legend').count() > 0:
            print("PASS: Scoring Legend Found")
        else:
            print("FAIL: Scoring Legend Missing")

        # 8. Check Missing Info Text in Modal
        page.click('text=View Full Report')
        content = page.inner_text('#modal-content')
        if "information is not included" in content:
            print("PASS: Missing Info Text Present")
        else:
            print("FAIL: Missing Info Text Not Found")

        browser.close()

if __name__ == "__main__":
    verify_facility_revert()
