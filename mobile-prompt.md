You are a senior React Native engineer helping build a hackathon mobile prototype called Hope Pathways.

IMPORTANT:
This prompt is only for creating the React Native mobile app.
Do not modify any existing web app, backend, admin dashboard, database, root config, or existing project files.
Only create a new folder called mobile/ at the repository root.
All mobile app code must live inside mobile/.

Do not add or modify files outside mobile/.
Do not change the root package.json.
Do not change the root .npmrc.
Do not change any existing web app files.
Do not reuse the web app node_modules.

PROJECT CONTEXT
Hope Pathways is a mental health navigation platform for the Newcastle and Lake Macquarie region.

The mobile app should focus only on the first-contact chat triage experience.

The app allows a person to:
1. Start a warm chat
2. Answer a few gentle questions
3. Receive a support pathway recommendation

The three possible triage outcomes are:
- self_guided
- hub_referral
- crisis

The app must not diagnose, treat, or provide clinical advice.
It should act as a support navigator.

TECH STACK
Use React Native with Expo and TypeScript.

Keep dependencies minimal:
- expo
- react
- react-native
- typescript

Do not add Redux.
Do not add navigation libraries.
Do not add UI libraries.
Do not add Tailwind.
Do not add anything outside the mobile/ folder.

NPM INSTALL / REGISTRY SETUP
Inside the mobile/ folder, create a local .npmrc file.

The purpose of this file is to force the mobile app to use the public npm registry instead of any custom corporate registry configured on the machine.

Create:

mobile/.npmrc

With this content:

registry=https://registry.npmjs.org/
always-auth=false
strict-ssl=true

Do not modify the root .npmrc.
Do not modify any existing web app .npmrc.
Do not change global npm configuration.
Only create mobile/.npmrc.

The mobile app must have its own package.json and its own node_modules inside mobile/.
Do not reuse the web app node_modules.
Do not reference node_modules from the web app.

Also create mobile/README.md with these run instructions:

cd mobile
npm install --registry=https://registry.npmjs.org/
npx expo start --tunnel

Also mention this temporary hackathon fallback in README.md:

If npm install fails due to corporate SSL certificate/proxy issues, try:

npm install --registry=https://registry.npmjs.org/

If SSL certificate errors still occur, use only as a temporary local workaround:

npm config set strict-ssl false

Then after the hackathon, restore:

npm config set strict-ssl true

FOLDER STRUCTURE
Create only this structure:

mobile/
  .npmrc
  README.md
  App.tsx
  package.json
  tsconfig.json
  src/
    types.ts
    constants.ts
    utils/
      triageParser.ts
      crisisDetection.ts
    components/
      WelcomeScreen.tsx
      ChatScreen.tsx
      ChatBubble.tsx
      SupportCard.tsx
      CrisisCard.tsx

APP SCOPE
Build only:
1. Welcome screen
2. Chat screen
3. Support recommendation card
4. Crisis support card

USER FLOW
1. User opens the app.
2. Welcome screen appears with Hope Pathways branding.
3. User taps "Start Chat".
4. Chat screen opens.
5. Assistant sends this first message:
   "Hi, I'm glad you're here. How are you feeling today?"
6. User types a message.
7. App sends the message to the backend endpoint:
   POST /api/chat
8. Backend returns an assistant reply.
9. App displays the assistant reply.
10. If the reply includes a <TRIAGE> JSON block, the app parses it and hides the JSON from the user.
11. Based on the triage classification, the app shows the correct support card.

BACKEND API CONTRACT
Assume the backend endpoint is:

POST https://YOUR_BACKEND_URL/api/chat

Request body:

{
  "sessionId": "mobile-demo-session",
  "message": "User message here",
  "channel": "mobile"
}

Response body:

{
  "reply": "Assistant response text, possibly ending with <TRIAGE>{...}</TRIAGE>"
}

Put the backend URL in mobile/src/constants.ts:

export const API_BASE_URL = "https://YOUR_BACKEND_URL";

If the backend request fails, use a local mock response so the mobile demo still works.

MOCK RESPONSE FALLBACK
If the backend fails, generate a simple assistant response based on the user message.

Examples:

For normal stress:
"I'm sorry you're feeling this way. It makes sense that this has been hard. Can I ask how long you've been feeling like this?"

For medium distress:
"Thank you for sharing that. It sounds like you may benefit from talking to someone in person. Hope Pathways can connect you with walk-in support."

For crisis:
"Thank you for telling me. What you're feeling matters, and it's important to get support right now. You can call Lifeline on 13 11 14, or call 000 if you are in immediate danger."

TRIAGE FORMAT TO PARSE
The assistant reply may contain:

<TRIAGE>
{
  "classification": "self_guided" | "hub_referral" | "crisis",
  "crisis": true | false,
  "summary": "2–3 sentence summary",
  "recommended_resource": "Short recommended next step",
  "language_detected": "en",
  "flags": ["first_time_seeker", "social_isolation"]
}
</TRIAGE>

The app must:
- Extract the JSON between <TRIAGE> and </TRIAGE>
- Parse it safely
- Remove the <TRIAGE> block before showing the assistant message
- Store the parsed triage result in state
- Show the correct support card

LOCAL CRISIS FALLBACK
Add local crisis keyword detection.

If the user message includes phrases like:
- suicide
- kill myself
- end my life
- self harm
- i want to die
- i can't go on
- don't want to be here
- i want to end it
- no reason to live

Then immediately show the Crisis Support card, even if the backend fails.

CRISIS CARD
Show this text:

"Thank you for telling me. What you're feeling matters, and it's important to get support right now."

Show buttons:
- Call Lifeline 13 11 14
- Call 000
- Continue Chat

Use React Native Linking:

Linking.openURL("tel:131114")
Linking.openURL("tel:000")

HUB REFERRAL CARD
Title:
"Visit Evolve Hub"

Text:
"Based on what you've shared, talking to someone in person may help. Evolve Mental Health & Wellbeing Hub offers free walk-in support in Newcastle CBD."

Details:
"Mon–Fri 9am–8pm"
"Sat 10am–4pm"
"No appointment needed"

Button:
"Show Hub Details"

SELF-GUIDED CARD
Title:
"Self-Guided Support"

Text:
"Based on what you've shared, self-guided tools and information may be a helpful first step."

Resources:
- Beyond Blue
- SANE Forums
- Breathing exercise

UI DESIGN
Use React Native StyleSheet only.

Use these colors:
- Background: #F5FAF7
- Primary green: #1E8E6E
- Dark teal: #0F3D3E
- Card background: #FFFFFF
- Crisis red: #B42318
- Text: #1F2937
- Muted text: #6B7280

Style requirements:
- Calm mobile-first design
- Rounded cards
- Large readable text
- Chat bubbles
- User messages aligned right
- Assistant messages aligned left
- Input fixed at bottom
- Send button
- Loading indicator while waiting
- Works properly on Android and iOS through Expo Go

IMPLEMENTATION DETAILS

types.ts:
Define:
- Classification
- ChatMessage
- TriageResult

Classification should be:

export type Classification = "self_guided" | "hub_referral" | "crisis";

ChatMessage should include:
- id
- sender: "user" | "assistant"
- text
- timestamp

TriageResult should include:
- classification
- crisis
- summary
- recommended_resource
- language_detected
- flags

constants.ts:
Define:
- API_BASE_URL
- colors
- initial assistant message
- demo session id

triageParser.ts:
Create:

parseTriageFromReply(reply: string): {
  cleanReply: string;
  triage: TriageResult | null;
}

This function should:
- Find the <TRIAGE>...</TRIAGE> block
- Parse the JSON safely
- Return cleanReply without the triage block
- Return triage as null if parsing fails

crisisDetection.ts:
Create:

detectLocalCrisis(message: string): boolean

This function should:
- Convert message to lowercase
- Check for crisis keywords
- Return true or false

App.tsx:
Manage:
- started state
- messages state
- triage state
- loading state

App.tsx should:
- Show WelcomeScreen when started is false
- Show ChatScreen when started is true
- Store chat messages in state
- Store triage result in state

WelcomeScreen.tsx:
Show:
- Hope Pathways title
- Subtitle: "Mental Health Navigation Platform"
- Short text: "A safe place to start a conversation."
- Button: "Start Chat"
- Footer warning:
  "Hope Pathways is not an emergency service. If you are in immediate danger, call 000."

ChatScreen.tsx:
Handle:
- rendering messages
- input field
- send button
- sendMessage function
- API call to backend
- local mock fallback when backend fails
- displaying SupportCard or CrisisCard when triage exists

ChatBubble.tsx:
Render user and assistant message bubbles.

SupportCard.tsx:
Render different content for:
- self_guided
- hub_referral

CrisisCard.tsx:
Render crisis support message and phone call buttons.

SAFETY RULES
- Do not say the app diagnoses the user.
- Do not say the user is safe.
- Do not promise confidentiality.
- Do not provide clinical advice.
- Always show Lifeline 13 11 14 for crisis.
- Always show 000 for immediate danger.
- Add this footer text:
  "Hope Pathways is not an emergency service. If you are in immediate danger, call 000."

PACKAGE.JSON REQUIREMENTS
Create mobile/package.json with scripts:

{
  "scripts": {
    "start": "expo start",
    "start:tunnel": "expo start --tunnel",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}

Keep package dependencies minimal and compatible with Expo.

README REQUIREMENTS
Create mobile/README.md with:
- What this mobile prototype does
- How to install
- How to run with Expo Go
- How to run using tunnel
- Note that node_modules should be installed inside mobile/
- Note that web node_modules should not be reused
- Note about corporate proxy workaround

DELIVERABLE
Create only the mobile/ folder and the files listed above.
Do not change anything outside mobile/.
Generate simple, working, demo-ready React Native Expo TypeScript code.