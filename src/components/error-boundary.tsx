"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { CircleAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[400px] w-full items-center justify-center p-4">
                    <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
                        <CardHeader>
                            <div className="flex items-center gap-2 text-destructive">
                                <CircleAlert className="h-6 w-6" />
                                <CardTitle>Something went wrong</CardTitle>
                            </div>
                            <CardDescription>
                                An unexpected error occurred while rendering this component.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-md bg-background/50 p-4 text-sm font-mono text-muted-foreground">
                                {this.state.error?.message || "Unknown error"}
                            </div>
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                    window.location.reload();
                                }}
                            >
                                <RotateCw className="h-4 w-4" />
                                Reload Page
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
