import { Platform, SafeAreaView, StatusBar, View } from "react-native";

export default function SafeScreen({ children, style }) {
  return (
    <View
      style={{
        flex: 1,
        paddingTop:
          Platform.OS === "android" ? StatusBar.currentHeight : 0,
        backgroundColor: "#ffffff",
      }}
    >
      <SafeAreaView style={[{ flex: 1 }, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}
