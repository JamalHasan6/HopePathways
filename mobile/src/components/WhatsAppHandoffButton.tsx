import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { COLORS } from "../constants";

const WHATSAPP_NUMBER = "61493457003";

type WhatsAppHandoffButtonProps = {
  label?: string;
  message?: string;
  variant?: "primary" | "outline";
};

export default function WhatsAppHandoffButton({
  label = "Message support team on WhatsApp",
  message = "Hi Hope Pathways, I would like to speak with someone about support.",
  variant = "primary",
}: WhatsAppHandoffButtonProps) {
  const handlePress = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, variant === "outline" ? styles.buttonOutline : styles.buttonPrimary]}
        onPress={handlePress}
      >
        <Text
          style={[styles.buttonText, variant === "outline" ? styles.buttonTextOutline : styles.buttonTextPrimary]}
        >
          💬 {label}
        </Text>
      </TouchableOpacity>
      <Text style={styles.note}>
        WhatsApp may not be monitored 24/7. If there is immediate danger, call 000.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: "#25D366",
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: "#25D366",
    backgroundColor: "transparent",
  },
  buttonText: {
    fontWeight: "700",
    fontSize: 15,
  },
  buttonTextPrimary: {
    color: "#FFFFFF",
  },
  buttonTextOutline: {
    color: "#25D366",
  },
  note: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 16,
  },
});
