import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import api from "./api";
import Constants from "expo-constants";

// Show notification even when app is open (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,     // Android + older iOS
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device for Expo Push Token.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission not granted");
    return null;
  }

  const projectId =
    Constants.easConfig?.projectId ||
    (Constants.expoConfig as any)?.extra?.eas?.projectId;

  const tokenRes = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  const token = tokenRes.data;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}

// ✅ Send token to backend (we will implement endpoint /auth/push-token)
export async function savePushTokenToBackend(expoPushToken: string) {
  try {
    console.log("Saving push token to backend:", expoPushToken);
    const res = await api.post("/auth/push-token", { expo_push_token: expoPushToken });
    console.log("Saved push token OK:", res.data);
  } catch (e: any) {
    console.log("Save push token FAILED:", e?.response?.data || e?.message);
    throw e;
  }
}

