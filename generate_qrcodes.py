
import qrcode
import os

# URLs for Randy and Brett (Facility Only)
urls = {
    "Randy": "https://gold-app-two.vercel.app/facility.html?source=Randy",
    "Brett": "https://gold-app-two.vercel.app/facility.html?source=Brett"
}

output_dir = "assets/qrcodes"
os.makedirs(output_dir, exist_ok=True)

for name, url in urls.items():
    print(f"Generating QR Code for {name} -> {url}")
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    filename = f"{output_dir}/{name.lower()}_qr.png"
    img.save(filename)
    print(f"Saved to {filename}")

print("QR Code Generation Complete.")
