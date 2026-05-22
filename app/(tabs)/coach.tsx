/**
 * Coach Tab - Chat-style UI with deterministic responses.
 * Intents: workout plan, recommend studios, near me. No API; swap for LLM later.
 */

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../../src/ui/theme";
import { generateCoachReply } from "../../src/coach/generateCoachReply";
import { useOnboarding } from "../../src/onboarding-context";
import { useFavorites } from "../../src/state/favorites";
import { useLocation } from "../../src/state/location";
import { partners } from "../../src/data/partners";

type MessageRole = "user" | "coach";

interface Message {
  id: string;
  role: MessageRole;
  text: string;
}

const GREETING: Message = {
  id: "greeting",
  role: "coach",
  text: "Hi! I'm your Saveit coach. Ask me for a workout plan, to recommend studios, or what's near me.",
};

export default function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const { profile } = useOnboarding();
  const { favoriteIds } = useFavorites();
  const { currentLocation } = useLocation();

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const reply = generateCoachReply(trimmed, {
      profile,
      favoriteIds,
      currentLocation,
      partners,
    });

    const coachMsg: Message = {
      id: `coach-${Date.now()}`,
      role: "coach",
      text: reply,
    };
    setMessages((prev) => [...prev, coachMsg]);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Coach</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.bubbleWrap,
                msg.role === "user" && styles.bubbleWrapUser,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  msg.role === "user" ? styles.bubbleUser : styles.bubbleCoach,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === "user" && styles.bubbleTextUser,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={colors.textLight}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              (!input.trim() || pressed) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={input.trim() ? colors.white : colors.textLight}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  bubbleWrap: {
    alignSelf: "flex-start",
    maxWidth: "85%",
    marginBottom: spacing.sm,
  },
  bubbleWrapUser: {
    alignSelf: "flex-end",
  },
  bubble: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    maxWidth: "100%",
  },
  bubbleCoach: {
    backgroundColor: colors.backgroundAlt,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: colors.white,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt,
    fontSize: fontSize.md,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
});
