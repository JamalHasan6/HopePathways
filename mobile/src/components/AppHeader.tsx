import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { COLORS } from "../constants";

interface AppHeaderProps {
  title: string;
  onBack: () => void;
  onHome: () => void;
  showBack?: boolean;
  showHome?: boolean;
}

export default function AppHeader({
  title,
  onBack,
  onHome,
  showBack = true,
  showHome = true,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <Text style={styles.logo}>🌿 Hope Pathways</Text>
        {showHome ? (
          <TouchableOpacity onPress={onHome} style={styles.homeButton}>
            <Text style={styles.homeText}>Home</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "web" ? 20 : 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  logo: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  homeButton: {
    paddingVertical: 4,
    paddingLeft: 8,
  },
  homeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  placeholder: {
    width: 60,
  },
  title: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
});
