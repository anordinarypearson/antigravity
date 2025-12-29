
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Copy, Share2, Send, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
}

type Friend = {
  id: string;
  name: string;
  username?: string;
  avatar: string;
};

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export function ShareDialog({ isOpen, onOpenChange, content }: ShareDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [shareUrl, setShareUrl] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    setShareUrl(window.location.href);
    if (isOpen && user) {
      fetchFriends();
    }
  }, [isOpen, user]);

  const fetchFriends = async () => {
    if (!user) return;
    setLoadingFriends(true);
    try {
      const friendsSnapshot = await getDocs(collection(db, "users", user.uid, "following"));
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

  const handleCopyToClipboard = (text: string, type: 'link' | 'text') => {
    navigator.clipboard.writeText(text);
    toast({ title: `Copied to clipboard!`, description: `The ${type} has been copied.` });
  };

  const createShareLink = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const text = `Check out this response from SearnAI: "${content.substring(0, 100)}..."`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(shareUrl);

    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
      case 'linkedin':
        return `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=Response%20from%20SearnAI&summary=${encodedText}`;
    }
  };

  const handleShareToFriend = async (friend: Friend) => {
    if (!user) return;
    setSendingTo(friend.id);

    try {
      const participants = [user.uid, friend.id].sort();
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

      const sharedMessage = `Shared from AI Chat:\n\n> ${content.substring(0, 300)}${content.length > 300 ? '...' : ''}`;

      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.uid,
        text: sharedMessage,
        createdAt: serverTimestamp()
      });

      await updateDoc(chatDocRef, {
        lastMessage: "Shared content",
        updatedAt: serverTimestamp(),
        lastMessageTimestamp: serverTimestamp()
      });

      toast({ title: "Sent!", description: `Shared with ${friend.name}` });

    } catch (error) {
      console.error("Error sharing to friend:", error);
      toast({ title: "Error", description: "Failed to share content.", variant: "destructive" });
    } finally {
      setSendingTo(null);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this response</DialogTitle>
          <DialogDescription>
            Share via link, social media, or directly to a friend.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">

          {/* Social & Link Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium leading-none">External Share</h4>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button size="icon" variant="outline" onClick={() => handleCopyToClipboard(shareUrl, 'link')} disabled>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => handleCopyToClipboard(content, 'text')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-start gap-2">
              <Button asChild variant="outline" size="icon" className="h-8 w-8">
                <a href={createShareLink('twitter')} target="_blank" rel="noopener noreferrer">
                  <XIcon className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="icon" className="h-8 w-8">
                <a href={createShareLink('facebook')} target="_blank" rel="noopener noreferrer">
                  <FacebookIcon className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="icon" className="h-8 w-8">
                <a href={createShareLink('linkedin')} target="_blank" rel="noopener noreferrer">
                  <LinkedinIcon className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium leading-none mb-3">Send to Friend</h4>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              {loadingFriends ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : friends.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground p-4">No friends found. Follow users to share with them directly.</p>
              ) : (
                <div className="space-y-2">
                  {friends.map(friend => (
                    <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>{friend.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{friend.name}</div>
                          <div className="text-xs text-muted-foreground">{friend.username}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleShareToFriend(friend)}
                        disabled={sendingTo === friend.id}
                      >
                        {sendingTo === friend.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
