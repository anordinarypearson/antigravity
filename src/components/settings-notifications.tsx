
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Bell, Zap, BrainCircuit } from "lucide-react";
import { BackButton } from "./back-button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { SharedHeader } from "./shared-header";

export function SettingsNotificationsContent() {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        studyReminders: true,
        featureUpdates: true,
        quizAlerts: false,
    });

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem("notificationSettings");
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (e) {
            console.warn("Could not retrieve notification settings from localStorage.");
        }
    }, []);

    const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            localStorage.setItem("notificationSettings", JSON.stringify(newSettings));
            toast({
                title: "Settings Saved",
                description: "Your notification preferences have been updated.",
            });
        } catch (e) {
            toast({
                title: "Error",
                description: "Could not save settings.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-muted/40">
            <SharedHeader 
                title="Notifications" 
                leftElement={<BackButton />}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-2xl space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5"/> Notifications</CardTitle>
                            <CardDescription>Manage how you receive notifications from SearnAI.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="space-y-1">
                                    <Label htmlFor="study-reminders" className="font-semibold flex items-center gap-2">
                                        <BrainCircuit className="w-4 h-4 text-primary" />
                                        Study Reminders
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Receive notifications for scheduled study sessions and flashcard reviews.</p>
                                </div>
                                <Switch
                                    id="study-reminders"
                                    checked={settings.studyReminders}
                                    onCheckedChange={(val) => handleSettingChange('studyReminders', val)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="space-y-1">
                                    <Label htmlFor="feature-updates" className="font-semibold flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        New Features & Updates
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Get notified about new tools and improvements to the app.</p>
                                </div>
                                <Switch
                                    id="feature-updates"
                                    checked={settings.featureUpdates}
                                    onCheckedChange={(val) => handleSettingChange('featureUpdates', val)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
