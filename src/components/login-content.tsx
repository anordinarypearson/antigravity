"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Social provider icons as SVG components
const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const FacebookIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const TwitterIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const GithubIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
);

const AppLogo = () => (
    <svg
        className="h-14 w-14 text-primary"
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

export function LoginContent() {
    const { signInWithEmail, sendPasswordReset, signInWithGoogle, signInWithGithub, signInWithFacebook, signInWithTwitter } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 5 },
        visible: { opacity: 1, y: 0 }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await signInWithEmail(email, password);
            router.push('/');
        } catch (err: any) {
            setError(err.message || "Failed to sign in");
            setIsLoading(false);
        }
    }

    const handleResetPassword = async () => {
        if (!email) {
            setError("Please enter your email first to reset password");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await sendPasswordReset(email);
            setSuccessMessage("Password reset email sent.");
        } catch (err: any) {
            setError(err.message || "Failed to send reset email");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialSignIn = async (provider: 'google' | 'facebook' | 'twitter' | 'github') => {
        setSocialLoading(provider);
        setError(null);
        try {
            let result;
            switch (provider) {
                case 'google':
                    result = await signInWithGoogle();
                    break;
                case 'facebook':
                    result = await signInWithFacebook();
                    break;
                case 'twitter':
                    result = await signInWithTwitter();
                    break;
                case 'github':
                    result = await signInWithGithub();
                    break;
            }
            if (result) {
                // Small delay to ensure auth state is updated before navigation
                await new Promise(resolve => setTimeout(resolve, 500));
                router.push('/');
            } else {
                setError(`Failed to sign in with ${provider}`);
            }
        } catch (err: any) {
            // Silently ignore if user closed the popup
            if (err.code === 'auth/popup-closed-by-user') {
                return;
            }
            setError(err.message || `Failed to sign in with ${provider}`);
        } finally {
            setSocialLoading(null);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-[400px] z-10"
            >
                <Card className="border-border shadow-md bg-card">
                    <CardHeader className="text-center space-y-4 pt-8 pb-6">
                        <motion.div variants={itemVariants} className="flex justify-center">
                            <AppLogo />
                        </motion.div>
                        <div className="space-y-1">
                            <motion.div variants={itemVariants}>
                                <CardTitle className="text-2xl font-bold tracking-tight">
                                    Sign In
                                </CardTitle>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <CardDescription className="text-muted-foreground">
                                    Continue to your account
                                </CardDescription>
                            </motion.div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 px-6 pb-8">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-3"
                                >
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p>{error}</p>
                                </motion.div>
                            )}
                            {successMessage && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-primary/10 border border-primary/20 text-primary text-sm p-3 rounded-lg flex items-center gap-3"
                                >
                                    <p>{successMessage}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div variants={itemVariants} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 relative"
                                    onClick={() => handleSocialSignIn('google')}
                                    disabled={socialLoading !== null}
                                >
                                    {socialLoading === 'google' ? (
                                        <WavyLoader className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <GoogleIcon />
                                            <span className="ml-2 text-sm">Google</span>
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 relative"
                                    onClick={() => handleSocialSignIn('facebook')}
                                    disabled={socialLoading !== null}
                                >
                                    {socialLoading === 'facebook' ? (
                                        <WavyLoader className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <FacebookIcon />
                                            <span className="ml-2 text-sm">Facebook</span>
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 relative"
                                    onClick={() => handleSocialSignIn('twitter')}
                                    disabled={socialLoading !== null}
                                >
                                    {socialLoading === 'twitter' ? (
                                        <WavyLoader className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <TwitterIcon />
                                            <span className="ml-2 text-sm">Twitter</span>
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 relative"
                                    onClick={() => handleSocialSignIn('github')}
                                    disabled={socialLoading !== null}
                                >
                                    {socialLoading === 'github' ? (
                                        <WavyLoader className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <GithubIcon />
                                            <span className="ml-2 text-sm">GitHub</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                            </div>
                        </motion.div>

                        <form onSubmit={handleEmailSignIn} className="space-y-4">
                            <motion.div variants={itemVariants} className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-10 pl-9 rounded-md"
                                    />
                                </div>
                            </motion.div>
                            <motion.div variants={itemVariants} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password">Password</Label>
                                    <button
                                        type="button"
                                        className="text-xs text-primary hover:underline"
                                        onClick={handleResetPassword}
                                    >
                                        Forgot?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-10 pl-9 pr-10 rounded-md"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </motion.div>
                            <motion.div variants={itemVariants} className="pt-2">
                                <Button
                                    type="submit"
                                    className="w-full h-10 rounded-md"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <WavyLoader className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <div className="flex items-center">
                                            <span>Sign In</span>
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </div>
                                    )}
                                </Button>
                            </motion.div>
                        </form>

                        <motion.div variants={itemVariants} className="text-center pt-2">
                            <p className="text-sm text-muted-foreground">
                                Don't have an account?{" "}
                                <Link href="/signup" className="text-primary font-semibold hover:underline">
                                    Sign up
                                </Link>
                            </p>
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
