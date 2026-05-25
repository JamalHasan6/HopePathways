import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { COLORS } from "../constants";
import AppHeader from "./AppHeader";
import WhatsAppHandoffButton from "./WhatsAppHandoffButton";

interface EmergencyGuideScreenProps {
  onBack: () => void;
  onHome: () => void;
}

export default function EmergencyGuideScreen({ onBack, onHome }: EmergencyGuideScreenProps) {
  return (
    <View style={styles.container}>
      <AppHeader title="Emergency Guide" onBack={onBack} onHome={onHome} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.urgentCard}>
          <Text style={styles.urgentEmoji}>🚨</Text>
          <Text style={styles.urgentText}>
            If someone is in immediate danger, call 000 now.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.callButton}
          onPress={() => Linking.openURL("tel:000")}
        >
          <Text style={styles.callButtonText}>Call 000</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.lifelineButton}
          onPress={() => Linking.openURL("tel:131114")}
        >
          <Text style={styles.lifelineButtonText}>Call Lifeline 13 11 14</Text>
        </TouchableOpacity>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>What to do</Text>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Stay calm and stay with them if it is safe.</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>
              Ask directly: "Are you thinking about hurting yourself?"
            </Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Do not promise secrecy.</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.stepText}>Contact emergency or crisis support.</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>5</Text>
            <Text style={styles.stepText}>Involve a trusted person if possible.</Text>
          </View>
        </View>

        <Text style={styles.safetyNote}>
          Your safety matters too. If the situation is unsafe, move away and call emergency services.
        </Text>

        <View style={styles.whatsappSection}>
          <WhatsAppHandoffButton
            variant="outline"
            label="Non-urgent follow-up on WhatsApp"
            message="Hi Hope Pathways, I would like to speak with someone after an emergency situation."
          />
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
  urgentCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.crisisRed,
  },
  urgentEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  urgentText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.crisisRed,
    textAlign: "center",
    lineHeight: 26,
  },
  callButton: {
    backgroundColor: COLORS.crisisRed,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  callButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  lifelineButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  lifelineButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  stepsCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#253240",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 16,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
    marginRight: 12,
    overflow: "hidden",
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  safetyNote: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    fontStyle: "italic",
  },
  whatsappSection: {
    marginTop: 20,
  },
});
