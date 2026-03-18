import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeScreen({ children, style }) {
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[{ flex: 1, backgroundColor: "#ffffff" }, style]}
    >
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </SafeAreaView>
  );
}
