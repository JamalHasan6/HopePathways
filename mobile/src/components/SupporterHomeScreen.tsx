import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from "react-native";
import { COLORS } from "../constants";
import AppHeader from "./AppHeader";

const WHATSAPP_NUMBER = "61493457003";

interface SupporterHomeScreenProps {
  onBack: () => void;
  onHome: () => void;
  onOpenCoach: () => void;
  onOpenWarningSigns: () => void;
  onOpenReferralPathways: () => void;
  onOpenEmergencyGuide: () => void;
}

export default function SupporterHomeScreen({
  onBack,
  onHome,
  onOpenCoach,
  onOpenWarningSigns,
  onOpenReferralPathways,
  onOpenEmergencyGuide,
}: SupporterHomeScreenProps) {
  return (
    <View style={styles.container}>
      <AppHeader title="Help Someone" onBack={onBack} onHome={onHome} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Choose the kind of support you need.</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.card} onPress={onOpenCoach}>
            <Text style={styles.cardEmoji}>💬</Text>
            <Text style={styles.cardTitle}>AI Coaching</Text>
            <Text style={styles.cardText}>Practise what to say and when to escalate.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={onOpenWarningSigns}>
            <Text style={styles.cardEmoji}>⚠️</Text>
            <Text style={styles.cardTitle}>Warning Signs</Text>
            <Text style={styles.cardText}>Know when someone may need urgent support.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={onOpenReferralPathways}>
            <Text style={styles.cardEmoji}>🧭</Text>
            <Text style={styles.cardTitle}>Referral Pathways</Text>
            <Text style={styles.cardText}>Find the right next step for support.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={onOpenEmergencyGuide}>
            <Text style={styles.cardEmoji}>🚨</Text>
            <Text style={styles.cardTitle}>Emergency Guide</Text>
            <Text style={styles.cardText}>What to do if someone is in immediate danger.</Text>
          </TouchableOpacity>

          {/* Fifth wide WhatsApp card */}
          <TouchableOpacity
            style={styles.wideCard}
            onPress={() => {
              const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi Hope Pathways, I would like to speak with someone about support.")}`;
              Linking.openURL(url);
            }}
          >
            <Text style={styles.cardEmoji}>💬</Text>
            <Text style={styles.cardTitle}>WhatsApp Handoff</Text>
            <Text style={styles.cardText}>Message a real support person for non-urgent follow-up.</Text>
            <Text style={styles.wideCardNote}>Non-urgent follow-up only</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    width: "48%",
    marginBottom: 16,
    shadowColor: "#253240",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    minHeight: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  wideCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 16,
    shadowColor: "#253240",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#25D366",
  },
  wideCardNote: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontStyle: "italic",
  },
});
