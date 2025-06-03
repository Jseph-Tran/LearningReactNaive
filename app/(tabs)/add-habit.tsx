import { router } from "expo-router";
import React, { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { ID } from "react-native-appwrite";
import { TextInput, SegmentedButtons, Button } from "react-native-paper";
import { useTheme } from "react-native-paper"; // Missing import
import { useAuth } from "@/lib/auth-context"; 
import {databases} from "@/lib/appwrite";
import { DATABASE_ID, HABITS_COLLECTION_ID } from "@/lib/appwrite";

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCIES)[number];

export default function AddHabitScreen() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("daily");
  const { user } = useAuth();
  const [error, setError] = useState<string>(""); // fixed variable name, type, and hook spelling
  const theme = useTheme();

  async function handleSubmit() {
    if (!user) return;

    try {
      await databases.createDocument(
        DATABASE_ID, 
        HABITS_COLLECTION_ID,
        ID.unique(), // fixed typo "uqeine"
        {
          user_id: user.$id,
          title,
          description,
          frequency, // fixed typo "freuqncy"
          streak_count: 0,
          last_completed: new Date().toISOString(), 
          created_at: new Date().toISOString(), // fixed "new DataView().toISOSI TimeRanges()" to proper Date
        }
      );
      
      router.back();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message); 
        return;
      }
      setError("There was an error creating the habit."); // fixed call to SpeechSynthesisErrorEvent
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        label="Title"
        mode="outlined"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        label="Description"
        mode="outlined"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />

      <SegmentedButtons
        value={frequency}
        onValueChange={(value) => setFrequency(value as Frequency)}
        buttons={FREQUENCIES.map((freq) => ({
          value: freq,
          label: freq.charAt(0).toUpperCase() + freq.slice(1),
        }))}
        style={styles.frequencyContainer}
      />

      <Button
        mode="contained"
        disabled={!title || !description}
        onPress={handleSubmit}
        style={styles.button}
      >
        Add Habit
      </Button>
      {error && (
        <Text style={{ color: theme.colors.error, marginBottom: 16 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  input: {
    marginBottom: 16,
  },
  frequencyContainer: {
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
  },
});
