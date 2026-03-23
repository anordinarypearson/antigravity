
"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { User, Save,  AtSign } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

export function SettingsPersonalizeContent() {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // Load initial data from local storage
        try {
            const storedName = localStorage.getItem("userName");
            const storedStatus = localStorage.getItem("userStatus");
            if (storedName) setName(storedName);
            if (storedStatus) setStatus(storedStatus);
        } catch (e) {
            console.warn("Could not access localStorage.");
        }

        // Load data from Firestore if user is present
        const fetchUserData = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.name) setName(data.name);
                    if (data.username) setUsername(data.username.replace('@', ''));
                    if (data.status) setStatus(data.status);
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            }
        };

        fetchUserData();
    }, [user]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // Save to Local Storage (Legacy/Fallback)
            localStorage.setItem("userName", name || "Guest");
            localStorage.setItem("userStatus", status || "Using SearnAI");

            // Save to Firestore
            if (user) {
                const cleanUsername = username.trim().toLowerCase().replace('@', '');
                const finalUsername = `@${cleanUsername}`;

                // Only check uniqueness if the username has changed
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                const currentData = docSnap.data();

                if (cleanUsername && currentData?.username !== finalUsername) {
                    // Check Uniqueness
                    const q = query(collection(db, "users"), where("username", "==", finalUsername));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        toast({
                            title: "Username Taken",
                            description: "Please choose another handle.",
                            variant: "destructive",
                        });
                        setIsLoading(false);
                        return;
                    }
                }

                await updateDoc(docRef, {
                    name: name,
                    username: cleanUsername ? finalUsername : currentData?.username,
                    status: status,
                    updatedAt: new Date()
                });
            }

            toast({
                title: "Profile Saved!",
                description: "Your personalization settings have been updated.",
            });
        } catch (e) {
            console.error("Error saving profile:", e);
            toast({
                title: "Error Saving",
                description: "Could not save settings.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-muted/40">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="lg:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">Personalize</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-2xl space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Profile</CardTitle>
                            <CardDescription>Manage your identity across the platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Alex Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Handle (@username)</Label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pl-9"
                                        placeholder="your_handle"
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground">This is how people find you to message or follow.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Bio / Status</Label>
                                <Input id="status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="What are you working on?" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
                                {isLoading ? <WavyLoader className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Profile
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
