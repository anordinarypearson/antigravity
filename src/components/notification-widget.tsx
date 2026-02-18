"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";

// Reuse the same dummy data or imported type if possible, but for simplicity redefining here or importing could work.
// I'll reuse the dummy data structure for the widget.

const dummyNotifications = [
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
];

export function NotificationWidget() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute top-4 right-4 z-50 w-80 bg-background/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden hidden sm:block"
        >
            <div className="p-4 bg-gradient-to-br from-white/5 to-transparent">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-neutral-500/10 rounded-lg">
                        <Bell className="h-4 w-4 text-neutral-400" />
                    </div>
                    <span className="text-sm font-medium text-foreground/80">Recent Activity</span>
                </div>

                <div className="space-y-3">
                    {dummyNotifications.map((notification) => (
                        <div key={notification.id} className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 border border-white/10">
                                <AvatarImage src={undefined} />
                                <AvatarFallback className="text-[10px] bg-neutral-500/10 text-neutral-400">{notification.user.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-foreground/90 leading-snug">
                                    <span className="font-semibold">{notification.user.name}</span> {notification.content}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{notification.time}</p>
                            </div>
                            {!notification.read && (
                                <div className="h-1.5 w-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
