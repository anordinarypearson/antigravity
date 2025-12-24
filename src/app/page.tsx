
"use client";

import { MainLayout } from "@/components/main-layout";
import { MainDashboard } from "@/components/main-dashboard";
// TEMPORARILY DISABLED: Authentication requirement
// import { useAuth } from "@/hooks/use-auth";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";
// import { Loader2 } from "lucide-react";

export default function Home() {
  // TEMPORARILY DISABLED: Authentication check
  // const { user, loading } = useAuth();
  // const router = useRouter();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/login');
  //   }
  // }, [user, loading, router]);

  // if (loading || !user) {
  //   return (
  //      <div className="flex h-screen w-full items-center justify-center">
  //         <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>
  //   );
  // }

  return (
    <MainLayout>
      <MainDashboard />
    </MainLayout>
  );
}
