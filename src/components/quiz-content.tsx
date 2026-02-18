
"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { QuizGenerator } from "./quiz-generator";
import { BackButton } from "./back-button";
import { SharedHeader } from "./shared-header";

export function QuizContent() {

    return (
        <div className="flex h-full flex-col bg-muted/20 dark:bg-transparent">
            <SharedHeader
                title="Quiz"
                leftElement={<BackButton />}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <QuizGenerator />
            </main>
        </div>
    );
}
