"use client";
import { LoginContent } from "@/components/login-content";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthShowcase } from "@/components/auth-showcase";
import { motion } from "framer-motion";

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

  if (user) return null;

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Left Side - Showcase (Desktop Only) */}
      <div className="hidden lg:block relative h-full">
        <AuthShowcase />
      </div>

      {/* Right Side - Auth Form */}
      <div className="h-full w-full flex items-center justify-center p-4 lg:p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px]"
        >
          <LoginContent />
        </motion.div>
      </div>
    </div>
  );
}
