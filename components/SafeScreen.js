import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeScreen({ children, style, edges = ["bottom"] }) {
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: "#ffffff" }, style]}
    >
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </SafeAreaView>
  );
}
