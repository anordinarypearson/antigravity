
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Copy, AlertTriangle } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { MainLayout } from '@/components/main-layout';

export default function SettingsApiPage() {
    return (
        <MainLayout>
            <SettingsApiContent />
        </MainLayout>
    );
}

export function SettingsApiContent() {

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
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Feature Disabled</AlertTitle>
                        <AlertDescription>
                            API key generation requires user accounts, which have been disabled in this version of the application.
                        </AlertDescription>
                    </Alert>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> API Keys</CardTitle>
                            <CardDescription>Manage your API keys to integrate with external services.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                <KeyRound className="w-12 h-12 mb-4" />
                                <h3 className="text-lg font-semibold text-foreground">API Access Disabled</h3>
                                <p className="text-sm">
                                    This feature is unavailable as user accounts are not required.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
