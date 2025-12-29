"use client";

import { MainLayout } from "@/components/main-layout";
import { MainDashboard } from "@/components/main-dashboard";
import { LoginContent } from "@/components/login-content";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();

  // Redirect to home if user logs in (handled by state change re-rendering)

  if (loading) {
    return null; // Return nothing while loading to avoid the "spinner" visual
  }

  if (!user && !isGuest) {
    return <LoginContent />;
  }

  return (
    <MainLayout>
      <MainDashboard />
    </MainLayout>
  );
}
