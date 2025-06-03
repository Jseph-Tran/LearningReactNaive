import React, { useRef } from "react";
import { View, StyleSheet, ScrollView, Settings } from "react-native";
import { Link } from "expo-router";
import { Button, Surface, Text } from "react-native-paper";
import { useAuth } from "@/lib/auth-context";
import { client, COMPLETIONS_COLLECTION_ID, DATABASE_ID, databases, HABITS_COLLECTION_ID, RealtimeResponse } from "@/lib/appwrite";
import { Habit, HabitCompletion } from "@/types/database.type";
import { useState, useEffect } from "react"; 
import { Client, ID, Query } from "react-native-appwrite";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Swipeable } from "react-native-gesture-handler";

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>(); 

  const swipeableRefs = useRef<{[key: string]: Swipeable | null }>({})
  const [completedHabits, setCompletedHabits] = useState<string[]>();
 useEffect(() => {
  if (!user) return;

  const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
  const habitsSubscription = client.subscribe(habitsChannel, (response: RealtimeResponse) => {
    if (response.events.includes("databases.*.collections.*.documents.*.create")) {
      fetchHabits();
    } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
      fetchHabits();
    } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
      fetchHabits();
    }
  });

  const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;
  const completionsSubscription = client.subscribe(completionsChannel, (response: RealtimeResponse) => {
    if (response.events.includes("databases.*.collections.*.documents.*.create")) {
      fetchTodaysHabits()
    }
  });

  // Initial fetch
  fetchHabits();
  fetchTodaysHabits()

  return () => {
    habitsSubscription();
    completionsSubscription(); 
  };
  }, [user]);

  async function fetchHabits() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      ); 
      console.log(response.documents)
      setHabits(response.documents as Habit[]); 
    } catch (error) {
      console.error(error);
    }
  }

   async function fetchTodaysHabits() {
    try {
      const today = new Date()
      today.setHours(0,0,0,0);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? ""),
           Query.greaterThanEqual("completed_at", today.toISOString())]
      ); 
      const completions = response.documents as HabitCompletion[];
   
      setCompletedHabits(completions.map((c) => c.habit_id)); 
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDeleteHabit(id: string){
      try{
        await databases.deleteDocument(DATABASE_ID, HABITS_COLLECTION_ID, id);

      }catch(error){
        console.error(error)
      }
  }

  async function handleCompleteHabit(id: string) {
  if (!user) return;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDayISO = today.toISOString();

    // ✅ Query Appwrite directly to check if this habit is already completed today
    const existingCompletion = await databases.listDocuments(
      DATABASE_ID,
      COMPLETIONS_COLLECTION_ID,
      [
        Query.equal("user_id", user.$id),
        Query.equal("habit_id", id),
        Query.greaterThanEqual("completed_at", startOfDayISO),
      ]
    );

    if (existingCompletion.documents.length > 0) {
      console.log("Habit already completed today");
      return;
    }

    const currentDate = new Date().toISOString();

    await databases.createDocument(
      DATABASE_ID,
      COMPLETIONS_COLLECTION_ID,
      ID.unique(),
      {
        habit_id: id,
        user_id: user.$id,
        completed_at: currentDate,
      }
    );

    const habit = habits?.find((h) => h.$id === id);
    if (!habit) return;

    await databases.updateDocument(DATABASE_ID, HABITS_COLLECTION_ID, id, {
      streak_count: habit.streak_count + 1,
      last_completed: currentDate,
    });

    // Update local state to prevent further swipes until refresh
    setCompletedHabits((prev) => [...(prev ?? []), id]);

  } catch (error) {
    console.error("Error completing habit:", error);
  }
}
  function isHabitCompleted (habitId: string){
    return(completedHabits?.includes(habitId))
 }

function renderRightActions(habitId: string) {
  if (isHabitCompleted(habitId)) {
    return <Text style={{ color: "#fff" }}> Completed!</Text>;
  } else {
    return (
      <View style={styles.swipeActionRight}>
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={32}
          color="#fff"
        />
      </View>
    );
  }
}
  function renderLeftActions(){
    return(
      <View style={styles.swipeActionLeft}>
        <MaterialCommunityIcons 
          name="trash-can-outline" 
          size={32} 
          color="#fff" 
        />
      </View>
    )
  }
   return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          {" "}
          Today's Habits
        </Text>
        <Button mode="text" onPress={signOut} icon={"logout"}>
          Sign Out
        </Button>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {habits?.length === 0 ? (
          <View style={styles.emptyState}>
            {" "}
            <Text style={styles.emptyStateText}>
              {" "}
              No Habits yet. Add your first Habit!
            </Text>
          </View>
        ) : (
          habits?.map((habit, key) => (
            <Swipeable
              ref={(ref) => {
                swipeableRefs.current[habit.$id] = ref;
              }}
              key={key}
              overshootLeft={false}
              overshootRight={false}
              renderLeftActions={renderLeftActions}
              renderRightActions={() => renderRightActions(habit.$id)}
              onSwipeableOpen={(direction) => {
                if (direction === "left") {
                  handleDeleteHabit(habit.$id);
                } else if (direction === "right") {
                  handleCompleteHabit(habit.$id);
                }

                swipeableRefs.current[habit.$id]?.close();
              }}
            >
              <Surface
                style={[
                  styles.card,
                  isHabitCompleted(habit.$id) && styles.cardCompleted,
                ]}
                elevation={0}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}> {habit.title}</Text>
                  <Text style={styles.cardDescription}>
                    {" "}
                    {habit.description}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.streakBadge}>
                      <MaterialCommunityIcons
                        name="fire"
                        size={18}
                        color={"#ff9800"}
                      />
                      <Text style={styles.streakText}>
                        {habit.streak_count} day streak
                      </Text>
                    </View>
                    <View style={styles.frequencyBadge}>
                      <Text style={styles.frequencyText}>
                        {" "}
                        {habit.frequency.charAt(0).toUpperCase() +
                          habit.frequency.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Surface>
            </Swipeable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#f7f2fa",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#2223b",
  },
  cardDescription: {
    fontSize: 15,
    marginBottom: 16,
    color: "#6c6c80",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: {
    marginLeft: 6,
    color: "#ff9800",
    fontWeight: "bold",
    fontSize: 14,
  },
  frequencyBadge: {
    backgroundColor: "#ede7f6",
    borderRadius: 12,
    marginLeft: 160,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  frequencyText: {
    color: "#7c4dff",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    color: "#666666",
  },
  swipeActionLeft:{
    justifyContent:"center",
    alignItems: "flex-start",
    flex:1,
    backgroundColor: "#e53935",
    borderRadius:18,
    marginBottom:18,
    marginTop: 2,
    paddingLeft:16,

  },
  cardCompleted:{
    opacity:0.6
  },
  swipeActionRight:{
    justifyContent:"center",
    alignItems: "flex-end",
    flex:1,
    backgroundColor: "#4caf50",
    borderRadius:18,
    marginBottom:18,
    marginTop: 2,
    paddingRight:16,
    
  }
});