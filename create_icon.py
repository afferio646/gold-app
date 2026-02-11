from PIL import Image, ImageDraw, ImageFont

def create_icon():
    # Colors
    navy = "#0a192f"
    gold = "#D4AF37"

    # Create image
    size = (512, 512)
    img = Image.new('RGB', size, color=navy)
    draw = ImageDraw.Draw(img)

    # Draw a simple "G" or a Gold Square with G
    # Let's do a large Gold G in the center.
    # Since we might not have a font, let's draw a geometric G or just a circle/square.
    # A simple filled rounded rectangle or circle with "G" might be hard without a font.
    # Let's draw a thick gold border and a "G" shape manually or try to load a default font.

    # Attempt to load a font, fallback to basic drawing
    try:
        # Try a common linux font
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 300)
        text = "G"

        # Calculate text size using textbbox (newer PIL) or textsize
        if hasattr(draw, 'textbbox'):
             bbox = draw.textbbox((0, 0), text, font=font)
             w = bbox[2] - bbox[0]
             h = bbox[3] - bbox[1]
        else:
             w, h = draw.textsize(text, font=font)

        x = (size[0] - w) / 2
        y = (size[1] - h) / 2 - 40 # Adjust for baseline

        draw.text((x, y), text, fill=gold, font=font)

    except Exception as e:
        print(f"Font error: {e}. Drawing geometric G.")
        # Draw a geometric G if font fails
        # Outer box
        margin = 100
        # draw.rectangle([margin, margin, size[0]-margin, size[1]-margin], outline=gold, width=20)
        # G shape is hard to draw manually without looking bad.
        # Let's just draw a solid Gold Circle for simplicity if font fails,
        # or maybe a "Goldmorr" text is not needed, just the color.
        # But let's try to make it look decent.

        # Draw a circle
        cx, cy = size[0]//2, size[1]//2
        r = 200
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=gold, width=30)

        # Draw a horizontal line for the G crossbar
        draw.line([cx, cy, cx+r-20, cy], fill=gold, width=30)

    # Save
    img.save("icon-512.png")
    print("Icon created.")

if __name__ == "__main__":
    create_icon()
