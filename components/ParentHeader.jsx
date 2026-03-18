import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ParentHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Garud Classes Parent App</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0A66C2",
    padding: 15,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
});
