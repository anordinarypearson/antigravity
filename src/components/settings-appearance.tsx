
"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Check, Moon, Sun, Paintbrush, Palette } from "lucide-react";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { cn } from "@/lib/utils";
import { WavyLoaderPreferences } from "./wavy-preferences";

export function SettingsAppearanceContent() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col h-full bg-muted/40">
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="lg:hidden" />
                <BackButton />
                <h1 className="text-xl font-semibold tracking-tight">Appearance</h1>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-2xl space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Paintbrush className="w-5 h-5"/> Theme</CardTitle>
                        <CardDescription>Select the theme for the application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <Button 
                                variant={theme === 'light' ? 'default' : 'outline'}
                                onClick={() => setTheme('light')}
                                className="h-24 flex flex-col gap-2"
                            >
                                <Sun className="w-6 h-6"/>
                                Light Mode
                            </Button>
                            <Button 
                                variant={theme === 'dark' ? 'default' : 'outline'}
                                onClick={() => setTheme('dark')}
                                className="h-24 flex flex-col gap-2"
                            >
                                <Moon className="w-6 h-6"/>
                                Dark Mode
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5"/> Accent Color</CardTitle>
                        <CardDescription>Customize the application's primary accent color.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                            {[
                                { id: 'gray', label: 'Classic', color: 'hsl(0 0% 50%)' },
                                { id: 'blue', label: 'Blue', color: 'hsl(221 83% 53%)' },
                                { id: 'purple', label: 'Purple', color: 'hsl(262 83% 58%)' },
                                { id: 'green', label: 'Green', color: 'hsl(142 71% 45%)' },
                                { id: 'rose', label: 'Rose', color: 'hsl(346 77% 49.8%)' },
                                { id: 'orange', label: 'Orange', color: 'hsl(24 95% 53%)' },
                             ].map((item) => (
                                <div key={item.id} className="flex flex-col items-center gap-2">
                                    <button
                                        onClick={() => (useTheme() as any).setAccentColor(item.id)}
                                        className={cn(
                                            "h-12 w-12 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center",
                                            (useTheme() as any).accentColor === item.id 
                                                ? "border-foreground ring-2 ring-primary ring-offset-2" 
                                                : "border-transparent"
                                        )}
                                        style={{ backgroundColor: item.color }}
                                        title={item.label}
                                    >
                                        {(useTheme() as any).accentColor === item.id && (
                                            <Check className="w-6 h-6 text-white drop-shadow-md" />
                                        )}
                                    </button>
                                    <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Wavy System Preferences */}
                <WavyLoaderPreferences />
            </div>
        </main>
    </div>
  );
}
