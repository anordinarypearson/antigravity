"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Check, X, Sparkles, TrendingUp, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { SUBSCRIPTION_PRICES, SUBSCRIPTION_FEATURES, SubscriptionTier } from "@/lib/subscription-limits";
import { RazorpayCheckout } from "./razorpay-checkout";

interface PricingDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    currentTier?: SubscriptionTier;
}

const tierIcons = {
    free: null,
    go: Sparkles,
    plus: TrendingUp,
    pro: Crown,
};

const tiers: Array<{
    name: SubscriptionTier;
    displayName: string;
    price: string;
    priceDetails: string;
    description: string;
    recommended?: boolean;
    features: string[];
}> = [
        {
            name: "free",
            displayName: "Free",
            price: `₹${SUBSCRIPTION_PRICES.free.inr}`,
            priceDetails: "INR / month",
            description: "Explore core study tools to get started.",
            features: SUBSCRIPTION_FEATURES.free,
        },
        {
            name: "go",
            displayName: "Go",
            price: `₹${SUBSCRIPTION_PRICES.go.inr}`,
            priceDetails: "INR / month (inclusive of GST)",
            description: "Unlock more powerful tools for serious learners.",
            recommended: true,
            features: SUBSCRIPTION_FEATURES.go,
        },
        {
            name: "plus",
            displayName: "Plus",
            price: `₹${SUBSCRIPTION_PRICES.plus.inr}`,
            priceDetails: "INR / month (inclusive of GST)",
            description: "For students and groups who want to maximize their productivity.",
            features: SUBSCRIPTION_FEATURES.plus,
        },
        {
            name: "pro",
            displayName: "Pro",
            price: `₹${SUBSCRIPTION_PRICES.pro.inr}`,
            priceDetails: "INR / month (inclusive of GST)",
            description: "For power users, educators, and institutions.",
            features: SUBSCRIPTION_FEATURES.pro,
        }
    ];

export function PricingDialog({ isOpen, onOpenChange, currentTier = 'free' }: PricingDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] bg-black border-neutral-800 text-white p-4 sm:p-6 overflow-hidden flex flex-col">
                {/* Close button - larger touch target on mobile */}


                <DialogHeader className="text-center mb-4 sm:mb-6 flex-shrink-0 pr-8">
                    <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-semibold">
                        Recommended plan for you
                    </DialogTitle>
                </DialogHeader>

                {/* Scrollable container for pricing cards */}
                <div className="overflow-y-auto overflow-x-hidden flex-1 -mx-4 px-4 sm:-mx-6 sm:px-6 pb-2">
                    {/* Horizontal scroll on mobile, grid on larger screens */}
                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 md:gap-5 scrollbar-hide">
                        {tiers.map((tier) => {
                            const Icon = tierIcons[tier.name];
                            const isCurrentTier = tier.name === currentTier;

                            return (
                                <Card
                                    key={tier.name}
                                    className={cn(
                                        "flex flex-col bg-neutral-900 border-neutral-800 transition-all duration-200",
                                        "min-w-[280px] sm:min-w-0 snap-center", // Fixed width on mobile for horizontal scroll
                                        "touch-manipulation", // Better touch handling
                                        tier.recommended && "border-primary/50 ring-2 ring-primary/50 sm:scale-[1.02]"
                                    )}
                                >
                                    <CardHeader className="p-4 sm:p-5">
                                        <div className="flex justify-between items-center flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                {Icon && <Icon className="h-5 w-5 text-primary" />}
                                                <CardTitle className="text-lg sm:text-xl font-medium">{tier.displayName}</CardTitle>
                                            </div>
                                            <div className="flex gap-1.5">
                                                {tier.name === 'go' && (
                                                    <Badge variant="outline" className="border-neutral-200 text-neutral-200 text-xs px-2 py-0.5">
                                                        NEW
                                                    </Badge>
                                                )}
                                                {isCurrentTier && (
                                                    <Badge variant="outline" className="border-neutral-200 text-neutral-200 text-xs px-2 py-0.5">
                                                        CURRENT
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1.5 mt-2">
                                            <span className="text-2xl sm:text-3xl md:text-4xl font-bold">{tier.price}</span>
                                            <span className="text-xs sm:text-sm text-neutral-400 leading-tight">{tier.priceDetails}</span>
                                        </div>
                                        <CardDescription className="text-neutral-300 text-sm mt-2 line-clamp-2 sm:line-clamp-none sm:min-h-[2.5rem]">
                                            {tier.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-3 p-4 sm:p-5 pt-0 sm:pt-0">
                                        {/* Larger button for better touch targets */}
                                        {tier.name === 'free' || isCurrentTier ? (
                                            <Button
                                                className="w-full h-11 sm:h-10 text-sm font-medium"
                                                variant="secondary"
                                                disabled
                                            >
                                                {isCurrentTier ? 'Current Plan' : 'Free Forever'}
                                            </Button>
                                        ) : (
                                            <RazorpayCheckout tier={tier.name} className="w-full h-11 sm:h-10 text-sm font-medium">
                                                Upgrade to {tier.displayName}
                                            </RazorpayCheckout>
                                        )}
                                        <ul className="space-y-2 text-xs sm:text-sm text-neutral-300">
                                            {tier.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <Check className="h-4 w-4 mt-0.5 text-foreground flex-shrink-0" />
                                                    <span className="leading-tight">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
