
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Lock, Share2, Shield, AlertTriangle, CheckCircle2, Key, Activity, User, Bell } from "lucide-react";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface SecurityLog {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    severity: 'info' | 'warning' | 'error';
}

export function SettingsSecurityContent() {
    const { toast } = useToast();
    const [shareData, setShareData] = useState(true);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [loginNotifications, setLoginNotifications] = useState(true);
    const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
    const [securityScore, setSecurityScore] = useState(75);

    useEffect(() => {
        try {
            const savedSetting = localStorage.getItem("shareUsageData");
            if (savedSetting !== null) {
                setShareData(JSON.parse(savedSetting));
            }

            const saved2FA = localStorage.getItem("twoFactorEnabled");
            if (saved2FA !== null) {
                setTwoFactorEnabled(JSON.parse(saved2FA));
            }

            const savedNotifications = localStorage.getItem("loginNotifications");
            if (savedNotifications !== null) {
                setLoginNotifications(JSON.parse(savedNotifications));
            }

            // Load mock security logs
            loadSecurityLogs();
            calculateSecurityScore();
        } catch (e) {
            console.warn("Could not retrieve security settings from localStorage.");
        }
    }, []);

    const loadSecurityLogs = () => {
        // Mock security logs - replace with actual API call
        const mockLogs: SecurityLog[] = [
            {
                id: '1',
                type: 'LOGIN',
                message: 'Successful login from Windows device',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                severity: 'info'
            },
            {
                id: '2',
                type: 'PASSWORD_CHANGE',
                message: 'Password changed successfully',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
                severity: 'info'
            },
        ];
        setSecurityLogs(mockLogs);
    };

    const calculateSecurityScore = () => {
        let score = 0;
        if (twoFactorEnabled) score += 35;
        if (loginNotifications) score += 15;
        if (shareData === false) score += 10; // Privacy conscious
        score += 40; // Base score for having an account
        setSecurityScore(Math.min(score, 100));
    };

    const handleSettingChange = (setting: string, value: boolean) => {
        try {
            if (setting === 'shareData') {
                setShareData(value);
                localStorage.setItem("shareUsageData", JSON.stringify(value));
                toast({
                    title: "Privacy Setting Updated",
                    description: `Usage data sharing has been ${value ? 'enabled' : 'disabled'}.`,
                });
            } else if (setting === 'twoFactor') {
                setTwoFactorEnabled(value);
                localStorage.setItem("twoFactorEnabled", JSON.stringify(value));
                toast({
                    title: value ? "2FA Enabled" : "2FA Disabled",
                    description: value
                        ? "Two-factor authentication provides an extra layer of security."
                        : "Your account is less secure without 2FA.",
                    variant: value ? "default" : "destructive",
                });
            } else if (setting === 'loginNotifications') {
                setLoginNotifications(value);
                localStorage.setItem("loginNotifications", JSON.stringify(value));
                toast({
                    title: "Notification Setting Updated",
                    description: `Login notifications have been ${value ? 'enabled' : 'disabled'}.`,
                });
            }

            // Recalculate security score
            setTimeout(calculateSecurityScore, 100);
        } catch (e) {
            toast({
                title: "Error",
                description: "Could not save your security setting.",
                variant: "destructive",
            });
        }
    };

    const getSecurityScoreColor = (score: number) => {
        if (score >= 90) return "text-green-500";
        if (score >= 70) return "text-yellow-500";
        return "text-red-500";
    };

    const getSecurityScoreLabel = (score: number) => {
        if (score >= 90) return "Excellent";
        if (score >= 70) return "Good";
        if (score >= 50) return "Fair";
        return "Poor";
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        return `${days} days ago`;
    };

    return (
        <div className="flex flex-col h-full bg-muted/40">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="lg:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">Security & Privacy</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-4xl space-y-6">

                    {/* Security Score Card */}
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Security Score
                            </CardTitle>
                            <CardDescription>Your account security rating</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="relative w-24 h-24">
                                    <svg className="w-24 h-24 transform -rotate-90">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-muted"
                                        />
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${securityScore * 2.51} 251`}
                                            className={getSecurityScoreColor(securityScore)}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-2xl font-bold ${getSecurityScoreColor(securityScore)}`}>
                                            {securityScore}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">{getSecurityScoreLabel(securityScore)}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {securityScore >= 90
                                            ? "Your account has excellent security."
                                            : securityScore >= 70
                                                ? "Your account is well protected, but can be improved."
                                                : "Consider enabling more security features."}
                                    </p>
                                    {securityScore < 90 && (
                                        <Button variant="outline" size="sm" className="mt-2">
                                            View Recommendations
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Features */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="w-5 h-5" />
                                Security Features
                            </CardTitle>
                            <CardDescription>Manage your account security settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">

                            {/* Two-Factor Authentication */}
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="space-y-1 flex-1">
                                    <Label htmlFor="two-factor" className="font-semibold flex items-center gap-2">
                                        <Key className="w-4 h-4 text-primary" />
                                        Two-Factor Authentication (2FA)
                                        {twoFactorEnabled && (
                                            <Badge variant="default" className="ml-2">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Enabled
                                            </Badge>
                                        )}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Add an extra layer of security with 2FA verification codes
                                    </p>
                                </div>
                                <Switch
                                    id="two-factor"
                                    checked={twoFactorEnabled}
                                    onCheckedChange={(value) => handleSettingChange('twoFactor', value)}
                                />
                            </div>

                            {/* Login Notifications */}
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="space-y-1 flex-1">
                                    <Label htmlFor="login-notifications" className="font-semibold flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-primary" />
                                        Login Notifications
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Get notified when someone logs into your account
                                    </p>
                                </div>
                                <Switch
                                    id="login-notifications"
                                    checked={loginNotifications}
                                    onCheckedChange={(value) => handleSettingChange('loginNotifications', value)}
                                />
                            </div>

                        </CardContent>
                    </Card>

                    {/* Privacy Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Privacy Settings
                            </CardTitle>
                            <CardDescription>Control how your data is used</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="space-y-1 flex-1">
                                    <Label htmlFor="share-data" className="font-semibold flex items-center gap-2">
                                        <Share2 className="w-4 h-4 text-primary" />
                                        Share Anonymous Usage Data
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Help us improve SearnAI by sharing anonymous usage data. We never collect personal information.
                                    </p>
                                </div>
                                <Switch
                                    id="share-data"
                                    checked={shareData}
                                    onCheckedChange={(value) => handleSettingChange('shareData', value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Recent Security Activity
                            </CardTitle>
                            <CardDescription>Monitor recent security events on your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {securityLogs.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No recent security activity</p>
                                    </div>
                                ) : (
                                    securityLogs.map((log) => (
                                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border">
                                            {log.severity === 'error' ? (
                                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                            ) : log.severity === 'warning' ? (
                                                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                                            ) : (
                                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{log.message}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatTimestamp(log.timestamp)}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {log.type}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Recommendations */}
                    <Card className="border-yellow-500/50 bg-yellow-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                                <AlertTriangle className="w-5 h-5" />
                                Security Recommendations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {!twoFactorEnabled && (
                                <div className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-yellow-600" />
                                    <span>Enable Two-Factor Authentication for better security</span>
                                </div>
                            )}
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 text-yellow-600" />
                                <span>Use a strong, unique password with at least 12 characters</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 text-yellow-600" />
                                <span>Review active sessions regularly</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 text-yellow-600" />
                                <span>Keep your recovery email and phone number up to date</span>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
    );
}

