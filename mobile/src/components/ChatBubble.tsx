import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChatMessage } from "../types";
import { COLORS } from "../constants";

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.sender === "user";

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text
          style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 12,
  },
  rowUser: {
    alignItems: "flex-end",
  },
  rowAssistant: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
  },
  bubbleAssistant: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 23,
  },
  textUser: {
    color: "#FFFFFF",
  },
  textAssistant: {
    color: COLORS.textPrimary,
  },
});
