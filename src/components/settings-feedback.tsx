
"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ThumbsUp, Send } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";

export function SettingsFeedbackContent() {
    const [feedbackType, setFeedbackType] = useState("suggestion");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!message.trim()) {
            toast({
                title: "Message is empty",
                description: "Please write your feedback before submitting.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setMessage("");
            toast({
                title: "Feedback Submitted!",
                description: "Thank you for helping us improve SearnAI.",
            });
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-muted/40">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="lg:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">Feedback</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-2xl space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ThumbsUp className="w-5 h-5"/> Share Your Feedback</CardTitle>
                            <CardDescription>We value your opinion. Let us know how we can improve.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label>What kind of feedback do you have?</Label>
                                <RadioGroup value={feedbackType} onValueChange={setFeedbackType} className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="suggestion" id="suggestion" />
                                        <Label htmlFor="suggestion">Suggestion</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="bug" id="bug" />
                                        <Label htmlFor="bug">Bug Report</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="other" id="other" />
                                        <Label htmlFor="other">Other</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Your Message</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Tell us what you think..."
                                    className="h-32"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? <WavyLoader className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Submit Feedback
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
