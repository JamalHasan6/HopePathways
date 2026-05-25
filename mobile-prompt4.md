Update the existing Hope Pathways React Native Expo mobile app to add app icon and startup/splash screen configuration.

IMPORTANT SCOPE
Only modify files inside the mobile/ folder.
Do not modify anything outside mobile/.
Do not add new npm dependencies.
Do not touch node_modules.
Do not use npx.
Keep the app compatible with Expo Web and EAS Android APK build.

GOAL
Add app branding assets and configure Expo app icon, Android adaptive icon, web favicon, and splash/startup screen.

ASSET FOLDER
Create this folder if it does not exist:

mobile/assets/

The project should expect these files:

mobile/assets/icon.png
mobile/assets/adaptive-icon.png
mobile/assets/splash-icon.png

If the actual image files are not available yet, create placeholder instructions in:
mobile/assets/README.md

README should say:
- icon.png should be 1024x1024 PNG
- adaptive-icon.png should be 1024x1024 PNG
- splash-icon.png should be 1024x1024 PNG
- Use calm Hope Pathways branding: green/teal, pathway, leaf, heart, or HP initials
- Avoid small text inside the app icon

APP.JSON UPDATE
Update mobile/app.json only.

Add or preserve:
- name: Hope Pathways
- slug: hope-pathways
- version: 1.0.0
- orientation: portrait
- platforms: ios, android, web
- scheme: hopepathways
- android.package: com.hopepathways.mobile
- android.versionCode: 1

Add icon configuration:

"icon": "./assets/icon.png"

Add web favicon:

"web": {
  "bundler": "metro",
  "favicon": "./assets/icon.png"
}

Add Android adaptive icon:

"android": {
  "package": "com.hopepathways.mobile",
  "versionCode": 1,
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#F5FAF7"
  }
}

Add splash screen plugin:

"plugins": [
  [
    "expo-splash-screen",
    {
      "image": "./assets/splash-icon.png",
      "imageWidth": 180,
      "resizeMode": "contain",
      "backgroundColor": "#F5FAF7"
    }
  ]
]

IMPORTANT
Preserve any existing EAS projectId under expo.extra.eas.projectId if it already exists.
Do not remove existing EAS configuration.
Do not remove existing android.package.
Do not break EAS build.

FINAL EXPECTED app.json SHAPE
The app.json should be valid JSON and should look like this, while preserving existing extra.eas.projectId if present:

{
  "expo": {
    "name": "Hope Pathways",
    "slug": "hope-pathways",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android", "web"],
    "scheme": "hopepathways",
    "icon": "./assets/icon.png",
    "web": {
      "bundler": "metro",
      "favicon": "./assets/icon.png"
    },
    "android": {
      "package": "com.hopepathways.mobile",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F5FAF7"
      }
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "image": "./assets/splash-icon.png",
          "imageWidth": 180,
          "resizeMode": "contain",
          "backgroundColor": "#F5FAF7"
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "KEEP_EXISTING_PROJECT_ID_IF_PRESENT"
      }
    }
  }
}

TESTING NOTES
After updating app.json and adding image assets, the app should still run with:

npm.cmd run web

For APK verification, rebuild using:

.\node_modules\.bin\eas.cmd build -p android --profile preview

Do not add any dependency.
Do not change package.json.