# MotionStory Project Overview

## Project Type
Fitness tracking mobile application with comprehensive health and workout management features.

## Technology Stack

### Backend (api/)
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Authentication**: Firebase Admin SDK + JWT
- **Storage**: Cloudflare R2
- **Deployment**: Render.com

### Frontend (app/)
- **Framework**: React Native + Expo SDK 51
- **Router**: expo-router (file-based routing)
- **UI**: React Native Paper
- **State**: Zustand
- **Authentication**: Firebase Auth + Google Sign-In
- **Charts**: Victory Native

## Key Native Dependencies
- @react-native-firebase/app
- @react-native-firebase/auth
- @react-native-google-signin/google-signin
- expo-document-picker
- expo-image-picker

## Project Status
- Implementation: 100% complete (180/180 tasks)
- Backend deployment: ✅ Successful on Render.com
- Frontend deployment: ⏳ In progress (requires EAS Build for Development Build)

## Current Issue
User needs to build custom Development Build APK to test on Android device because app contains native dependencies that cannot run in standard Expo Go.

## Important Notes
- Firebase credentials were leaked and cleaned from Git history
- .gitignore properly configured to prevent future leaks
- Backend uses Argon2 for password hashing (no Rust dependencies)
- Python 3.13 compatible with binary wheels only
