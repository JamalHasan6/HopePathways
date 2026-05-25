import React, { useState } from "react";
import { View, Platform, StyleSheet, useWindowDimensions } from "react-native";
import { ChatMessage, TriageResult } from "./src/types";
import WelcomeScreen from "./src/components/WelcomeScreen";
import ChatScreen from "./src/components/ChatScreen";
import SupporterHomeScreen from "./src/components/SupporterHomeScreen";
import SupporterCoachScreen from "./src/components/SupporterCoachScreen";
import WarningSignsScreen from "./src/components/WarningSignsScreen";
import ReferralPathwaysScreen from "./src/components/ReferralPathwaysScreen";
import EmergencyGuideScreen from "./src/components/EmergencyGuideScreen";

type Screen =
  | "welcome"
  | "chat"
  | "supporterHome"
  | "supporterCoach"
  | "warningSigns"
  | "referralPathways"
  | "emergencyGuide";

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [history, setHistory] = useState<Screen[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { height } = useWindowDimensions();

  const goTo = (nextScreen: Screen) => {
    setHistory((prev) => [...prev, screen]);
    setScreen(nextScreen);
  };

  const goBack = () => {
    setHistory((prev) => {
      if (prev.length === 0) {
        setScreen("welcome");
        return [];
      }
      const previousScreen = prev[prev.length - 1];
      setScreen(previousScreen);
      return prev.slice(0, -1);
    });
  };

  const goHome = () => {
    setHistory([]);
    setScreen("welcome");
  };

  const handleRestart = () => {
    setMessages([]);
    setTriage(null);
    setLoading(false);
    goHome();
  };

  const renderScreen = () => {
    switch (screen) {
      case "welcome":
        return (
          <WelcomeScreen
            onStart={() => goTo("chat")}
            onHelpSomeone={() => goTo("supporterHome")}
          />
        );
      case "chat":
        return (
          <ChatScreen
            messages={messages}
            setMessages={setMessages}
            triage={triage}
            setTriage={setTriage}
            loading={loading}
            setLoading={setLoading}
            onRestart={handleRestart}
            onHome={goHome}
          />
        );
      case "supporterHome":
        return (
          <SupporterHomeScreen
            onBack={goBack}
            onHome={goHome}
            onOpenCoach={() => goTo("supporterCoach")}
            onOpenWarningSigns={() => goTo("warningSigns")}
            onOpenReferralPathways={() => goTo("referralPathways")}
            onOpenEmergencyGuide={() => goTo("emergencyGuide")}
          />
        );
      case "supporterCoach":
        return <SupporterCoachScreen onBack={goBack} onHome={goHome} />;
      case "warningSigns":
        return <WarningSignsScreen onBack={goBack} onHome={goHome} />;
      case "referralPathways":
        return <ReferralPathwaysScreen onBack={goBack} onHome={goHome} />;
      case "emergencyGuide":
        return <EmergencyGuideScreen onBack={goBack} onHome={goHome} />;
      default:
        return (
          <WelcomeScreen
            onStart={() => goTo("chat")}
            onHelpSomeone={() => goTo("supporterHome")}
          />
        );
    }
  };

  return (
    <View style={[styles.container, { minHeight: height }]}>
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    maxWidth: 480,
    ...(Platform.OS === "web"
      ? { marginLeft: "auto" as any, marginRight: "auto" as any, shadowColor: "#253240", shadowOpacity: 0.08, shadowRadius: 40, shadowOffset: { width: 0, height: 16 } }
      : {}),
  },
});