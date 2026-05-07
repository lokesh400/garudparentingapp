import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ParentHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  // Get current tab name
  const getTabName = () => {
    if (pathname.includes("dashboard")) return "Dashboard";
    if (pathname.includes("timetable")) return "Timetable";
    if (pathname.includes("fees")) return "Fees";
    if (pathname.includes("tests")) return "Result";
    if (pathname.includes("attendance")) return "Attendance";
    return "Garud Classes";
  };

  return (
    <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.leftLogoWrap}>
          <Image
            source={require("../assets/images/header-icon.png")}
            style={styles.leftLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.tabName}>{getTabName()}</Text>
        <Pressable
          onPress={() => router.push("/profile-selector")}
          style={({ pressed }) => [
            styles.profileButton,
            pressed && styles.profileButtonPressed,
          ]}
        >
          <MaterialCommunityIcons name="account-multiple" size={20} color="#6366f1" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    paddingHorizontal: 10,
    paddingBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
  },
  leftLogoWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  leftLogo: {
    width: 28,
    height: 28,
  },
  tabName: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
    letterSpacing: 0.3,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  profileButtonPressed: {
    opacity: 0.7,
  },
});
