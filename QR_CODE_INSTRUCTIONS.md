# QR Code Update Instructions for TecaiKids

## When You Get the QR Code Image from the Bank

Follow these simple steps to add your LankaQR payment code to the website:

### Step 1: Upload the QR Code Image
1. Save your QR code image file (should be PNG or JPG format)
2. Name it something simple like `lanka-qr-code.png`
3. Upload it to `/app/frontend/public/` folder

### Step 2: Update the Code
Open `/app/frontend/src/PublicLanding.js` and find this section (around line 473-490):

**REPLACE THIS:**
```jsx
<div className="bg-white p-6 rounded-lg mb-4 min-h-[200px] flex items-center justify-center">
  <div className="text-gray-400 text-center">
    <div className="text-6xl mb-2">🏦</div>
    <div className="text-sm">{t.quickPay.qrPlaceholder}</div>
    <div className="text-xs mt-1">{t.quickPay.qrAvailable}</div>
    <div className="text-xs mt-2 text-gray-500">
      {/* When you get the QR code image, replace the above with: */}
      {/* <img src="/path-to-qr-code.png" alt="LankaQR Payment Code" className="w-48 h-48 mx-auto" /> */}
    </div>
  </div>
</div>
```

**WITH THIS:**
```jsx
<div className="bg-white p-6 rounded-lg mb-4 min-h-[200px] flex items-center justify-center">
  <img 
    src="/lanka-qr-code.png" 
    alt="LankaQR Payment Code" 
    className="w-64 h-64 mx-auto object-contain"
  />
</div>
```

### Step 3: Restart Frontend
Run this command:
```bash
sudo supervisorctl restart frontend
```

### Step 4: Test
Visit your website and scroll to the Quick Payment section to see your QR code!

---

## Alternative: Ask Me to Do It

If you prefer, just tell me:
1. "I have the QR code" 
2. Upload the image file
3. I'll add it to the website for you automatically!

---

## Current Status
- ✅ 3-language system implemented (English, Sinhala, Tamil)
- ✅ Language switcher working in top-right corner
- ✅ QR code placeholder ready
- ⏳ Waiting for actual QR code image from bank (end of week)

---

## Notes
- The placeholder shows "QR Code Coming Soon!" in all 3 languages
- Once you add the real image, it will automatically show in all languages
- Make sure the QR code image is clear and high resolution (at least 512x512 pixels)
