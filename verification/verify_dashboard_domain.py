
import os

def verify_dashboard_domain():
    with open('dashboard.html', 'r') as f:
        content = f.read()

    expected_domain = "https://gold-app-two.vercel.app/"
    if expected_domain in content:
        print("PASS: Dashboard domain is correct.")
    else:
        print(f"FAIL: Dashboard domain not found. Expected {expected_domain}")
        exit(1)

if __name__ == "__main__":
    verify_dashboard_domain()
