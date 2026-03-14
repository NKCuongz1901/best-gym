import PackageContractCard from "@/components/card/PackageContractCard";
import CategoryItem from "@/components/home/CategoryItem";
import FeaturedWorkoutCard from "@/components/home/FeaturedWorkoutCard";
import { useAuthStore } from "@/stores/auth.store";
import { useMyPurchasePackages } from "@/stores/useMyPurchasePackages";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = [
  {
    id: "1",
    title: "Cardio",
    icon: <Ionicons name="flame-outline" size={40} color="#08110A" />,
    active: true,
  },
  {
    id: "2",
    title: "Fitness",
    icon: <MaterialCommunityIcons name="dumbbell" size={40} color="#19F07C" />,
  },
  {
    id: "3",
    title: "Boxing",
    icon: <Ionicons name="barbell-outline" size={40} color="#19F07C" />,
  },
  {
    id: "4",
    title: "Yoga",
    icon: <Ionicons name="accessibility-outline" size={40} color="#19F07C" />,
  },
  {
    id: "5",
    title: "Bơi lội",
    icon: <Ionicons name="water-outline" size={40} color="#19F07C" />,
  },
];

const featuredWorkouts = [
  {
    id: "1",
    title: "Massive Legs Training",
    category: "SỨC MẠNH",
    image: require("../../assets/images/workout-hiit.jpg"),
  },
  {
    id: "2",
    title: "Upper Body Power",
    category: "SỨC MẠNH",
    image: require("../../assets/images/workout-legs.jpg"),
  },
  {
    id: "3",
    title: "Morning Flexibility",
    category: "YOGA",
    image: require("../../assets/images/workout-upper.jpg"),
  },
];

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isRefetching } = useMyPurchasePackages();

  const purchasePackages = useMemo(() => data?.data ?? [], [data]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatarBox}>
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={32}
                  color="#08110A"
                />
              </View>

              <View>
                <Text style={styles.greeting}>Xin chào 👋</Text>
                <Text style={styles.userName}>
                  {user?.email?.split("@")[0] || "Người dùng"}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable style={styles.actionButton}>
                <Ionicons name="search-outline" size={28} color="#8A93A5" />
              </Pressable>

              <Pressable style={styles.actionButton}>
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color="#8A93A5"
                />
                <View style={styles.notificationDot} />
              </Pressable>
            </View>
          </View>

          <View style={styles.contractSection}>
            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#22C55E" />
              </View>
            ) : (
              <FlatList
                data={purchasePackages}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => <PackageContractCard item={item} />}
                contentContainerStyle={styles.contractListContent}
                ListEmptyComponent={
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Hợp đồng</Text>
                    <Text style={styles.emptyText}>
                      Bạn chưa có gói tập nào
                    </Text>
                  </View>
                }
              />
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <Pressable>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>

          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <CategoryItem
                title={item.title}
                icon={item.icon}
                active={item.active}
              />
            )}
            contentContainerStyle={styles.horizontalListContent}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bài tập nổi bật</Text>
            <Pressable>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>

          <FlatList
            data={featuredWorkouts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <FeaturedWorkoutCard
                title={item.title}
                category={item.category}
                image={item.image}
              />
            )}
            contentContainerStyle={styles.horizontalListContent}
          />

          {isRefetching && (
            <Text style={styles.refreshText}>Đang cập nhật dữ liệu...</Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020817",
  },
  contentContainer: {
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22C55E",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  greeting: {
    color: "#8A93A5",
    fontSize: 18,
    marginBottom: 4,
  },
  userName: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    maxWidth: 180,
  },
  headerActions: {
    flexDirection: "row",
    gap: 14,
  },
  actionButton: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#1A2332",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#EF4444",
    position: "absolute",
    top: 18,
    right: 18,
  },
  contractSection: {
    marginBottom: 30,
  },
  contractListContent: {
    paddingLeft: 24,
    paddingRight: 8,
  },
  loadingBox: {
    height: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCard: {
    marginHorizontal: 24,
    width: 360,
    borderRadius: 28,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 24,
  },
  emptyTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  emptyText: {
    color: "#8A93A5",
    fontSize: 16,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
  },
  seeAll: {
    color: "#19F07C",
    fontSize: 18,
    fontWeight: "700",
  },
  horizontalListContent: {
    paddingLeft: 24,
    paddingRight: 8,
    marginBottom: 28,
  },
  refreshText: {
    color: "#8A93A5",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
});
