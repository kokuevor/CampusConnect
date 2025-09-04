"use client";

import type React from "react";
import { useApp } from "@/lib/app-context";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Users, Truck, Loader2, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Simple theme toggle for auth pages
function SimpleThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const savedTheme = localStorage.getItem("campusconnect-theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.add("light");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
    localStorage.setItem("campusconnect-theme", newTheme);
    setIsDark(!isDark);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export default function SignInPage() {
  const { dispatch, state } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  // Check if user is already authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      router.push("/dashboard");
    }
  }, [state.isAuthenticated, state.user, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting signin with:", email);

      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      console.log("Signin response:", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || "Sign in failed");
      }

      // Store user data in context
      dispatch({ type: "SET_USER", payload: data.user });
      console.log("User data stored in context:", data.user);

      // Redirect to dashboard immediately
      console.log("Redirecting to dashboard...");
      router.push("/dashboard");
      console.log("Redirect initiated");
    } catch (error) {
      console.error("Sign in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Sign in failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Theme Toggle */}
        <div className="flex justify-end">
          <SimpleThemeToggle />
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-primary rounded-lg p-2">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              CampusConnect
            </h1>
          </div>
          <p className="text-muted-foreground">
            Connect with fellow students for safe deliveries
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your student delivery network
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert className="mb-4">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">University Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@st.knust.edu.gh"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === "development" && (
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                  <p>Debug Info:</p>
                  <p>Email: {email}</p>
                  <p>Password Length: {password.length}</p>
                  <p>Loading: {isLoading ? "Yes" : "No"}</p>
                  <p>Error: {error || "None"}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Test button - remove in production */}
              {process.env.NODE_ENV === "development" && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    console.log("Test: Manual redirect to dashboard");
                    router.push("/dashboard");
                  }}
                >
                  Test: Go to Dashboard
                </Button>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-primary hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <Shield className="h-8 w-8 text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Verified Students</p>
          </div>
          <div className="space-y-2">
            <Users className="h-8 w-8 text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Trusted Community</p>
          </div>
          <div className="space-y-2">
            <Truck className="h-8 w-8 text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Safe Deliveries</p>
          </div>
        </div>
      </div>
    </div>
  );
}
