
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import Link from "next/link";

interface PricingDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

const tiers = [
    {
        name: "Free",
        price: "₹0",
        priceDetails: "INR / month",
        description: "Explore core study tools to get started.",
        buttonText: "Your current plan",
        buttonVariant: "secondary",
        disabled: true,
        features: [
            "Standard AI model access",
            "Basic content analysis",
            "Limited flashcard & quiz generation (5/day)",
            "Text & image-based study sessions",
            "Community support",
        ],
        href: "#"
    },
    {
        name: "Go",
        price: "₹20",
        priceDetails: "INR / month (inclusive of GST)",
        description: "Unlock more powerful tools for serious learners.",
        buttonText: "Upgrade to Go",
        buttonVariant: "default",
        recommended: true,
        features: [
            "Everything in Free, plus:",
            "Access to DeepThink AI model",
            "PDF & DOCX uploads",
            "Higher generation limits (50/day)",
            "Access to Study Planner & Calendar",
            "Ad-free experience",
        ],
        href: "https://buy.stripe.com/your-go-plan-link" // Replace with actual Stripe payment link
    },
    {
        name: "Plus",
        price: "₹100",
        priceDetails: "INR / month (inclusive of GST)",
        description: "For students and groups who want to maximize their productivity.",
        buttonText: "Get Plus",
        buttonVariant: "outline",
        features: [
            "Everything in Go, plus:",
            "Highest priority AI access",
            "Unlimited generations & study sessions",
            "Collaborative Study Rooms",
            "Performance Analytics Dashboard",
            "Deck Marketplace to share & sell content",
            "Priority support",
        ],
        href: "https://buy.stripe.com/your-plus-plan-link" // Replace with actual Stripe payment link
    },
    {
        name: "Pro",
        price: "₹499",
        priceDetails: "INR / month (inclusive of GST)",
        description: "For power users, educators, and institutions.",
        buttonText: "Get Pro",
        buttonVariant: "outline",
        features: [
            "Everything in Plus, plus:",
            "Early access to new features (e.g., AR/VR study)",
            "API access for custom integrations",
            "Advanced tools for educators",
            "Team management features",
            "Dedicated account manager",
        ],
        href: "https://buy.stripe.com/your-pro-plan-link" // Replace with actual Stripe payment link
    }
];

export function PricingDialog({ isOpen, onOpenChange }: PricingDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl bg-black border-neutral-800 text-white p-8">
                <DialogHeader className="text-center mb-8">
                    <DialogTitle className="text-3xl font-semibold">Recommended plan for you</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tiers.map((tier) => (
                        <Card key={tier.name} className={cn(
                            "flex flex-col bg-neutral-900 border-neutral-800",
                            tier.recommended && "border-primary/50 ring-2 ring-primary/50"
                        )}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-xl font-medium">{tier.name}</CardTitle>
                                    {tier.name === 'Go' && <Badge variant="outline" className="border-blue-400 text-blue-400">NEW</Badge>}
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold">{tier.price}</span>
                                    <span className="text-sm text-neutral-400">{tier.priceDetails}</span>
                                </div>
                                <CardDescription className="text-neutral-300 h-10">{tier.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-3 pt-4">
                                <Link href={tier.href} target="_blank" rel="noopener noreferrer" className="w-full">
                                    <Button className="w-full" variant={tier.buttonVariant as any} disabled={tier.disabled}>
                                        {tier.buttonText}
                                    </Button>
                                </Link>
                                <ul className="space-y-2 text-sm text-neutral-300">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <Check className="h-4 w-4 mt-1 text-green-400 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => onOpenChange(false)}>
                    <X />
                </Button>
            </DialogContent>
        </Dialog>
    );
}
