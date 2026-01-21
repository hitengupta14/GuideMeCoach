# Google Auth Setup - Complete Fix

## Problem Summary
Your Google OAuth is failing with `Error 400: invalid_request` because:
1. The redirect URI registered in Google Cloud Console doesn't match the one your app is using
2. Expo requires a valid redirect URI in the format: `https://auth.expo.io/@{username}/{app_slug}`

## Step 1: Get Your Expo Username ✅
Your username: **guptahiten7**
Your app slug: **guidemecoach-mobile**

## Step 2: Required Redirect URI
```
https://auth.expo.io/@guptahiten7/guidemecoach-mobile
```

## Step 3: Update Google Cloud Console

### Steps:
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the right project
3. Go to **APIs & Services** → **Credentials**
4. Find and click your OAuth 2.0 Client ID (the one with your Google Client ID)
5. Under **Authorized redirect URIs**, click **Add URI**
6. Paste:
   ```
   https://auth.expo.io/@guptahiten7/guidemecoach-mobile
   ```
7. Click **Save**

**Current Google Client ID being used:**
```
79067976017-jdrll6f7honug0lpi5bv9vv2m6n3kn3e.apps.googleusercontent.com
```

## Step 4: Code Changes ✅
All code changes have been made:

### Mobile (google-auth.ts)
- ✅ Using correct Web Client ID
- ✅ Proxy enabled (`useProxy: true`)
- ✅ Improved error handling

### Backend (auth endpoints)
- ✅ Login endpoint now returns: `{ success: true, data: { token, user } }`
- ✅ Signup endpoint now returns: `{ success: true, data: { token, user } }`
- ✅ Google endpoint returns: `{ success: true, data: { token, user } }`

### Mobile Store (auth.ts)
- ✅ Properly handles both `response.data.token` and `response.token` formats
- ✅ Better error handling with proper throwing

## Step 5: Test

1. **Restart backend:**
   ```bash
   npm run dev
   ```

2. **Clear and restart Expo:**
   ```bash
   cd mobile
   npx expo start --clear
   ```

3. **Test Login:**
   - Email: test@example.com
   - Password: (correct password for a user in your DB)

4. **Test Google Sign-In:**
   - Click "Sign in with Google"
   - Should open Google consent screen
   - After approval, should redirect back to app

## Troubleshooting

### If still getting "Error 400: invalid_request":
1. Double-check redirect URI is exactly: `https://auth.expo.io/@guptahiten7/guidemecoach-mobile`
2. Make sure it's saved in Google Cloud Console
3. Wait 2-3 minutes for changes to propagate
4. Clear app cache and restart Expo

### If login still fails:
- Check console logs for exact error message
- Verify user exists in database with correct email
- Check password hash is correct

### If you see "Invalid credentials":
- This means login endpoint is working but credentials are wrong
- Use the signup flow first to create a new account

## What Got Fixed

### Backend
1. ✅ Login endpoint now includes token in response
2. ✅ Signup endpoint now includes token in response
3. ✅ Consistent response format: `{ success: true, data: { token, user } }`

### Mobile
1. ✅ Login/Signup now handles token from backend correctly
2. ✅ Google auth properly extracts token from response
3. ✅ Better error logging for debugging

### Auth Flow
1. ✅ All endpoints return consistent response structure
2. ✅ Mobile properly stores and uses JWT tokens
3. ✅ Google OAuth uses Expo proxy for development

## Next Steps

1. **Add the redirect URI to Google Cloud Console** (most important!)
2. Restart backend and Expo
3. Test login/signup
4. Test Google sign-in

Once Google Cloud Console is updated with the redirect URI, everything should work!
