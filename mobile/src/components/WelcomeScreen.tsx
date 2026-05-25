import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../constants";

interface WelcomeScreenProps {
  onStart: () => void;
  onHelpSomeone?: () => void;
}

export default function WelcomeScreen({ onStart, onHelpSomeone }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🌿</Text>
        <Text style={styles.title}>Hope Pathways</Text>
        <Text style={styles.subtitle}>Mental Health Navigation Platform</Text>
        <Text style={styles.description}>
          A safe place to start a conversation.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onStart}>
          <Text style={styles.buttonText}>I Need Support</Text>
        </TouchableOpacity>
        {onHelpSomeone && (
          <TouchableOpacity style={styles.helpButton} onPress={onHelpSomeone}>
            <Text style={styles.helpEmoji}>🤝</Text>
            <Text style={styles.helpButtonText}>Help Someone</Text>
            <Text style={styles.helpSubtext}>
              Support a friend, family member, or someone you're worried about
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.footer}>
        Hope Pathways is not an emergency service. If you are in immediate
        danger, call 000.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  content: {
    alignItems: "center",
    maxWidth: 480,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: COLORS.primary,
    lineHeight: 42,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: "center",
    maxWidth: 380,
    lineHeight: 26,
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  helpButton: {
    marginTop: 24,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
    maxWidth: 300,
  },
  helpEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  helpButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: 4,
  },
  helpSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 18,
  },
});
