"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Heart, MessageCircle, X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { useNotifications, Notification } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";

interface NotificationPanelProps {
    className?: string;
    onClose?: () => void;
    isMobile?: boolean;
}

export function NotificationPanel({ className, onClose, isMobile }: NotificationPanelProps) {
    const { 
        notifications, 
        loading, 
        markAsRead, 
        deleteNotification, 
        confirmFriendRequest 
    } = useNotifications();

    const handleConfirm = async (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation();
        await confirmFriendRequest(notification);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteNotification(id);
    };

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
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                            <p className="text-sm">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground opacity-50">
                            <Bell className="h-12 w-12 mb-3" />
                            <p className="text-sm font-medium">No notifications yet</p>
                            <p className="text-xs">When you follow someone or get a request, it will show up here.</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => markAsRead(notification.id)}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-muted/50 cursor-pointer relative group",
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
                                    <p className="text-xs text-muted-foreground">
                                        {notification.time?.toDate ? formatDistanceToNow(notification.time.toDate(), { addSuffix: true }) : "just now"}
                                    </p>

                                    {notification.type === 'friend_request' && (
                                        <div className="flex gap-2 mt-2">
                                            <Button 
                                                size="sm" 
                                                className="h-7 text-xs grow"
                                                onClick={(e) => handleConfirm(e, notification)}
                                            >
                                                Confirm
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-7 text-xs grow"
                                                onClick={(e) => handleDelete(e, notification.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {!notification.read && (
                                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => handleDelete(e, notification.id)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
