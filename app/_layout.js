import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar hidden={false} style="dark" translucent={true} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
