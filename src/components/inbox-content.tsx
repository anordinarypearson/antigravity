"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { SidebarTrigger } from "./ui/sidebar";
import { BackButton } from "./back-button";
import { Send, Search, Loader2, MessageSquare, Plus, Check, CheckCheck, BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { writeBatch } from "firebase/firestore";

type Chat = {
    id: string;
    participants: string[];
    lastMessage?: string;
    lastMessageTimestamp?: any;
    updatedAt?: any;
    otherUser?: {
        name: string;
        avatar: string;
        username?: string;
    };
};

type Message = {
    id: string;
    senderId: string;
    text: string;
    createdAt: any;
    read?: boolean;
};

type User = {
    id: string;
    name: string;
    username?: string;
    avatar: string;
};

export function InboxContent() {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // New Chat Dialog State
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [friends, setFriends] = useState<User[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(false);

    // Fetch Chats
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", currentUser.uid),
            orderBy("updatedAt", "desc")
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const chatsData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
                const data = chatDoc.data();
                const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);

                let otherUser = { name: "Unknown", avatar: "", username: "" };
                if (otherUserId) {
                    const userDoc = await getDoc(doc(db, "users", otherUserId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        otherUser = {
                            name: userData.name || userData.displayName || "Anonymous",
                            avatar: userData.photoURL || "",
                            username: userData.username
                        };
                    }
                }

                return {
                    id: chatDoc.id,
                    ...data,
                    otherUser
                } as Chat;
            }));

            setChats(chatsData);
            setLoadingChats(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Handle incoming navigation from Friends page
    useEffect(() => {
        const autoStartChat = async () => {
            const searchParams = new URLSearchParams(window.location.search);
            const userIdToChat = searchParams.get('userId');

            if (userIdToChat && currentUser && !loadingChats) {
                await startNewChat(userIdToChat);
                // Optional: clean up URL
                window.history.replaceState({}, '', '/inbox');
            }
        };

        autoStartChat();
    }, [currentUser, loadingChats]);

    // Fetch Messages for Selected Chat
    useEffect(() => {
        if (!selectedChatId || !currentUser) return;

        const q = query(
            collection(db, "chats", selectedChatId, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(msgs);

            // Mark unseen messages as read
            const unreadMessages = snapshot.docs.filter(doc => {
                const data = doc.data();
                return data.senderId !== currentUser.uid && !data.read;
            });

            if (unreadMessages.length > 0) {
                const batch = writeBatch(db);
                unreadMessages.forEach(msgDoc => {
                    batch.update(msgDoc.ref, { read: true });
                });
                batch.commit().catch(err => console.error("Error marking as read:", err));
            }

            // Scroll to bottom
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        });

        return () => unsubscribe();
    }, [selectedChatId, currentUser]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !selectedChatId) return;

        const text = newMessage.trim();
        setNewMessage("");

        try {
            await addDoc(collection(db, "chats", selectedChatId, "messages"), {
                senderId: currentUser.uid,
                text: text,
                createdAt: serverTimestamp(),
                read: false
            });

            await updateDoc(doc(db, "chats", selectedChatId), {
                lastMessage: text,
                updatedAt: serverTimestamp(),
                lastMessageTimestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending message:", error);
            toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
        }
    };

    const fetchFriends = async () => {
        if (!currentUser) return;
        setLoadingFriends(true);
        try {
            // Ideally we query the 'following' subcollection, then get user details
            const friendsSnapshot = await getDocs(collection(db, "users", currentUser.uid, "following"));
            const friendsList = await Promise.all(
                friendsSnapshot.docs.map(async (friendDoc) => {
                    const userDoc = await getDoc(doc(db, "users", friendDoc.id));
                    const userData = userDoc.data();
                    return {
                        id: friendDoc.id,
                        name: userData?.name || userData?.displayName || "Anonymous",
                        username: userData?.username,
                        avatar: userData?.photoURL || ""
                    };
                })
            );
            setFriends(friendsList);
        } catch (error) {
            console.error("Error fetching friends:", error);
        } finally {
            setLoadingFriends(false);
        }
    };

    const startNewChat = async (friendId: string) => {
        if (!currentUser) return;

        try {
            // Check if chat already exists
            // Note: simple check, ideally we use a composite ID or more complex query
            // logic here: assume 1:1 chat.
            // For now, we'll create a new one or find existing if possible.
            // A common pattern is to use sorted IDs for doc ID: `uid1_uid2`
            const participants = [currentUser.uid, friendId].sort();
            const chatId = participants.join("_");
            const chatDocRef = doc(db, "chats", chatId);
            const chatDoc = await getDoc(chatDocRef);

            if (!chatDoc.exists()) {
                await setDoc(chatDocRef, {
                    participants: participants,
                    updatedAt: serverTimestamp(),
                    createdAt: serverTimestamp()
                });
            }

            setSelectedChatId(chatId);
            setIsNewChatOpen(false);
        } catch (error) {
            console.error("Error starting chat:", error);
            toast({ title: "Error", description: "Could not start chat", variant: "destructive" });
        }
    };

    return (
        <div className="flex flex-col h-full bg-muted/40">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="lg:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">Inbox</h1>
                </div>
                <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={fetchFriends}>
                            <Plus className="h-4 w-4 mr-2" /> New Chat
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Message</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {loadingFriends ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : friends.length === 0 ? (
                                <p className="text-center text-muted-foreground">No friends found. Add some friends first!</p>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {friends.map(friend => (
                                        <button
                                            key={friend.id}
                                            className="flex items-center gap-3 w-full p-2 hover:bg-muted rounded-lg transition-colors text-left"
                                            onClick={() => startNewChat(friend.id)}
                                        >
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={friend.avatar} />
                                                <AvatarFallback>{friend.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <div className="font-medium">{friend.name}</div>
                                                    <BadgeCheck className="h-3.5 w-3.5 text-primary fill-primary/10" />
                                                </div>
                                                <div className="text-xs text-muted-foreground mr-2">{friend.username}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </header>

            <main className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8 flex gap-6">
                {/* Chat List */}
                <Card className={`w-full md:w-1/3 flex flex-col ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search messages..." className="pl-8" />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        {loadingChats ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : chats.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">
                                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>No conversations yet.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {chats.map(chat => (
                                    <button
                                        key={chat.id}
                                        onClick={() => setSelectedChatId(chat.id)}
                                        className={`flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 border-b last:border-0 ${selectedChatId === chat.id ? 'bg-muted' : ''}`}
                                    >
                                        <Avatar>
                                            <AvatarImage src={chat.otherUser?.avatar} />
                                            <AvatarFallback>{chat.otherUser?.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <div className="flex items-center gap-1 min-w-0 pr-2">
                                                    <span className="font-semibold truncate">{chat.otherUser?.name}</span>
                                                    <BadgeCheck className="h-3.5 w-3.5 text-primary fill-primary/10 shrink-0" />
                                                </div>
                                                {chat.lastMessageTimestamp && (
                                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                                        {formatDistanceToNow(chat.lastMessageTimestamp.toDate ? chat.lastMessageTimestamp.toDate() : new Date(), { addSuffix: true })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage || "No messages yet"}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </Card>

                {/* Chat View */}
                {selectedChatId ? (
                    <Card className={`w-full md:w-2/3 flex flex-col ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                        {/* Chat Header for Mobile */}
                        <div className="md:hidden flex items-center p-4 border-b">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedChatId(null)} className="mr-2">
                                <BackIcon />
                            </Button>
                            <div className="flex items-center gap-1 font-semibold">
                                {chats.find(c => c.id === selectedChatId)?.otherUser?.name}
                                <BadgeCheck className="h-4 w-4 text-primary fill-primary/10" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.map((msg) => {
                                const isMe = msg.senderId === currentUser?.uid;
                                const date = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                            <div className={`rounded-lg p-3 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                <p className="text-sm">{msg.text}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 px-1">
                                                <span className="text-[10px] text-muted-foreground opacity-70">
                                                    {format(date, 'h:mm a')}
                                                </span>
                                                {isMe && (
                                                    msg.read ? (
                                                        <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                                                            <CheckCheck className="h-3 w-3" /> Seen
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                                            <Check className="h-3 w-3" /> Sent
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-4 border-t">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </Card>
                ) : (
                    <div className="hidden md:flex w-2/3 items-center justify-center text-muted-foreground p-8 bg-muted/20 rounded-lg border-2 border-dashed">
                        <div className="text-center">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>Select a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function BackIcon() {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M6.85355 3.14645C7.04882 3.34171 7.04882 3.65829 6.85355 3.85355L3.70711 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H3.70711L6.85355 11.1464C7.04882 11.3417 7.04882 11.6583 6.85355 11.8536C6.65829 12.0488 6.34171 12.0488 6.14645 11.8536L2.14645 7.85355C1.95118 7.65829 1.95118 7.34171 2.14645 7.14645L6.14645 3.14645C6.34171 2.95118 6.65829 2.95118 6.85355 3.14645Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
            ></path>
        </svg>
    );
}
