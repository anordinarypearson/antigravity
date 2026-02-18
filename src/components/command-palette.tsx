'use client';

import * as React from 'react';
import {
    Search,
    FileText,
    Download,
    Settings as SettingsIcon,
    Keyboard,
    MessageSquare,
    Plus,
    Home,
} from 'lucide-react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { useRouter } from 'next/navigation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useChatStore } from './chat-content';

export function CommandPalette() {
    const { isCommandOpen, setCommandOpen } = useChatStore();
    const router = useRouter();

    // Keyboard shortcut to open palette
    useKeyboardShortcuts([
        {
            key: 'k',
            ctrl: true,
            action: () => setCommandOpen(true),
        },
    ]);

    const runCommand = React.useCallback((command: () => void) => {
        setCommandOpen(false);
        command();
    }, []);

    return (
        <CommandDialog open={isCommandOpen} onOpenChange={setCommandOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
                        <Home className="mr-2 h-4 w-4" />
                        Home
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/chat'))}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        New Chat
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/create-flashcards'))}>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Flashcards
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/quiz'))}>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Quiz
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/web-scraper'))}>
                        <Search className="mr-2 h-4 w-4" />
                        Web Scraper
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Actions">
                    <CommandItem>
                        <Download className="mr-2 h-4 w-4" />
                        Export Chat
                    </CommandItem>
                    <CommandItem>
                        <Plus className="mr-2 h-4 w-4" />
                        New Session
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Settings">
                    <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Preferences
                    </CommandItem>
                    <CommandItem>
                        <Keyboard className="mr-2 h-4 w-4" />
                        Keyboard Shortcuts
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
