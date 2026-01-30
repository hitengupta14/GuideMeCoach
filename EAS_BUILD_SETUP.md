# EAS Build Setup for Real Razorpay Integration

## ✅ What I've Done

1. ✅ Installed EAS CLI globally
2. ✅ Created `eas.json` configuration file for development builds
3. ✅ Updated `app.json` with:
   - Proper Android package name: `com.guidemecoach.mobile`
   - Proper iOS bundle identifier: `com.guidemecoach.mobile`
   - Razorpay plugin configuration
   - Required permissions for camera and file access
   - Development build configuration

## 🚀 Next Steps: Start the EAS Build

### Step 1: Log In to EAS

Run this command in your terminal:

```bash
cd /Users/hitengupta/GuideMeCoach/mobile
eas login
```

You'll be prompted to:
- Create a new Expo account (if you don't have one)
- OR log in with existing credentials
- Authorize the build access

### Step 2: Create EAS Project

After logging in, run:

```bash
eas build --platform ios --profile development
```

Or for Android (faster):

```bash
eas build --platform android --profile development
```

### Step 3: Monitor the Build

The CLI will:
1. Show real-time build progress
2. Display a QR code when complete
3. Provide an install link

### Step 4: Install the Development Build

**Option A: Scan QR Code (Fastest)**
- Use your device's camera to scan the QR code shown in terminal
- This opens Expo Go with the development build ready to install
- Tap "Install" to get the custom build with Razorpay

**Option B: Manual Install Link**
- Look for the install URL in the terminal output
- Share it via email to your device
- Open the link on your device to install

## 📦 Build Configuration

Your `eas.json` is configured for:

```json
{
  "development": {
    "distribution": "internal",    // Internal testing
    "android": { "buildType": "apk" },  // Works on any Android device
    "ios": { "simulator": false }   // Real iOS device
  }
}
```

## 🔑 Build Profiles Available

| Profile | Purpose | Distribution | Type |
|---------|---------|--------------|------|
| `development` | Testing with Razorpay | Internal | APK/Real device |
| `preview` | Preview features | Internal | APK |
| `production` | App Store/Play Store | Store | AAB |

## ⏱️ Expected Times

- **iOS**: 10-15 minutes
- **Android**: 5-10 minutes

## 🎯 What Will Be Different

✅ **Demo Mode is OFF** - Uses real Razorpay API
✅ **Real Payments Work** - Can test with actual payment flow
✅ **Test Keys Enabled** - Use Razorpay test credentials (no real charges)
✅ **Custom Native Build** - Includes all native modules properly compiled

## 🧪 Testing Razorpay

After installation, test with Razorpay's test credentials:

**Test Card (No charge):**
- Card: 4111111111111111
- Expiry: 12/25
- CVV: 123

## ❓ Troubleshooting

### Build Fails
- Ensure your iOS/Android setup is correct
- Check that Expo account has no pending email verification
- Clear cache: `eas build --platform ios --clear-cache`

### Installation Fails
- Make sure device is unlocked
- Check that you're on the same WiFi as terminal
- Try the manual install link instead of QR code

### Need Help
- Check build logs: `eas build --status`
- View detailed errors: `eas build --logs`

## 📱 Device Support

✅ Real iOS devices (iPhone/iPad)
✅ Real Android devices (any version 12+)
❌ iOS Simulator (won't work - needs real device)
❌ Android Emulator (needs additional setup)

---

**Ready? Run:** `cd /Users/hitengupta/GuideMeCoach/mobile && eas login`
