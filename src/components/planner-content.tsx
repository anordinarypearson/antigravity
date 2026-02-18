
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { Plus } from "lucide-react";
import { SharedHeader } from "./shared-header";
import { format } from 'date-fns';

type StudyEvent = {
    id: string;
    title: string;
    date: Date;
    type: 'review' | 'quiz' | 'study';
};

const dummyEvents: StudyEvent[] = [
    { id: '1', title: 'Review Biology Flashcards', date: new Date(new Date().setDate(new Date().getDate() + 1)), type: 'review' },
    { id: '2', title: 'Take JavaScript Quiz', date: new Date(new Date().setDate(new Date().getDate() + 2)), type: 'quiz' },
    { id: '3', title: 'Study History Chapter 5', date: new Date(new Date().setDate(new Date().getDate() + 2)), type: 'study' },
    { id: '4', title: 'Review Physics Formulas', date: new Date(new Date().setDate(new Date().getDate() + 4)), type: 'review' },
];

const EventTypeIcon = ({ type }: { type: StudyEvent['type'] }) => {
    switch (type) {
        case 'review': return <span className="text-blue-500">🔄</span>;
        case 'quiz': return <span className="text-green-500">❓</span>;
        case 'study': return <span className="text-purple-500">📚</span>;
    }
}


export function PlannerContent() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [events, setEvents] = useState<StudyEvent[]>(dummyEvents);

    const selectedDayEvents = events.filter(event =>
        date && format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );

    return (
        <div className="flex flex-col h-full bg-muted/40">
            <SharedHeader
                title="Study Planner"
                leftElement={<BackButton />}
                rightElement={
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Event
                    </Button>
                }
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Card>
                            <CardContent className="p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="w-full"
                                    modifiers={{
                                        hasEvent: events.map(e => e.date)
                                    }}
                                    modifiersClassNames={{
                                        hasEvent: 'relative !text-primary before:content-[""] before:absolute before:bottom-1 before:left-1/2 before:-translate-x-1/2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary'
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Events for {date ? format(date, 'MMMM do, yyyy') : '...'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {selectedDayEvents.length > 0 ? (
                                    <ul className="space-y-3">
                                        {selectedDayEvents.map(event => (
                                            <li key={event.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                                <EventTypeIcon type={event.type} />
                                                <span className="flex-1 text-sm font-medium">{event.title}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No events scheduled for this day.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

