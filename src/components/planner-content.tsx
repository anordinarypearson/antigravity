
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { BackButton } from "./back-button";
import { SharedHeader } from "./shared-header";
import { Plus, Trash2, Clock, BookOpen, HelpCircle, RotateCcw, CalendarDays, X, GripVertical } from "lucide-react";
import { format, isSameDay, isToday, isFuture, isPast, addDays } from "date-fns";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
type EventType = "review" | "quiz" | "study" | "break";

interface StudyEvent {
    id: string;
    title: string;
    date: Date;
    type: EventType;
    time?: string;
    duration?: number; // minutes
    note?: string;
    completed?: boolean;
}

// ─── Event type config ────────────────────────────────────────────────────────
const EVENT_TYPES: Record<EventType, { icon: string; label: string; color: string; bg: string; badge: string }> = {
    review:  { icon: "🔄", label: "Review",    color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/30",    badge: "bg-blue-500/20 text-blue-300" },
    quiz:    { icon: "❓", label: "Quiz",      color: "text-green-400",   bg: "bg-green-500/10 border-green-500/30",  badge: "bg-green-500/20 text-green-300" },
    study:   { icon: "📚", label: "Study",     color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/30", badge: "bg-violet-500/20 text-violet-300" },
    break:   { icon: "☕", label: "Break",     color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30",  badge: "bg-amber-500/20 text-amber-300" },
};

// ─── Dummy initial events ──────────────────────────────────────────────────
const INITIAL_EVENTS: StudyEvent[] = [
    { id: "1", title: "Review Biology Flashcards",     date: addDays(new Date(), 1), type: "review", time: "09:00", duration: 30 },
    { id: "2", title: "Take JavaScript Quiz",          date: addDays(new Date(), 2), type: "quiz",   time: "14:00", duration: 45 },
    { id: "3", title: "Study History Chapter 5",       date: addDays(new Date(), 2), type: "study",  time: "10:00", duration: 60 },
    { id: "4", title: "Review Physics Formulas",       date: addDays(new Date(), 4), type: "review", time: "16:00", duration: 30 },
    { id: "5", title: "Take 10-minute break",          date: new Date(),             type: "break",  time: "12:00", duration: 10 },
    { id: "6", title: "Chemistry Lab Prep",            date: addDays(new Date(), 6), type: "study",  time: "11:00", duration: 90 },
];

// ─── Add Event Modal ──────────────────────────────────────────────────────────
function AddEventModal({
    selectedDate,
    onAdd,
    onClose,
}: {
    selectedDate: Date | undefined;
    onAdd: (event: Omit<StudyEvent, "id">) => void;
    onClose: () => void;
}) {
    const [title, setTitle] = useState("");
    const [type, setType] = useState<EventType>("study");
    const [time, setTime] = useState("09:00");
    const [duration, setDuration] = useState(30);
    const [note, setNote] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !selectedDate) return;
        onAdd({ title: title.trim(), date: selectedDate, type, time, duration, note: note.trim() || undefined });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md rounded-2xl bg-background border border-border/50 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-4 border-b border-border/30">
                    <div>
                        <h2 className="font-semibold text-base">New Event</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {selectedDate ? format(selectedDate, "EEEE, MMMM do") : "Select a date"}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Event Title</Label>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Review Biology Chapter 3"
                            autoFocus
                            className="h-9 text-sm"
                        />
                    </div>

                    {/* Type selector */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Type</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {(Object.entries(EVENT_TYPES) as [EventType, typeof EVENT_TYPES[EventType]][]).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setType(key)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all",
                                        type === key ? `${cfg.bg} ${cfg.color}` : "border-border/40 text-muted-foreground hover:border-border"
                                    )}
                                >
                                    <span className="text-lg">{cfg.icon}</span>
                                    {cfg.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time + Duration */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Time</Label>
                            <Input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Duration (min)</Label>
                            <Input
                                type="number"
                                min={5}
                                max={480}
                                step={5}
                                value={duration}
                                onChange={e => setDuration(Number(e.target.value))}
                                className="h-9 text-sm"
                            />
                        </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Input
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Any additional notes…"
                            className="h-9 text-sm"
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button type="button" variant="outline" className="flex-1 h-9 text-sm" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={!title.trim()} className="flex-1 h-9 text-sm">
                            <Plus className="h-4 w-4 mr-1.5" />Add Event
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, onDelete, onToggle }: { event: StudyEvent; onDelete: (id: string) => void; onToggle: (id: string) => void }) {
    const cfg = EVENT_TYPES[event.type];
    return (
        <motion.li
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={cn(
                "flex items-start gap-3 p-3 rounded-xl border transition-all duration-200",
                cfg.bg,
                event.completed && "opacity-50"
            )}
        >
            <button
                onClick={() => onToggle(event.id)}
                className={cn(
                    "mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    event.completed ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/30 hover:border-muted-foreground"
                )}
            >
                {event.completed && <span className="text-[8px] text-white font-bold">✓</span>}
            </button>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium leading-tight", event.completed && "line-through text-muted-foreground")}>
                        {event.title}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", cfg.badge)}>
                        {cfg.icon} {cfg.label}
                    </span>
                    {event.time && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />{event.time}
                        </span>
                    )}
                    {event.duration && (
                        <span className="text-[10px] text-muted-foreground">{event.duration}m</span>
                    )}
                </div>
                {event.note && (
                    <p className="text-[10px] text-muted-foreground/70 mt-1 italic">{event.note}</p>
                )}
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                onClick={() => onDelete(event.id)}
            >
                <Trash2 className="h-3 w-3" />
            </Button>
        </motion.li>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PlannerContent() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [events, setEvents] = useState<StudyEvent[]>(INITIAL_EVENTS);
    const [showModal, setShowModal] = useState(false);
    const { toast } = useToast();

    const selectedDayEvents = events.filter(e => date && isSameDay(e.date, date)).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
    const upcomingEvents = events.filter(e => isFuture(e.date) && !isSameDay(e.date, new Date())).slice(0, 5);
    const todayEvents = events.filter(e => isToday(e.date));
    const completedCount = selectedDayEvents.filter(e => e.completed).length;

    const eventDates = events.map(e => e.date);

    const addEvent = (eventData: Omit<StudyEvent, "id">) => {
        const newEvent: StudyEvent = { ...eventData, id: Date.now().toString() };
        setEvents(prev => [...prev, newEvent]);
        toast({ title: "Event Added ✓", description: `"${eventData.title}" scheduled for ${format(eventData.date, "MMM do")}.` });
        setShowModal(false);
    };

    const deleteEvent = (id: string) => {
        setEvents(prev => prev.filter(e => e.id !== id));
        toast({ title: "Event removed.", variant: "destructive" });
    };

    const toggleEvent = (id: string) => {
        setEvents(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
    };

    return (
        <div className="flex flex-col h-full bg-muted/20 dark:bg-transparent">
            <SharedHeader
                title="Study Planner"
                leftElement={<BackButton />}
                rightElement={
                    <Button onClick={() => setShowModal(true)} size="sm" className="bg-primary hover:bg-primary/90 shadow-sm">
                        <Plus className="mr-1.5 h-4 w-4" />New Event
                    </Button>
                }
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-3">

                    {/* Calendar */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: "Total Events", value: events.length, icon: CalendarDays, color: "text-blue-400" },
                                { label: "Today", value: todayEvents.length, icon: Clock, color: "text-violet-400" },
                                { label: "Completed", value: events.filter(e => e.completed).length, icon: BookOpen, color: "text-emerald-400" },
                            ].map(stat => (
                                <Card key={stat.label} className="border-border/40">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                                        <div>
                                            <p className="text-xl font-bold">{stat.value}</p>
                                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Calendar card */}
                        <Card className="border-border/40">
                            <CardContent className="p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="w-full rounded-xl"
                                    modifiers={{ hasEvent: eventDates, today: [new Date()] }}
                                    modifiersClassNames={{
                                        hasEvent: 'relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary',
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right panel */}
                    <div className="space-y-4">
                        {/* Selected day events */}
                        <Card className="border-border/40">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                        {date ? (isToday(date) ? "Today" : format(date, "MMM do")) : "Select a date"}
                                    </CardTitle>
                                    {selectedDayEvents.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                            {completedCount}/{selectedDayEvents.length} done
                                        </Badge>
                                    )}
                                </div>
                                {selectedDayEvents.length > 0 && (
                                    <div className="h-1.5 w-full rounded-full bg-muted/50 mt-1">
                                        <motion.div
                                            className="h-full rounded-full bg-emerald-500"
                                            animate={{ width: `${selectedDayEvents.length > 0 ? (completedCount / selectedDayEvents.length) * 100 : 0}%` }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="pt-0">
                                <AnimatePresence mode="popLayout">
                                    {selectedDayEvents.length > 0 ? (
                                        <ul className="space-y-2 group">
                                            {selectedDayEvents.map(event => (
                                                <EventCard key={event.id} event={event} onDelete={deleteEvent} onToggle={toggleEvent} />
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center py-8 space-y-2">
                                            <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">No events for this day.</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-7 mt-2"
                                                onClick={() => setShowModal(true)}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />Add event
                                            </Button>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>

                        {/* Upcoming events */}
                        {upcomingEvents.length > 0 && (
                            <Card className="border-border/40">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm text-muted-foreground">Upcoming</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <ul className="space-y-2">
                                        {upcomingEvents.map(event => {
                                            const cfg = EVENT_TYPES[event.type];
                                            return (
                                                <li key={event.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span>{cfg.icon}</span>
                                                    <span className="flex-1 truncate">{event.title}</span>
                                                    <span className="text-xs text-muted-foreground/50 flex-shrink-0">{format(event.date, "MMM d")}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {showModal && (
                    <AddEventModal
                        selectedDate={date}
                        onAdd={addEvent}
                        onClose={() => setShowModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
