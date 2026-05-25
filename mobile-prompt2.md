Update the existing Hope Pathways React Native Expo mobile prototype.

IMPORTANT SCOPE
Only modify files inside the mobile/ folder.
Do not modify anything outside mobile/.
Do not add new dependencies.
Do not add React Navigation.
Do not add Redux.
Do not add Tailwind.
Use existing React state and React Native StyleSheet only.
Keep the app compatible with:
- Expo Web
- EAS Android APK build
- Existing package setup

CURRENT APP
The current mobile app has a landing/welcome screen with:
- Hope Pathways title
- subtitle
- Start Chat button
- emergency footer

The app already has a chat flow for a person who needs help.

NEW FEATURE GOAL
Add a second pathway for people who are trying to help someone else.

The landing page should now have:
1. Main chat button for the affected person
2. Bottom button/card called "Help Someone"

"Help Someone" should navigate to a simple supporter pathway with large, easy-to-tap grid cards.

This feature is designed to help:
- friends
- family members
- carers
- community partners
- volunteers

It should help them understand what to say, what not to say, when to escalate, and how to connect someone to support.

PRODUCT CONTEXT
The Suicide Prevention Network challenge includes:
- Not reaching enough women who could benefit
- Inconsistent referral pathways and low service awareness
- Processes are manual and spread across multiple systems

The success outcomes are:
- Clear embedded referral pathways for partners
- Earlier and repeat referrals
- Increased client bookings
- Reduced admin
- Better insight
- Consistent volunteer support

FEATURE DESIGN
Add a new "Help Someone" button/card at the bottom of the landing screen.

Button label:
"Help Someone"

Subtext:
"Support a friend, family member, or someone you’re worried about"

When tapped, navigate to a new SupporterHomeScreen.

SCREEN FLOW
Use simple state in App.tsx.

Add screen states:

type Screen =
  | "welcome"
  | "chat"
  | "supporterHome"
  | "supporterCoach"
  | "warningSigns"
  | "referralPathways"
  | "emergencyGuide";

Default screen should be "welcome".

NAVIGATION REQUIREMENT
Do not use React Navigation.

Implement simple navigation in App.tsx using:
- current screen state
- history stack state

Example:

const [screen, setScreen] = useState<Screen>("welcome");
const [history, setHistory] = useState<Screen[]>([]);

function goTo(nextScreen: Screen) {
  setHistory((previousHistory) => [...previousHistory, screen]);
  setScreen(nextScreen);
}

function goBack() {
  setHistory((previousHistory) => {
    if (previousHistory.length === 0) {
      setScreen("welcome");
      return [];
    }

    const previousScreen = previousHistory[previousHistory.length - 1];
    setScreen(previousScreen);
    return previousHistory.slice(0, -1);
  });
}

function goHome() {
  setHistory([]);
  setScreen("welcome");
}

Navigation behaviour:
- Back button should go to the previous page.
- Home button should always go to the welcome screen.
- From Welcome, there should be no back button.
- From Chat, provide a "Home" option.
- From SupporterHome, back should return to Welcome.
- From SupporterCoach, back should return to SupporterHome.
- From WarningSigns, back should return to SupporterHome.
- From ReferralPathways, back should return to SupporterHome.
- From EmergencyGuide, back should return to SupporterHome.

HEADER / NAV UI REQUIREMENT
For all screens except WelcomeScreen, add a simple top header.

Header should include:
- Back button on the left: "← Back"
- Home button on the right: "Home"
- Screen title in the middle or below if easier

Do not overcomplicate the header.
Use TouchableOpacity and Text only.

Create a reusable component if helpful:

mobile/src/components/AppHeader.tsx

AppHeader props:
- title: string
- onBack: () => void
- onHome: () => void
- showBack?: boolean
- showHome?: boolean

Use this AppHeader on:
- ChatScreen if easy to update
- SupporterHomeScreen
- SupporterCoachScreen
- WarningSignsScreen
- ReferralPathwaysScreen
- EmergencyGuideScreen

If updating ChatScreen is risky, do not break it. At minimum, add Home navigation to ChatScreen.

LANDING / WELCOME SCREEN UPDATE
Update the existing welcome screen.

Keep the existing Hope Pathways branding.

Change the existing button text:
"Start Chat"
to:
"I Need Support"

Add a second button or bottom card:
"Help Someone"

Layout:
- Main content centered
- "I Need Support" as primary button
- "Help Someone" as secondary outlined button/card near the bottom
- Keep footer:
  "Hope Pathways is not an emergency service. If you are in immediate danger, call 000."

SUPPORTER HOME SCREEN
Create:

mobile/src/components/SupporterHomeScreen.tsx

This screen should show:
Title:
"Help Someone"

Subtitle:
"Choose the kind of support you need."

Use 2x2 large grid cards where possible.
Cards should be large, readable, and easy to tap.

Cards:

1. AI Coaching
Title: "AI Coaching"
Text: "Practise what to say and when to escalate."
Button/action: navigates to SupporterCoachScreen

2. Warning Signs
Title: "Warning Signs"
Text: "Know when someone may need urgent support."
Button/action: navigates to WarningSignsScreen

3. Referral Pathways
Title: "Referral Pathways"
Text: "Find the right next step for support."
Button/action: navigates to ReferralPathwaysScreen

4. Emergency Guide
Title: "Emergency Guide"
Text: "What to do if someone is in immediate danger."
Button/action: navigates to EmergencyGuideScreen

Add AppHeader with:
- Back button returning to Welcome
- Home button returning to Welcome

SUPPORTER COACH SCREEN
Create:

mobile/src/components/SupporterCoachScreen.tsx

This is a separate AI-style coaching chat for friends and family.

Important:
For the hackathon prototype, use local mock responses only.
Do not call the backend.
Do not add new API endpoints.

Initial assistant message:
"Hi, I can help you support someone you care about. What are you worried about today?"

The supporter can type a message.

The coach should respond with practical, warm guidance.

The coach must focus on:
- what to say
- what not to say
- how to stay calm
- how to ask directly about safety
- how to encourage professional support
- when to call Lifeline or 000

SAFETY RULES FOR SUPPORTER COACH
Do not tell the supporter to diagnose.
Do not tell the supporter to conduct a clinical suicide risk assessment.
Do not tell the supporter to manage the situation alone.
Do not provide clinical treatment instructions.
Do not mention hospitalisation, emergency detention, or psychiatric interventions as instructions for the supporter.
Instead, guide them to contact emergency or professional support when risk is present.

If the supporter mentions any crisis keywords, such as:
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

Then the coach response should be:

"Thank you for taking this seriously. If they may be in immediate danger, call 000 now. If they are talking about suicide or self-harm, contact Lifeline on 13 11 14 and stay with them if it is safe to do so. You can ask directly: 'Are you thinking about hurting yourself?'"

Also show a crisis support card with:
- Call 000
- Call Lifeline 13 11 14
- Stay with them if safe
- Remove immediate access to danger only if it is safe to do so
- Involve a trusted adult, family member, GP, or crisis service

Use React Native Linking for call buttons:
Linking.openURL("tel:000")
Linking.openURL("tel:131114")

NORMAL COACHING RESPONSE
If no crisis keywords are detected, provide a helpful coaching response like:

"That sounds really hard, and it makes sense that you want to help. A good first step is to listen without trying to fix everything. You could say: 'I'm really glad you told me. I care about you, and I’m here with you.'"

Then show a coaching tips card:

"What to say"
- "I'm glad you told me."
- "I care about you."
- "Do you want to talk about what has been hardest?"
- "Would it help if we contacted support together?"

"What not to say"
- "Just cheer up."
- "Other people have it worse."
- "You're overreacting."
- "Promise me you won't tell anyone."

"Helpful next step"
- Encourage them to visit Evolve Mental Health & Wellbeing Hub
- Encourage calling Lifeline if risk increases
- Encourage involving a trusted person

Add AppHeader with:
- Back button returning to SupporterHomeScreen
- Home button returning to WelcomeScreen

WARNING SIGNS SCREEN
Create:

mobile/src/components/WarningSignsScreen.tsx

Show simple static content.

Title:
"Warning Signs"

Text:
"These signs do not always mean someone is suicidal, but they may mean they need support."

Sections:

Emotional signs:
- Hopelessness
- Feeling trapped
- Intense shame or guilt
- Sudden calm after distress

Behaviour changes:
- Withdrawing from people
- Giving things away
- Saying goodbye
- Increased alcohol or drug use
- Risk-taking behaviour

What to do:
- Stay calm
- Listen without judgement
- Ask directly if they are thinking about hurting themselves
- Do not leave them alone if there is immediate danger
- Call 000 if there is immediate danger
- Call Lifeline 13 11 14 for crisis support

Add AppHeader with:
- Back button returning to SupporterHomeScreen
- Home button returning to WelcomeScreen

REFERRAL PATHWAYS SCREEN
Create:

mobile/src/components/ReferralPathwaysScreen.tsx

Show clear embedded referral pathway cards.

Title:
"Referral Pathways"

Subtitle:
"Choose the pathway that best fits the situation."

Cards:

1. Mild stress or information seeking
Recommendation:
"Self-guided resources"
Details:
"Beyond Blue, SANE Forums, breathing tools, and wellbeing information."

2. Moderate distress or needs someone to talk to
Recommendation:
"Evolve Hub"
Details:
"Free walk-in support in Newcastle CBD. No appointment needed. Mon–Fri 9am–8pm, Sat 10am–4pm."

3. Suicide, self-harm, or immediate concern
Recommendation:
"Crisis support"
Details:
"Call Lifeline 13 11 14. Call 000 if there is immediate danger."

4. Partner or volunteer follow-up
Recommendation:
"Record and refer"
Details:
"For prototype: this would create a simple referral summary for staff or volunteers to review."

Add a small note:
"This prototype supports consistent referral guidance. It does not replace professional judgement."

Add AppHeader with:
- Back button returning to SupporterHomeScreen
- Home button returning to WelcomeScreen

EMERGENCY GUIDE SCREEN
Create:

mobile/src/components/EmergencyGuideScreen.tsx

Title:
"Emergency Guide"

Show a clear urgent card:
"If someone is in immediate danger, call 000 now."

Show buttons:
- Call 000
- Call Lifeline 13 11 14

Show simple steps:
1. Stay calm and stay with them if it is safe.
2. Ask directly: "Are you thinking about hurting yourself?"
3. Do not promise secrecy.
4. Contact emergency or crisis support.
5. Involve a trusted person if possible.

Add note:
"Your safety matters too. If the situation is unsafe, move away and call emergency services."

Add AppHeader with:
- Back button returning to SupporterHomeScreen
- Home button returning to WelcomeScreen

APP.TSX UPDATE
Update mobile/App.tsx to manage all screens with simple useState.

No navigation library.

Use this navigation model:

const [screen, setScreen] = useState<Screen>("welcome");
const [history, setHistory] = useState<Screen[]>([]);

const goTo = (nextScreen: Screen) => {
  setHistory((previousHistory) => [...previousHistory, screen]);
  setScreen(nextScreen);
};

const goBack = () => {
  setHistory((previousHistory) => {
    if (previousHistory.length === 0) {
      setScreen("welcome");
      return [];
    }

    const previousScreen = previousHistory[previousHistory.length - 1];
    setScreen(previousScreen);
    return previousHistory.slice(0, -1);
  });
};

const goHome = () => {
  setHistory([]);
  setScreen("welcome");
};

Render:
- WelcomeScreen for "welcome"
- ChatScreen for "chat"
- SupporterHomeScreen for "supporterHome"
- SupporterCoachScreen for "supporterCoach"
- WarningSignsScreen for "warningSigns"
- ReferralPathwaysScreen for "referralPathways"
- EmergencyGuideScreen for "emergencyGuide"

Pass navigation callbacks as props:
- onStartChat={() => goTo("chat")}
- onHelpSomeone={() => goTo("supporterHome")}
- onBack={goBack}
- onHome={goHome}
- onOpenCoach={() => goTo("supporterCoach")}
- onOpenWarningSigns={() => goTo("warningSigns")}
- onOpenReferralPathways={() => goTo("referralPathways")}
- onOpenEmergencyGuide={() => goTo("emergencyGuide")}

CHAT SCREEN NAVIGATION
Update ChatScreen carefully.

Add optional props:
- onBack?: () => void
- onHome?: () => void

If provided, show a simple top header or home button.
Do not break existing chat behaviour.
Do not reset existing messages unless the user returns Home.

UI STYLE
Keep the current calm Hope Pathways style.

Use:
- white/off-white background
- dark blue/teal text
- green accent where appropriate
- large rounded cards
- simple icons using emoji only, no icon libraries
- large touch targets
- readable text
- mobile-first layout
- works in Expo Web and APK

Suggested emoji:
- 🤝 Help Someone
- 💬 AI Coaching
- ⚠️ Warning Signs
- 🧭 Referral Pathways
- 🚨 Emergency Guide

IMPORTANT TECH CONSTRAINTS
Do not install packages.
Do not change package.json unless absolutely necessary.
Do not change app.json.
Do not change eas.json.
Do not touch node_modules.
Do not use npx.
Do not add dependencies.

Keep the app buildable with:
npm.cmd run web

And compatible with EAS APK build:
.\node_modules\.bin\eas.cmd build -p android --profile preview

FILES TO CREATE
Create:
mobile/src/components/AppHeader.tsx
mobile/src/components/SupporterHomeScreen.tsx
mobile/src/components/SupporterCoachScreen.tsx
mobile/src/components/WarningSignsScreen.tsx
mobile/src/components/ReferralPathwaysScreen.tsx
mobile/src/components/EmergencyGuideScreen.tsx

FILES TO UPDATE
Update:
mobile/App.tsx
mobile/src/components/WelcomeScreen.tsx
mobile/src/components/ChatScreen.tsx only if needed for Home/Back navigation

Only update other existing mobile files if necessary.

DELIVERABLE
Implement the feature cleanly and simply.
The prototype should be demo-ready.
The supporter coaching chat should work offline with local mock responses.

The user should be able to navigate:
Welcome → I Need Support → existing chat flow
Welcome → Help Someone → AI Coaching
Welcome → Help Someone → Warning Signs
Welcome → Help Someone → Referral Pathways
Welcome → Help Someone → Emergency Guide

Back navigation should reverse the flow:
AI Coaching → Back → Help Someone
Warning Signs → Back → Help Someone
Referral Pathways → Back → Help Someone
Emergency Guide → Back → Help Someone
Help Someone → Back → Welcome

Home navigation should always return to:
Welcome