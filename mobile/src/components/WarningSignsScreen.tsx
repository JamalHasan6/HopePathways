import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { COLORS } from "../constants";
import AppHeader from "./AppHeader";

interface WarningSignsScreenProps {
  onBack: () => void;
  onHome: () => void;
}

export default function WarningSignsScreen({ onBack, onHome }: WarningSignsScreenProps) {
  return (
    <View style={styles.container}>
      <AppHeader title="Warning Signs" onBack={onBack} onHome={onHome} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          These signs do not always mean someone is suicidal, but they may mean they need support.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>😔 Emotional signs</Text>
          <Text style={styles.item}>• Hopelessness</Text>
          <Text style={styles.item}>• Feeling trapped</Text>
          <Text style={styles.item}>• Intense shame or guilt</Text>
          <Text style={styles.item}>• Sudden calm after distress</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Behaviour changes</Text>
          <Text style={styles.item}>• Withdrawing from people</Text>
          <Text style={styles.item}>• Giving things away</Text>
          <Text style={styles.item}>• Saying goodbye</Text>
          <Text style={styles.item}>• Increased alcohol or drug use</Text>
          <Text style={styles.item}>• Risk-taking behaviour</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ What to do</Text>
          <Text style={styles.item}>• Stay calm</Text>
          <Text style={styles.item}>• Listen without judgement</Text>
          <Text style={styles.item}>
            • Ask directly if they are thinking about hurting themselves
          </Text>
          <Text style={styles.item}>
            • Do not leave them alone if there is immediate danger
          </Text>
        </View>

        <TouchableOpacity
          style={styles.callButton}
          onPress={() => Linking.openURL("tel:000")}
        >
          <Text style={styles.callButtonText}>Call 000 — Immediate Danger</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.lifelineButton}
          onPress={() => Linking.openURL("tel:131114")}
        >
          <Text style={styles.lifelineButtonText}>Call Lifeline 13 11 14</Text>
        </TouchableOpacity>
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
  intro: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 10,
  },
  item: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: 2,
  },
  callButton: {
    backgroundColor: COLORS.crisisRed,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  callButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  lifelineButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  lifelineButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
