
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpChatbot } from "./help-chatbot";
import { SharedHeader } from "./shared-header";
import { BackButton } from "./back-button";

export function HelpContent() {
    return (
        <div className="flex flex-col h-full">
            <SharedHeader
                title="Help & Support"
                leftElement={<BackButton />}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Help Assistant</CardTitle>
                            <CardDescription>Have questions? Ask our AI assistant for help with using the SearnAI app.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <HelpChatbot />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
