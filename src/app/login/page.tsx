"use client";
import { LoginContent } from "@/components/login-content";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  // Render login page only if not loading and no user
  return !user ? <LoginContent /> : null;
}
