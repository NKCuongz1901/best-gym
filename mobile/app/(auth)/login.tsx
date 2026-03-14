import Input from "@/components/input/input";
import { APP_ROUTES } from "@/constants/appRoute";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    console.log("Login:", { email, password });
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Chào mừng trở lại 💪</Text>
            <Text style={styles.subtitle}>
              Đăng nhập để tiếp tục hành trình fitness của bạn
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Feather name="mail" size={24} color="#8A93A5" />}
            />

            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Mật khẩu"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color="#8A93A5"
                />
              }
              rightIcon={
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color="#8A93A5"
                />
              }
              onPressRightIcon={() => setShowPassword((prev) => !prev)}
            />

            <Pressable style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </Pressable>

            <Pressable style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
              <Ionicons name="arrow-forward" size={28} color="#08110A" />
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <Pressable onPress={() => router.push(APP_ROUTES.REGISTER)}>
                <Text style={styles.registerText}>Đăng ký ngay</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020817",
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 26,
    color: "#8A93A5",
  },
  form: {
    gap: 18,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 18,
  },
  forgotPasswordText: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22C55E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 14,
    marginTop: 8,
  },
  loginButtonText: {
    color: "#08110A",
    fontSize: 22,
    fontWeight: "800",
  },
  footer: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  footerText: {
    color: "#8A93A5",
    fontSize: 16,
  },
  registerText: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "700",
  },
});
