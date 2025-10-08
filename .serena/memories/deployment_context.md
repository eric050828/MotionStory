# Deployment Context

## Backend (Render.com)
**Status**: ✅ Successfully deployed
**URL**: https://motionstory-api.onrender.com
**Python Version**: 3.13

### Key Configuration Fixes
1. **Rust Dependencies Eliminated**:
   - Replaced python-jose → PyJWT
   - Replaced bcrypt → Argon2
   - Pinned cryptography<35.0.0 (last C-only version)
   
2. **Pydantic Upgrade**:
   - pydantic 2.6.0 → 2.8.0 (Python 3.13 binary wheels)
   - Added email-validator for EmailStr support
   
3. **Firebase Integration**:
   - Uses complete service account JSON (base64 encoded)
   - All required fields: project_id, private_key, client_email, token_uri

4. **requirements.txt**:
   - Added --prefer-binary flag to force binary wheels
   - No packages require Rust compilation

## Frontend (EAS Build)
**Status**: ⏳ Requires user action
**Platform**: Android

### Build Profiles (eas.json)
- **development**: Development Build with expo-dev-client, connects to local/remote API
- **preview**: APK build for testing, connects to production API
- **production**: App bundle for Play Store release

### Current Task
User needs to build custom Development Build APK:
```bash
cd app
eas build --platform android --profile development
```

### Why Custom Build Needed
App contains native dependencies (Firebase, Google Sign-In) that require compilation into APK. Standard Expo Go cannot run these.

### Configuration Files
- app.json: Contains scheme "motionstory" for deep linking
- eas.json: Build profiles configured for Android SDK 34
- babel.config.js: Expo SDK 51 compatible configuration
- index.js: Entry point for expo-router

## Environment Variables

### Backend (.env)
- MONGODB_URL
- FIREBASE_PRIVATE_KEY (base64 encoded complete JSON)
- SECRET_KEY (JWT signing)
- R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY

### Frontend (.env)
- EXPO_PUBLIC_API_URL
- EXPO_PUBLIC_FIREBASE_API_KEY
- EXPO_PUBLIC_FIREBASE_PROJECT_ID

## Security Notes
- Firebase config files removed from Git history
- .gitignore properly configured
- All sensitive files excluded from version control
