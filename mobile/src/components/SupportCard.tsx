import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Classification } from "../types";
import { COLORS } from "../constants";

interface SupportCardProps {
  classification: Classification;
}

export default function SupportCard({ classification }: SupportCardProps) {
  if (classification === "hub_referral") {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Visit Hope Pathways Hub</Text>
        <Text style={styles.message}>
          Based on what you've shared, talking to someone in person may help.
          The Hope Pathways Health and Wellbeing Hub offers free walk-in support in
          Newcastle CBD.
        </Text>
        <View style={styles.details}>
          <Text style={styles.detailText}>Mon–Fri 9am–8pm</Text>
          <Text style={styles.detailText}>Sat 10am–4pm</Text>
          <Text style={styles.detailText}>No appointment needed</Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openURL("https://www.evolvehub.org.au")}
        >
          <Text style={styles.buttonText}>Show Hub Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (classification === "peer_support") {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Peer Support</Text>
        <Text style={styles.message}>
          Connection with others who understand lived experience can be a
          powerful next step.
        </Text>
        <View style={styles.details}>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://www.sane.org/peer-support/sane-forums")}
          >
            <Text style={styles.resourceLink}>🔗 SANE Forums</Text>
          </TouchableOpacity>
          <Text style={styles.detailText}>
            You can also drop in at the Hope Pathways Hub — free, no appointment needed.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Self-Guided Support</Text>
      <Text style={styles.message}>
        Based on what you've shared, self-guided tools and information may be a
        helpful first step.
      </Text>
      <View style={styles.details}>
        <TouchableOpacity
          onPress={() => Linking.openURL("https://www.beyondblue.org.au")}
        >
          <Text style={styles.resourceLink}>🔗 Beyond Blue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL("https://www.sane.org/peer-support/sane-forums")
          }
        >
          <Text style={styles.resourceLink}>🔗 SANE Forums</Text>
        </TouchableOpacity>
        <Text style={styles.resourceLink}>🧘 Breathing exercise</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 12,
    padding: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surface,
    shadowColor: "#253240",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 23,
    marginBottom: 16,
  },
  details: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  resourceLink: {
    fontSize: 15,
    color: COLORS.secondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  button: {
    backgroundColor: COLORS.secondary,
    padding: 14,
    borderRadius: 50,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
