/**
 * Single entry point for coach message generation.
 * Screen calls generateCoachReply(userMessage, context) and displays the returned string.
 *
 * LATER: Replace the deterministic implementation with an OpenAI chat completion call:
 * - Use message + context to build a system/user payload (e.g. system: "You are the Saveit coach...", user: message).
 * - Call OpenAI API (e.g. chat.completions.create); do not add API keys in this file.
 * - Return the assistant message content (string).
 * - Keep this function signature so the screen does not change.
 */

import type { CoachContext } from "./responses";
import { getCoachResponse } from "./responses";

/**
 * Generate the coach's reply to a user message.
 * Currently deterministic (intent + rules). Later: call OpenAI here and return assistant message.
 */
export function generateCoachReply(message: string, context: CoachContext): string {
  // LATER: OpenAI call goes here.
  // Example flow (do not add API keys):
  // 1. Build messages array from context (e.g. system prompt with profile/favorites/location summary).
  // 2. Append { role: "user", content: message }.
  // 3. Call OpenAI chat.completions.create with the messages array.
  // 4. Return response.choices[0].message.content (or handle errors).
  return getCoachResponse(message, context);
}
