import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { COLORS } from "../constants";
import AppHeader from "./AppHeader";
import WhatsAppHandoffButton from "./WhatsAppHandoffButton";

interface ReferralPathwaysScreenProps {
  onBack: () => void;
  onHome: () => void;
}

export default function ReferralPathwaysScreen({ onBack, onHome }: ReferralPathwaysScreenProps) {
  return (
    <View style={styles.container}>
      <AppHeader title="Referral Pathways" onBack={onBack} onHome={onHome} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Choose the pathway that best fits the situation.</Text>

        <View style={styles.card}>
          <Text style={styles.cardLevel}>Mild stress or information seeking</Text>
          <Text style={styles.cardRecommendation}>Self-guided resources</Text>
          <Text style={styles.cardDetails}>
            Beyond Blue, SANE Forums, breathing tools, and wellbeing information.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLevel}>Moderate distress or needs someone to talk to</Text>
          <Text style={styles.cardRecommendation}>Evolve Hub</Text>
          <Text style={styles.cardDetails}>
            Free walk-in support in Newcastle CBD. No appointment needed. Mon–Fri 9am–8pm, Sat 10am–4pm.
          </Text>
          <WhatsAppHandoffButton variant="outline" label="Message support on WhatsApp" />
        </View>

        <View style={[styles.card, styles.crisisCard]}>
          <Text style={styles.cardLevel}>Suicide, self-harm, or immediate concern</Text>
          <Text style={[styles.cardRecommendation, { color: COLORS.crisisRed }]}>Crisis support</Text>
          <Text style={styles.cardDetails}>
            Call Lifeline 13 11 14. Call 000 if there is immediate danger.
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.crisisButton}
              onPress={() => Linking.openURL("tel:000")}
            >
              <Text style={styles.crisisButtonText}>Call 000</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.lifelineButton}
              onPress={() => Linking.openURL("tel:131114")}
            >
              <Text style={styles.lifelineButtonText}>Call Lifeline</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLevel}>Partner or volunteer follow-up</Text>
          <Text style={styles.cardRecommendation}>Record and refer</Text>
          <Text style={styles.cardDetails}>
            For prototype: this would create a simple referral summary for staff or volunteers to review.
          </Text>
        </View>

        <Text style={styles.note}>
          This prototype supports consistent referral guidance. It does not replace professional judgement.
        </Text>
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
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#253240",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  crisisCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.crisisRed,
  },
  cardLevel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardRecommendation: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  cardDetails: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  crisisButton: {
    backgroundColor: COLORS.crisisRed,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: "center",
  },
  crisisButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  lifelineButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: "center",
  },
  lifelineButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  note: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    fontStyle: "italic",
  },
});
