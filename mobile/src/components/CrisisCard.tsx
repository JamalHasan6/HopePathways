import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { COLORS } from "../constants";

interface CrisisCardProps {
  onContinue: () => void;
}

export default function CrisisCard({ onContinue }: CrisisCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Crisis Support</Text>
      <Text style={styles.message}>
        Thank you for telling me. What you're feeling matters, and it's
        important to get support right now.
      </Text>

      <TouchableOpacity
        style={styles.lifelineButton}
        onPress={() => Linking.openURL("tel:131114")}
      >
        <Text style={styles.lifelineText}>📞 Call Lifeline 13 11 14</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => Linking.openURL("tel:000")}
      >
        <Text style={styles.emergencyText}>🚨 Call 000</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueText}>Continue Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 12,
    padding: 20,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.crisisRed,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 20,
  },
  lifelineButton: {
    backgroundColor: COLORS.crisisRed,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  lifelineText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emergencyButton: {
    backgroundColor: "#991B1B",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  emergencyText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  continueButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.mutedText,
  },
  continueText: {
    color: COLORS.mutedText,
    fontSize: 14,
    fontWeight: "500",
  },
});
