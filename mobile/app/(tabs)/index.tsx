import { useAuthStore } from "@/stores/auth.store";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  console.log(user);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Xin chào {user?.email ?? "User"}</Text>
      <Text style={styles.subText}>Role: {user?.role ?? "-"}</Text>
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
  text: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "700",
  },
  subText: {
    color: "#8A93A5",
    marginTop: 8,
    fontSize: 16,
  },
});
