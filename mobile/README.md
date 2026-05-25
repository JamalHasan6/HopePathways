# Hope Pathways — Mobile Prototype

A React Native Expo mobile prototype for the Hope Pathways mental health navigation platform.

This app provides a first-contact chat triage experience, guiding users through a warm conversation and recommending a support pathway (self-guided, hub referral, or crisis support).

## Prerequisites

- Node.js 18+
- Expo Go app installed on your phone (Android or iOS)

## Install

```bash
cd mobile
npm install --registry=https://registry.npmjs.org/
```

> **Important:** This mobile app has its own `node_modules`. Do not reuse the web app's `node_modules`.

## Run

```bash
npx expo start --tunnel
```

Then scan the QR code with Expo Go on your phone.

### Other run modes

```bash
npx expo start           # LAN mode
npx expo start --android # Android emulator
npx expo start --ios     # iOS simulator
npx expo start --web     # Web browser
```

## Corporate Proxy / SSL Workaround

If `npm install` fails due to corporate SSL certificate or proxy issues, try:

```bash
npm install --registry=https://registry.npmjs.org/
```

If SSL certificate errors still occur, use **only as a temporary local workaround**:

```bash
npm config set strict-ssl false
```

After the hackathon, restore:

```bash
npm config set strict-ssl true
```
