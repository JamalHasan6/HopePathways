Update the existing Hope Pathways React Native Expo mobile prototype.

IMPORTANT SCOPE
Only modify files inside the mobile/ folder.
Do not modify anything outside mobile/.
Do not add new dependencies.
Do not add React Navigation.
Do not add Redux.
Do not add Tailwind.
Do not change package.json.
Do not change app.json.
Do not change eas.json.
Do not touch node_modules.
Do not use npx.

Keep the app compatible with:
- Expo Web
- EAS Android APK build
- Existing package setup

The app should continue to run with:
npm.cmd run web

And build APK with:
.\node_modules\.bin\eas.cmd build -p android --profile preview

CURRENT APP
The app already has:
- Welcome screen
- I Need Support pathway
- Help Someone pathway
- SupporterHomeScreen with four big grid cards:
  1. AI Coaching
  2. Warning Signs
  3. Referral Pathways
  4. Emergency Guide
- Simple state-based navigation in App.tsx
- AppHeader with Back and Home navigation
- SupporterCoachScreen with local mock coaching responses

NEW FEATURE GOALS
Add two improvements:

1. Add WhatsApp handoff as a fifth wide card on Help Someone screen.
2. Improve the AI Coaching flow so it supports both typing and guided option buttons, asks a slightly longer coaching conversation, and ends with a consent-based referral/follow-up flow.

IMPORTANT SAFETY POSITIONING
Hope Pathways does not replace emergency services, Lifeline, clinicians, or professional judgement.
The AI coach must not diagnose or conduct a clinical suicide risk assessment.
The AI coach should help supporters:
- stay calm
- use safer language
- recognise warning signs
- ask direct safety questions
- connect to Lifeline, 000, Evolve Hub, WhatsApp, or referral follow-up
- request consent before collecting supporter contact details

PART 1 — WHATSAPP HANDOFF FEATURE

Create a reusable component:

mobile/src/components/WhatsAppHandoffButton.tsx

Component behaviour:
- Use React Native Linking only.
- Do not add dependencies.
- Use a placeholder Australian WhatsApp number:
  const WHATSAPP_NUMBER = "61412345678";
- Build a WhatsApp URL:
  https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}
- Open the URL using Linking.openURL(url).

Props:
type WhatsAppHandoffButtonProps = {
  label?: string;
  message?: string;
  variant?: "primary" | "outline";
};

Default label:
"Message support team on WhatsApp"

Default message:
"Hi Hope Pathways, I would like to speak with someone about support."

Show a small safety note:
"WhatsApp may not be monitored 24/7. If there is immediate danger, call 000."

Add the WhatsApp button/card to:
- SupporterHomeScreen as a fifth wide card
- ReferralPathwaysScreen under Evolve Hub referral
- SupporterCoachScreen after coaching guidance and after referral consent flow
- EmergencyGuideScreen only as a non-urgent follow-up option

IMPORTANT:
Do not make WhatsApp the primary crisis action.
For crisis, primary actions remain:
- Call 000
- Call Lifeline 13 11 14

SUPPORTER HOME SCREEN UPDATE
Update:

mobile/src/components/SupporterHomeScreen.tsx

Current layout has 4 grid cards.
Keep those 4 cards.

Add a fifth wide card below the 2x2 grid.

Card title:
"WhatsApp Handoff"

Card text:
"Message a real support person for non-urgent follow-up."

Card should span the full width of the grid area.
It should visually match the app style but be wide enough to align with both columns.

Suggested layout:
- Use flexDirection: "row" with flexWrap: "wrap" for the first 4 cards.
- First 4 cards can be about 48% width.
- Fifth WhatsApp card should be width: "100%".

When tapped, open WhatsApp using WhatsAppHandoffButton logic or render the WhatsAppHandoffButton inside the card.

PART 2 — IMPROVE AI COACHING CHAT

Update:

mobile/src/components/SupporterCoachScreen.tsx

The AI Coach should feel more guided and useful for people who do not know what to ask.

It should support:
1. Free text typing
2. Quick option buttons
3. Multi-step coaching conversation
4. Crisis keyword handling
5. Consent-based referral request
6. Collection of helper details only after consent

Do not call backend.
Use local state and local mock responses only.

COACHING CONVERSATION DESIGN

Initial assistant message:
"Hi, I can help you support someone you care about. You can type what’s happening, or choose one of the options below."

Show quick options after the first message:

Options:
- "They seem depressed"
- "They mentioned suicide"
- "They are withdrawing"
- "I don’t know what to say"
- "I’m worried about immediate danger"

When user taps an option, treat it like a user message and generate a coach response.

The coaching flow should ask 2 to 4 simple questions across the conversation, not all at once.

Possible assistant follow-up questions:
1. "Are you worried they might hurt themselves today?"
2. "Have they said anything about wanting to die, self-harm, or not wanting to be here?"
3. "Are they alone right now, or is someone safe with them?"
4. "Would you feel comfortable contacting support together?"

The coach should not be too long.
Each assistant message should be 2 to 5 short sentences.

NORMAL COACHING RESPONSE
If no crisis keywords are detected, respond warmly and practically.

Example:
"That sounds really hard, and it makes sense that you want to help. A good first step is to listen without trying to fix everything. You could say: 'I’m really glad you told me. I care about you, and I’m here with you.'"

Then show quick next options:
- "What should I say?"
- "What should I avoid saying?"
- "How do I ask about suicide?"
- "How do I connect them to support?"
- "Request follow-up"

CRISIS COACHING RESPONSE
If the supporter mentions any crisis keywords:
- suicide
- suicidal
- kill himself
- kill herself
- kill themselves
- self harm
- wants to die
- end it
- doesn't want to be here
- no reason to live
- goodbye messages
- has a plan
- has means
- overdose
- weapon
- immediate danger

Then respond:
"Thank you for taking this seriously. If they may be in immediate danger, call 000 now. If they are talking about suicide or self-harm, contact Lifeline on 13 11 14 and stay with them if it is safe to do so. You can ask directly: 'Are you thinking about hurting yourself?'"

Also show a Crisis Coaching Card with:
- Call 000
- Call Lifeline 13 11 14
- Stay with them if safe
- Do not promise secrecy
- Involve a trusted person, GP, or crisis service
- Remove immediate access to danger only if it is safe to do so

Use:
Linking.openURL("tel:000")
Linking.openURL("tel:131114")

After crisis guidance, show quick options:
- "Help me ask directly"
- "What should I say now?"
- "Request follow-up"
- "Open WhatsApp"

GUIDED EDUCATION CARDS
In SupporterCoachScreen, add collapsible-looking or normal static cards after relevant responses.

Card 1:
Title:
"What to say"

Items:
- "I’m glad you told me."
- "I care about you."
- "You don’t have to go through this alone."
- "Are you thinking about hurting yourself?"
- "Can we contact support together?"

Card 2:
Title:
"What not to say"

Items:
- "Just cheer up."
- "Other people have it worse."
- "You’re overreacting."
- "Promise me you won’t tell anyone."
- "You’re being selfish."

Card 3:
Title:
"How to ask directly"

Text:
"Asking about suicide does not put the idea in someone’s head. It can help them feel less alone."

Example:
"Are you thinking about suicide or hurting yourself?"

Card 4:
Title:
"Connect to support"

Items:
- "Evolve Mental Health & Wellbeing Hub for walk-in support"
- "Lifeline 13 11 14 for crisis support"
- "000 if there is immediate danger"
- "WhatsApp handoff for non-urgent follow-up"

PART 3 — CONSENT-BASED REFERRAL FLOW

Inside SupporterCoachScreen, add a referral/follow-up section.

The assistant should ask near the end of coaching or when user taps "Request follow-up":

"Would you like a support worker or volunteer to follow up with you about how to support this person?"

Then show two buttons:
- "Yes, I consent"
- "No, continue without follow-up"

IMPORTANT:
Only collect details after the user taps "Yes, I consent".

If they choose No:
Show:
"That’s okay. You can still use these resources, call Lifeline on 13 11 14, or message the support team on WhatsApp for non-urgent support."

If they choose Yes:
Show a simple referral form.

Referral form fields:
- Your name
- Your phone or email
- Preferred contact method: Phone / SMS / Email / WhatsApp
- Who are you supporting? Friend / Family / Partner / Colleague / Stranger / Other
- Is there immediate danger? Yes / No / Unsure
- Short note about what is happening

Keep the form simple and prototype-only.

Do not submit to backend.
On submit, show a local confirmation card.

Confirmation card text:
"Thank you. In a full version, this would create a consent-based follow-up request for authorised staff or volunteers. For this prototype, your details are only shown on this device."

Also show a generated local referral summary:

Referral Summary:
- Supporter:
- Contact:
- Preferred method:
- Relationship:
- Immediate danger:
- Concern:
- Suggested pathway:

Suggested pathway logic:
- If immediate danger is Yes or message contains crisis keywords:
  "Crisis pathway: 000 / Lifeline 13 11 14"
- If immediate danger is Unsure:
  "Urgent support guidance: Lifeline 13 11 14 and staff review"
- Otherwise:
  "Supporter follow-up / Evolve Hub referral guidance"

Add buttons after confirmation:
- "Message on WhatsApp"
- "Back to Help Someone"
- "Home"

Use the existing navigation callbacks:
onBack
onHome
and add any needed callback like onBackToSupporterHome if already available.

PART 4 — SCREEN STATE AND NAVIGATION

Do not add navigation libraries.

Keep using App.tsx state-based navigation.

SupporterCoachScreen should receive:
- onBack: () => void
- onHome: () => void

If needed, add:
- onBackToSupporterHome: () => void

But prefer using existing onBack if history stack already works.

Make sure:
- Back from SupporterCoachScreen returns to SupporterHomeScreen
- Home from SupporterCoachScreen returns to WelcomeScreen
- WhatsApp open does not break navigation
- Referral form submit stays on SupporterCoachScreen and shows confirmation
- User can return home after referral confirmation

PART 5 — UI REQUIREMENTS

Use existing Hope Pathways styling.

Use React Native StyleSheet only.

Keep:
- calm background
- green accent
- dark teal text
- white rounded cards
- large touch targets
- readable text

The supporter coach should be easy for non-technical users:
- large option buttons
- short messages
- clear cards
- minimum typing required

Use ScrollView so content does not get cut off on mobile APK.

For input fields, use React Native TextInput.
For option buttons, use TouchableOpacity.

The fifth WhatsApp card on SupporterHomeScreen should:
- be full width
- sit below the first four grid cards
- have title, subtext, and a clear action
- include small note:
  "Non-urgent follow-up only"

PART 6 — FILES TO CREATE

Create:
mobile/src/components/WhatsAppHandoffButton.tsx

Update:
mobile/src/components/SupporterHomeScreen.tsx
mobile/src/components/SupporterCoachScreen.tsx
mobile/src/components/ReferralPathwaysScreen.tsx
mobile/src/components/EmergencyGuideScreen.tsx

Only update:
mobile/App.tsx
if navigation props are required.

Do not modify files outside mobile/.

PART 7 — ACCEPTANCE TESTS

After implementation, the app should support:

1. Welcome → Help Someone
2. Help Someone screen shows 4 normal grid cards plus 1 full-width WhatsApp Handoff card
3. WhatsApp Handoff opens WhatsApp deep link
4. Help Someone → AI Coaching
5. AI Coaching shows initial message and quick option buttons
6. User can type a message
7. User can tap quick options
8. Crisis phrase triggers crisis coaching card
9. Normal concern shows coaching tips
10. User can tap "Request follow-up"
11. App asks for consent first
12. If user says No, no form is shown
13. If user says Yes, form is shown
14. Form submit shows local referral summary
15. Confirmation screen has WhatsApp, Back, and Home actions
16. Back navigation returns to previous screen
17. Home navigation returns to Welcome
18. App still runs with npm.cmd run web
19. App remains compatible with EAS APK build

DELIVERABLE
Implement this as a clean hackathon prototype.
Keep it simple, reliable, and demo-ready.
Do not over-engineer.
Do not add dependencies.