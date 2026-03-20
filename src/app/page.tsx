"use client";

import { MainLayout } from "@/components/main-layout";
import { MainDashboard } from "@/components/main-dashboard";
import { LoginContent } from "@/components/login-content";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// SVG logo reused from login-content for consistency
const AppLogo = () => (
  <svg
    className="h-20 w-20 text-primary loading-screen-logo"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M50 5L90 28V72L50 95L10 72V28L50 5Z"
      fill="currentColor"
      className="opacity-10"
    />
    <path
      d="M63 40.5C63 36.3579 59.6421 33 55.5 33H44.5C40.3579 33 37 36.3579 37 40.5V43.5C37 47.6421 40.3579 51 44.5 51H55.5C59.6421 51 63 54.3579 63 58.5V61.5C63 65.6421 59.6421 69 55.5 69H44.5C40.3579 69 37 65.6421 37 61.5"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    />
  </svg>
);

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Subtle radial glow behind logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <AppLogo />

        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-semibold loading-screen-text tracking-wide">
            Preparing Sun AI for you
          </p>

          {/* Bouncing dots */}
          <div className="flex items-center gap-1.5">
            <span className="loading-dot h-2 w-2 rounded-full bg-primary/60" />
            <span className="loading-dot h-2 w-2 rounded-full bg-primary/60" />
            <span className="loading-dot h-2 w-2 rounded-full bg-primary/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();

  if (loading) {
    return <LoadingScreen />;
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
