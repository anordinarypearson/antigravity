
"use client";

import { useState, useEffect } from "react";
import { Users, Search, MessageSquare } from "lucide-react";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, runTransaction, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type User = {
    id: string;
    name: string;
    username?: string; // Added username
    avatar: string;
    isFollowing: boolean;
    followerCount: number;
    aiHint?: string;
};

const FriendCard = ({ user, onFollowToggle, onMessage, isLoading }: { user: User, onFollowToggle: (userId: string, isFollowing: boolean) => void, onMessage: (userId: string) => void, isLoading: boolean }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint={user.aiHint} />
            <AvatarFallback>{user.name ? user.name.charAt(0) : '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-semibold">{user.name || 'Anonymous User'}</div>
                    <div className="text-xs text-muted-foreground">{user.username || '@unknown'}</div>
                    {user.followerCount > 0 && <div className="text-xs text-muted-foreground mt-0.5">{user.followerCount} {user.followerCount === 1 ? 'follower' : 'followers'}</div>}
                </div>
                <div className="flex items-center gap-2">
                    {user.isFollowing && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => onMessage(user.id)}
                            title="Message"
                        >
                            <MessageSquare className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant={user.isFollowing ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => onFollowToggle(user.id, user.isFollowing)}
                        disabled={isLoading}
                    >
                        {user.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                </div>
            </div>
        </div>
    </div>
);


export function FriendsContent() {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUser) return;

            setLoading(true);
            try {
                const usersSnapshot = await getDocs(collection(db, "users"));
                const usersList = await Promise.all(
                    usersSnapshot.docs
                        .filter(userDoc => userDoc.id !== currentUser.uid) // Exclude current user
                        .map(async (userDoc) => {
                            const userData = userDoc.data();
                            const followDocRef = doc(db, "users", currentUser.uid, "following", userDoc.id);
                            const followDoc = await getDoc(followDocRef);

                            return {
                                id: userDoc.id,
                                name: userData.name || userData.displayName || "Anonymous",
                                username: userData.username, // Map username
                                avatar: userData.photoURL || `https://placehold.co/40x40.png`,
                                isFollowing: followDoc.exists(),
                                followerCount: userData.followerCount || 0,
                                aiHint: "profile picture"
                            };
                        })
                );
                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users: ", error);
                toast({
                    title: "Error",
                    description: "Could not fetch users. Please try again later.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchUsers();
        }
    }, [currentUser, toast]);

    const router = useRouter();

    const handleMessage = (userId: string) => {
        router.push(`/inbox?userId=${userId}`);
    };

    const handleFollowToggle = async (userIdToToggle: string, isCurrentlyFollowing: boolean) => {
        if (!currentUser) return;

        setFollowLoading(prev => ({ ...prev, [userIdToToggle]: true }));

        const currentUserDocRef = doc(db, "users", currentUser.uid);
        const userToToggleDocRef = doc(db, "users", userIdToToggle);
        const followingDocRef = doc(currentUserDocRef, "following", userIdToToggle);
        const followerDocRef = doc(userToToggleDocRef, "followers", currentUser.uid);

        try {
            await runTransaction(db, async (transaction) => {
                if (isCurrentlyFollowing) {
                    // Unfollow
                    transaction.delete(followingDocRef);
                    transaction.delete(followerDocRef);
                    transaction.update(currentUserDocRef, { followingCount: increment(-1) });
                    transaction.update(userToToggleDocRef, { followerCount: increment(-1) });
                } else {
                    // Follow
                    transaction.set(followingDocRef, { followedAt: new Date() });
                    transaction.set(followerDocRef, { followerAt: new Date() });
                    transaction.update(currentUserDocRef, { followingCount: increment(1) });
                    transaction.update(userToToggleDocRef, { followerCount: increment(1) });
                }
            });

            toast({ title: isCurrentlyFollowing ? "Unfollowed" : "Followed!", description: `Your follow status has been updated.` });

            // Update UI instantly
            setUsers(prevUsers => prevUsers.map(u =>
                u.id === userIdToToggle ? { ...u, isFollowing: !isCurrentlyFollowing, followerCount: u.followerCount + (isCurrentlyFollowing ? -1 : 1) } : u
            ));

        } catch (error) {
            console.error("Error updating follow status: ", error);
            toast({ title: "Error", description: "Could not update follow status.", variant: "destructive" });
        } finally {
            setFollowLoading(prev => ({ ...prev, [userIdToToggle]: false }));
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const friends = filteredUsers.filter(user => user.isFollowing);
    const explore = filteredUsers.filter(user => !user.isFollowing);

    return (
        <div className="flex flex-col h-full bg-muted/40">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="lg:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">Friends</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-4xl space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Connect with Friends</h1>
                            <p className="text-muted-foreground mt-1">Manage your connections and discover new people.</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search for users..."
                            className="w-full pl-10 h-11 bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Tabs defaultValue="explore" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                            <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
                            <TabsTrigger value="explore">Explore ({explore.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="friends" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Your Friends</CardTitle>
                                    <CardDescription>People you follow.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4">
                                    {loading ? (
                                        <div className="flex justify-center items-center h-40">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : friends.length === 0 ? (
                                        <div className="text-center text-muted-foreground p-12 bg-muted/20 rounded-lg border-2 border-dashed">
                                            <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                            <p>No friends found matching your search.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {friends.map(user => (
                                                <FriendCard
                                                    key={user.id}
                                                    user={user}
                                                    onFollowToggle={handleFollowToggle}
                                                    onMessage={handleMessage}
                                                    isLoading={followLoading[user.id] || false}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="explore" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Explore</CardTitle>
                                    <CardDescription>Discover new people to connect with.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4">
                                    {loading ? (
                                        <div className="flex justify-center items-center h-40">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : explore.length === 0 ? (
                                        <div className="text-center text-muted-foreground p-12 bg-muted/20 rounded-lg border-2 border-dashed">
                                            <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                            <p>No new users found matching your search.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {explore.map(user => (
                                                <FriendCard
                                                    key={user.id}
                                                    user={user}
                                                    onFollowToggle={handleFollowToggle}
                                                    onMessage={handleMessage}
                                                    isLoading={followLoading[user.id] || false}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
