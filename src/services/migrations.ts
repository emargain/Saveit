/**
 * One-shot AsyncStorage migrations run on app startup. Each migration is
 * gated by a device-local flag so it executes at most once per device.
 *
 * Delete entries here once enough time has passed that no in-the-wild
 * devices could still need them.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCAL_BLOB_WIPE_FLAG = "@saveit_blob_wiped_v1";
const LOCAL_MARKETPLACE_KEY = "@saveit_local_marketplace_v1";

/**
 * Wipes the mock-auth-era local marketplace blob whose ownerUserId/
 * customerUserId fields were email strings, now incompatible with real
 * Supabase UUIDs. Safe because no real users existed pre-migration.
 * Idempotent via a one-time flag.
 */
export async function wipeStaleLocalBlobIfNeeded(): Promise<void> {
  try {
    const flag = await AsyncStorage.getItem(LOCAL_BLOB_WIPE_FLAG);
    if (flag) return;
    await AsyncStorage.removeItem(LOCAL_MARKETPLACE_KEY);
    await AsyncStorage.setItem(LOCAL_BLOB_WIPE_FLAG, "true");
  } catch (err) {
    console.error("wipeStaleLocalBlobIfNeeded failed:", err);
  }
}
