
"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { KeyRound, Copy, Plus, AlertTriangle } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { useAuth } from "@/hooks/use-auth";

export function SettingsApiContent() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // In a real app, you'd fetch existing keys. For now, we just generate a new one.

    const generateApiKey = async () => {
        if (!user) {
            toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }
        setIsGenerating(true);
        setApiKey(null);
        
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/keys', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate API key.');
            }

            const { key } = await response.json();
            setApiKey(key);
            toast({
                title: "API Key Generated",
                description: "Your new API key is ready to use.",
            });

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        toast({
            title: "Copied!",
            description: "API key has been copied to your clipboard.",
        });
    };

    return (
        <div className="flex flex-col h-full bg-muted/40">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="lg:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">API Keys</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-2xl space-y-8">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4"/>
                        <AlertTitle>Developer API</AlertTitle>
                        <AlertDescription>
                            This is a real API key generation system. Treat your keys like passwords and do not share them.
                        </AlertDescription>
                    </Alert>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5"/> API Keys</CardTitle>
                            <CardDescription>Manage your API keys to integrate with external services.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {apiKey ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Your new API Key:</p>
                                    <div className="flex gap-2">
                                        <Input readOnly value={apiKey} className="font-mono text-xs"/>
                                        <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Please save this key securely. You will not be able to see it again.
                                    </p>
                                </div>
                           ) : (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                    <KeyRound className="w-12 h-12 mb-4" />
                                    <h3 className="text-lg font-semibold text-foreground">No API Keys</h3>
                                    <p className="text-sm">
                                        You have not generated any API keys yet.
                                    </p>
                                </div>
                           )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={generateApiKey} disabled={isGenerating}>
                                {isGenerating ? <WavyLoader className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                Generate New API Key
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
