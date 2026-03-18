import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ParentFooter() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + 4 }]}>
      <View style={styles.iconRow}>
        <MaterialCommunityIcons name="account-check" size={28} color="#1976d2" style={{ marginRight: 16 }} />
        <FontAwesome5 name="file-alt" size={26} color="#43a047" style={{ marginRight: 16 }} />
        <Text style={styles.text}>© 2025 Garud Classes</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: "#555",
  },
});
