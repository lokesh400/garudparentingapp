import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ParentHeader from "../../components/ParentHeader";

export default function TabsLayout() {
  return (
    <View style={styles.wrapper}>
      <ParentHeader />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#6D28D9",
          tabBarInactiveTintColor: "#64748B",
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "home-variant" : "home-variant-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="timetable"
          options={{
            title: "Timetable",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "clock-time-four" : "clock-time-four-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="fees"
          options={{
            title: "Fees",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "credit-card-chip" : "credit-card-chip-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="tests"
          options={{
            title: "Result",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "trophy" : "trophy-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: "Attendance",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "calendar-check" : "calendar-check-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      <View style={styles.bottomWhiteBlock} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    flex: 1, 
    backgroundColor: "#F8F7FC",
  },
  tabBar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    height: 60,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    elevation: 8,
    shadowColor: "#6D28D9",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10,
  },
  tabBarLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    marginBottom: 4,
  },
  tabBarItem: {
    paddingVertical: 2,
    justifyContent: "center",
  },
  bottomWhiteBlock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: "#ffffff",
    zIndex: 1,
  },
});

