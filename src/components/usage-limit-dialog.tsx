"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { AlertTriangle, Sparkles, TrendingUp, Crown } from "lucide-react";
import { Progress } from "./ui/progress";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
    SUBSCRIPTION_PRICES,
    SUBSCRIPTION_FEATURES,
    SubscriptionTier,
    USAGE_TYPE_LABELS,
    UsageType
} from "@/lib/subscription-limits";
import { useState } from "react";
import { RazorpayCheckout } from "./razorpay-checkout";

interface UsageLimitDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    limitType: UsageType;
    currentUsage: number;
    limit: number;
    currentTier: SubscriptionTier;
}

const tierIcons = {
    free: AlertTriangle,
    go: Sparkles,
    plus: TrendingUp,
    pro: Crown,
};

const tierColors = {
    free: "text-muted-foreground",
    go: "text-foreground",
    plus: "text-foreground",
    pro: "text-foreground",
};

const tierBorderColors = {
    free: "border-border",
    go: "border-border",
    plus: "border-border",
    pro: "border-border",
};

export function UsageLimitDialog({
    isOpen,
    onOpenChange,
    limitType,
    currentUsage,
    limit,
    currentTier
}: UsageLimitDialogProps) {
    const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('go');

    const percentage = (currentUsage / limit) * 100;
    const featureName = USAGE_TYPE_LABELS[limitType];
    const resetPeriod = limitType.includes('PerDay') ? 'daily' : 'monthly';

    const upgradeTiers: SubscriptionTier[] = currentTier === 'free'
        ? ['go', 'plus', 'pro']
        : currentTier === 'go'
            ? ['plus', 'pro']
            : ['pro'];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl bg-background border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                        <AlertTriangle className="text-foreground h-6 w-6" />
                        {featureName} Limit Reached
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-base">
                        You've used all your {resetPeriod} {featureName.toLowerCase()}. Upgrade to continue using this feature.
                    </DialogDescription>
                </DialogHeader>

                {/* Current Usage */}
                <Card className="bg-muted/50 border-border">
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Current Usage</span>
                                <span className="text-sm font-semibold">
                                    {currentUsage} / {limit} {featureName}
                                </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                                Resets {resetPeriod} • Current plan: <span className="font-semibold capitalize">{currentTier}</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Upgrade Options */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Upgrade Your Plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {upgradeTiers.map((tier) => {
                            const Icon = tierIcons[tier];
                            const isRecommended = tier === 'go';

                            return (
                                <Card
                                    key={tier}
                                    className={`relative bg-card border-2 transition-all cursor-pointer hover:scale-105 ${selectedTier === tier
                                        ? tierBorderColors[tier] + ' ring-2 ring-offset-2 ring-offset-background'
                                        : 'border-border'
                                        }`}
                                    onClick={() => setSelectedTier(tier)}
                                >
                                    {isRecommended && (
                                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0">
                                            Recommended
                                        </Badge>
                                    )}
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Icon className={`h-5 w-5 ${tierColors[tier]}`} />
                                                <h4 className="font-semibold capitalize text-lg">{tier}</h4>
                                            </div>
                                        </div>

                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold">₹{SUBSCRIPTION_PRICES[tier].inr}</span>
                                            <span className="text-sm text-muted-foreground">/month</span>
                                        </div>

                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            {SUBSCRIPTION_FEATURES[tier].slice(0, 3).map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="text-foreground mt-0.5">✓</span>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <RazorpayCheckout tier={tier} className="w-full">
                                            Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                        </RazorpayCheckout>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                    <p className="text-xs text-neutral-500">
                        Secure payments powered by Razorpay • All plans include GST
                    </p>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Maybe Later
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
