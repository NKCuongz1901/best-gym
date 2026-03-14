import { useAuthStore } from "@/stores/auth.store";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.text}>Đăng xuất</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020817",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
    color: "#08110A",
  },
});
