
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.599-1.521,12.455-4.112l-6.46-4.853C28.205,35.66,26.214,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.46,4.853C39.818,34.426,44,29.564,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

const AppLogo = () => (
    <svg
        className="h-12 w-12"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#6366f1", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#a855f7", stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        <path
            d="M50 2.88675L93.3013 26.4434V73.5566L50 97.1132L6.69873 73.5566V26.4434L50 2.88675Z"
            fill="url(#logoGradient)"
        />
        <path
            d="M63 40.5C63 36.3579 59.6421 33 55.5 33H44.5C40.3579 33 37 36.3579 37 40.5V43.5C37 47.6421 40.3579 51 44.5 51H55.5C59.6421 51 63 54.3579 63 58.5V61.5C63 65.6421 59.6421 69 55.5 69H44.5C40.3579 69 37 65.6421 37 61.5"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export function LoginContent() {
    const { signInWithGoogle } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        const user = await signInWithGoogle();
        if (user) {
            router.push('/');
        } else {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 p-4">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-violet-400/30 to-purple-600/30 blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-fuchsia-400/30 to-pink-600/30 blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-600/20 blur-3xl animate-pulse delay-500" />
            </div>

            {/* Main Card */}
            <Card className="relative w-full max-w-md border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10">
                <CardHeader className="text-center space-y-3 pb-8">
                    <div className="flex justify-center items-center gap-3 mb-2">
                        <div className="relative">
                            <AppLogo />
                            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
                        </div>
                    </div>
                    <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                        SearnAI
                    </CardTitle>
                    <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                        Your AI-powered study companion ✨
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-8 pb-8">
                    <Button
                        onClick={handleGoogleSignIn}
                        variant="outline"
                        className="group relative w-full h-12 text-base font-semibold border-2 border-gray-200 dark:border-gray-700 hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all duration-300 overflow-hidden"
                        disabled={isLoading}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-purple-500/0 to-fuchsia-500/0 group-hover:from-violet-500/10 group-hover:via-purple-500/10 group-hover:to-fuchsia-500/10 transition-all duration-300" />
                        <span className="relative flex items-center justify-center gap-2">
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
                            Continue with Google
                        </span>
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Email login is temporarily disabled.
                    </p>

                    <div className="pt-4 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            By signing in, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>
                </CardContent>
            </Card>

            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .animate-pulse {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .delay-500 {
                    animation-delay: 0.5s;
                }
                .delay-1000 {
                    animation-delay: 1s;
                }
            `}</style>
        </div>
    );
}
