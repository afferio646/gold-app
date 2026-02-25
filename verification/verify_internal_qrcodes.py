
import cv2
from pyzbar.pyzbar import decode
import os

def verify_full_qr(filepath, expected_url):
    print(f"Verifying {filepath}...")

    # Read image
    img = cv2.imread(filepath)
    if img is None:
        print(f"FAIL: Could not read image at {filepath}")
        return False

    # Decode
    decoded_objects = decode(img)

    if not decoded_objects:
        print("FAIL: No QR code found.")
        return False

    for obj in decoded_objects:
        decoded_data = obj.data.decode("utf-8")
        if decoded_data == expected_url:
            print(f"PASS: QR code matches expected URL: {decoded_data}")
            return True
        else:
            print(f"FAIL: Mismatch. Found: {decoded_data}, Expected: {expected_url}")
            return False

if __name__ == "__main__":
    r_ok = verify_full_qr("assets/qrcodes/randy_full_qr.png", "https://gold-app-two.vercel.app/index.html?source=Randy")
    b_ok = verify_full_qr("assets/qrcodes/brett_full_qr.png", "https://gold-app-two.vercel.app/index.html?source=Brett")

    if r_ok and b_ok:
        print("ALL INTERNAL QR CODES VERIFIED.")
    else:
        exit(1)
