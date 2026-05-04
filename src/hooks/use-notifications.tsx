"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    serverTimestamp,
    getDoc,
    runTransaction,
    increment
} from "firebase/firestore";
import { useAuth } from "./use-auth";

export type NotificationType = "friend_request" | "follow" | "like" | "message";

export interface Notification {
    id: string;
    type: NotificationType;
    senderId: string;
    user: {
        name: string;
        avatar?: string;
        initials: string;
    };
    content: string;
    time: any;
    read: boolean;
}

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "users", user.uid, "notifications"),
            orderBy("time", "desc")
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Notification));
            
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (notificationId: string) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.uid, "notifications", notificationId), {
                read: true
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "notifications", notificationId));
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const confirmFriendRequest = async (notification: Notification) => {
        if (!user) return;
        
        const userIdToFollow = notification.senderId;
        const currentUserDocRef = doc(db, "users", user.uid);
        const userToFollowDocRef = doc(db, "users", userIdToFollow);
        const followingDocRef = doc(currentUserDocRef, "following", userIdToFollow);
        const followerDocRef = doc(userToFollowDocRef, "followers", user.uid);

        try {
            const currentUserDoc = await getDoc(currentUserDocRef);
            const currentUserData = currentUserDoc.data();

            await runTransaction(db, async (transaction) => {
                // Follow the person back
                transaction.set(followingDocRef, { followedAt: new Date() });
                transaction.set(followerDocRef, { followerAt: new Date() });
                transaction.update(currentUserDocRef, { followingCount: increment(1) });
                transaction.update(userToFollowDocRef, { followerCount: increment(1) });
                
                // Delete the original notification
                transaction.delete(doc(db, "users", user.uid, "notifications", notification.id));

                // Create a "followed you back" notification for the other user
                const responseNotifRef = doc(collection(db, "users", userIdToFollow, "notifications"));
                transaction.set(responseNotifRef, {
                    type: "follow",
                    senderId: user.uid,
                    user: {
                        name: currentUserData?.displayName || currentUserData?.name || "Anonymous",
                        avatar: currentUserData?.photoURL || "",
                        initials: (currentUserData?.displayName || currentUserData?.name || "A").charAt(0).toUpperCase()
                    },
                    content: "followed you back",
                    time: serverTimestamp(),
                    read: false
                });
            });
            return true;
        } catch (error) {
            console.error("Error confirming friend request:", error);
            return false;
        }
    };

    return {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        deleteNotification,
        confirmFriendRequest
    };
}
