"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Heart, MessageCircle, X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type NotificationType = "friend_request" | "follow" | "like" | "message";

interface Notification {
    id: string;
    type: NotificationType;
    user: {
        name: string;
        avatar?: string;
        initials: string;
    };
    content: string;
    time: string;
    read: boolean;
}

const dummyNotifications: Notification[] = [
    {
        id: "1",
        type: "friend_request",
        user: { name: "Sarah Chen", initials: "SC" },
        content: "sent you a friend request",
        time: "2m ago",
        read: false,
    },
    {
        id: "2",
        type: "follow",
        user: { name: "Alex Morgan", initials: "AM" },
        content: "started following you",
        time: "1h ago",
        read: false,
    },
    {
        id: "3",
        type: "message",
        user: { name: "Jessica Wu", initials: "JW" },
        content: "sent you a message: 'Hey, nice work!'",
        time: "3h ago",
        read: true,
    },
    {
        id: "4",
        type: "like",
        user: { name: "David Kim", initials: "DK" },
        content: "liked your generated image",
        time: "5h ago",
        read: true,
    },
    {
        id: "5",
        type: "follow",
        user: { name: "Emily Davis", initials: "ED" },
        content: "started following you",
        time: "1d ago",
        read: true,
    }
];

interface NotificationPanelProps {
    className?: string;
    onClose?: () => void;
    isMobile?: boolean;
}

export function NotificationPanel({ className, onClose, isMobile }: NotificationPanelProps) {
    return (
        <div className={cn("flex flex-col h-full bg-background/95 backdrop-blur-sm border-l", className)}>
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-lg">Notifications</h2>
                </div>
                {isMobile && onClose && (
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col p-2 gap-2">
                    {dummyNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-muted/50 cursor-pointer",
                                !notification.read && "bg-muted/20"
                            )}
                        >
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={notification.user.avatar} />
                                <AvatarFallback>{notification.user.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm leading-snug">
                                    <span className="font-semibold">{notification.user.name}</span>{" "}
                                    <span className="text-muted-foreground">{notification.content}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">{notification.time}</p>

                                {notification.type === 'friend_request' && (
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" className="h-7 text-xs grow">Confirm</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-xs grow">Delete</Button>
                                    </div>
                                )}
                            </div>
                            {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
