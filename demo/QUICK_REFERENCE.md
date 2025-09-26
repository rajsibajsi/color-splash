# 🎨 Color Splash Demo - Quick Reference

## 🚀 Getting Started
```bash
cd demo && node serve.js
# Open http://localhost:8080
```

## 📱 Basic Usage
1. **Upload Image** → Drag & drop or click upload area
2. **Select Color** → Click anywhere on image
3. **Adjust Tolerance** → Use sliders for fine-tuning
4. **Apply Effect** → Click "Apply Preview" or "Apply Full Resolution"

## 🎛️ Controls

### Color Tolerance Sliders
- **Hue (0-60°)** → Color precision (lower = more precise)
- **Saturation (0-100%)** → Color vibrancy matching
- **Lightness (0-100%)** → Brightness variation

### Quality Settings
- **LOW** → Fastest (~20ms) for real-time adjustments
- **MEDIUM** → Balanced (~50ms)
- **HIGH** → Best quality (~100ms)
- **REALTIME** → Dynamic based on image size

### Color Spaces
- **HSV** → Recommended for intuitive selection
- **LAB** → Most accurate for human perception
- **RGB** → Fastest processing

## ⚡ Pro Tips
- Start with: Hue=20, Sat=30, Light=25
- Use REALTIME quality while adjusting sliders
- Switch to HIGH quality for final preview
- Click representative color areas (avoid edges)
- Check performance stats for optimization

## 🛠️ Troubleshooting
- **Slow?** → Lower quality setting
- **Imprecise?** → Adjust tolerance values
- **Not working?** → Check browser console (F12)
- **Can't upload?** → Try JPG/PNG format

## 🧪 Test Page
Visit `/test-library.html` for automated library function tests

---
*Full documentation: [INSTRUCTIONS.md](INSTRUCTIONS.md)*