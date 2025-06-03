import { KeyboardAvoidingView, Platform, View, StyleSheet } from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {useRouter} from "expo-router"

export default function AuthScreen() {
  const theme = useTheme(); // added to access theme.colors.error

  const [isSignUp, setIsSignup] = useState<boolean>(false); // state holds a boolean
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null); // initialized with null

  const { signIn, signUp } = useAuth();

  function handleSwitchMode() {
    setIsSignup((prev) => !prev);
    setError(null); // clear errors when switching mode (optional)
  }

  async function handleAuth() {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Passwords must be at least 6 characters long");
      return;
    }

    setError(null);

    if (isSignUp){
      const error = await signUp(email, password)
        if (error){
          setError(error);
          return;
        }
    }else{
      const error = await signIn(email, password)
      if (error) {
        setError(error);
        return
      }
      //router.replace("/")
    }
    
  }

  return (

    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title} variant="headlineMedium">
          {isSignUp ? "Create Account" : "Sign In"}
        </Text>
        <TextInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          mode="outlined"
          style={styles.input}
          onChangeText={setEmail}
          value={email}
        />
        <TextInput
          label="Password"
          autoCapitalize="none"
          secureTextEntry
          mode="outlined"
          style={styles.input}
          onChangeText={setPassword}
          value={password}
        />

        {error && (
          <Text style={{ color: theme.colors.error, marginBottom: 16 }}>
            {error}
          </Text>
        )}

        <Button mode="contained" style={styles.button} onPress={handleAuth}>
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        <Button
          mode="text"
          onPress={handleSwitchMode}
          style={styles.switchModeButton}
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // fixed typo: backgroudColor → backgroundColor
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: {
    textAlign: "center", // fixed typo: textalign → textAlign
    marginBottom: 24,
  },
  input: {
    marginTop: 8,
    marginBottom: 16, // fixed typo marginBootm → marginBottom
  },
  button: {
    // styles if you want
  },
  switchModeButton: {
    marginTop: 16, // fixed typo SiwtchmodeBuittom → switchModeButton
  },
});
