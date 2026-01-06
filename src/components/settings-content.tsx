
"use client";

import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { SlidersHorizontal, Database, Bell, Paintbrush, Computer, Calendar, Users, Lock, Info, Globe, ThumbsUp, ChevronRight, Edit, KeyRound, ShieldCheck, BadgeCheck } from "lucide-react";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { Avatar, AvatarFallback } from "./ui/avatar";
import Link from "next/link";
import { Separator } from "./ui/separator";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";

const SettingsItem = ({ icon, label, href, value }: { icon: React.ReactNode; label: string; href: string; value?: string }) => (
    <Link href={href} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
            {icon}
            <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
            {value && <span className="text-sm">{value}</span>}
            <ChevronRight className="h-5 w-5" />
        </div>
    </Link>
);


export function SettingsContent() {
    const { theme } = useTheme();
    const { user } = useAuth(); // Use auth hook for current user ID
    const [userName, setUserName] = useState("Guest");
    const [userHandle, setUserHandle] = useState("");
    const [userStatus, setUserStatus] = useState("Using SearnAI");
    const [counts, setCounts] = useState({ followers: 0, following: 0 });

    useEffect(() => {
        // 1. Get basic info from local storage (fallback)
        try {
            const storedName = localStorage.getItem("userName");
            const storedStatus = localStorage.getItem("userStatus");
            if (storedName) setUserName(storedName);
            if (storedStatus) setUserStatus(storedStatus);
        } catch (e) {
            console.warn("Could not access localStorage for user settings.");
        }

        // 2. Listen to Firestore for real-time counts if user is logged in
        if (user) {
            const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    setCounts({
                        followers: data.followerCount || 0,
                        following: data.followingCount || 0
                    });
                    // Also update name/status if available to keep in sync
                    if (data.name) setUserName(data.name);
                    if (data.username) setUserHandle(data.username.startsWith('@') ? data.username : `@${data.username}`);
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    return (
        <div className="flex flex-col h-full bg-muted/40">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="lg:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-2xl space-y-8">

                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                                <AvatarFallback className="bg-avatar-accent text-3xl font-bold text-white/90">
                                    {userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <Link href="/settings/personalize">
                                <Button variant="outline" size="icon" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 bg-background">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1.5">
                                <h2 className="text-2xl font-bold leading-none">{userName}</h2>
                                <BadgeCheck className="h-5 w-5 text-primary fill-primary/10" />
                            </div>
                            {userHandle && <p className="text-sm text-primary font-medium">{userHandle}</p>}
                        </div>
                        <p className="text-muted-foreground mt-2 mb-4">{userStatus}</p>

                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-lg">{counts.followers}</span>
                                <span className="text-muted-foreground">Followers</span>
                            </div>
                            <div className="h-8 w-[1px] bg-border" />
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-lg">{counts.following}</span>
                                <span className="text-muted-foreground">Following</span>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-2">
                            <SettingsItem icon={<SlidersHorizontal className="h-5 w-5 text-muted-foreground" />} label="Personalize" href="/settings/personalize" />
                            <Separator />
                            <SettingsItem icon={<Paintbrush className="h-5 w-5 text-muted-foreground" />} label="Appearance" href="/settings/appearance" />
                            <Separator />
                            <SettingsItem icon={<Database className="h-5 w-5 text-muted-foreground" />} label="Data & Storage" href="/settings/data" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-2">
                            <SettingsItem icon={<Bell className="h-5 w-5 text-muted-foreground" />} label="Notifications" href="/settings/notifications" />
                            <Separator />
                            <SettingsItem icon={<Lock className="h-5 w-5 text-muted-foreground" />} label="Security & Privacy" href="/settings/security" />
                            <Separator />
                            <SettingsItem icon={<ShieldCheck className="h-5 w-5 text-muted-foreground" />} label="App Permissions" href="/settings/permissions" />
                            <Separator />
                            <SettingsItem icon={<Users className="h-5 w-5 text-muted-foreground" />} label="Accounts" href="/settings/accounts" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Developer</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 pt-0">
                            <SettingsItem icon={<KeyRound className="h-5 w-5 text-muted-foreground" />} label="API Keys" href="/settings/api" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-2">
                            <SettingsItem icon={<Globe className="h-5 w-5 text-muted-foreground" />} label="Language" value="English" href="/settings/language" />
                            <Separator />
                            <SettingsItem icon={<ThumbsUp className="h-5 w-5 text-muted-foreground" />} label="Feedback" href="/settings/feedback" />
                            <Separator />
                            <SettingsItem icon={<Info className="h-5 w-5 text-muted-foreground" />} label="About Us" href="/about" />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
