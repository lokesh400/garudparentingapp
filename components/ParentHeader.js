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
          <MaterialCommunityIcons name="account-multiple" size={20} color="#6D28D9" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E5EF",
    elevation: 2,
    shadowColor: "#6D28D9",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
  },
  leftLogoWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  leftLogo: {
    width: 24,
    height: 24,
  },
  tabName: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    color: "#171717",
    letterSpacing: 0.3,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8F7FC",
    borderWidth: 1,
    borderColor: "#E8E5EF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
