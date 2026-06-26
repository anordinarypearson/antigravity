
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Printer, FileText } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { BackButton } from "./back-button";
import type { GenerateQuestionPaperOutput } from "@/lib/question-paper-types";
import { Separator } from "./ui/separator";

export function QuestionPaperViewer() {
    const [paper, setPaper] = useState<GenerateQuestionPaperOutput | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        try {
            const savedPaper = localStorage.getItem('questionPaper');
            if (savedPaper) {
                setPaper(JSON.parse(savedPaper));
            } else {
                toast({ title: "No Paper Found", description: "Please generate a question paper first.", variant: "destructive" });
                router.push('/question-paper');
            }
        } catch (e) {
            toast({ title: "Error", description: "Could not load the question paper data.", variant: "destructive" });
            router.push('/question-paper');
        }
    }, [router, toast]);
    
    const handlePrint = () => {
        const printContent = document.getElementById("printable-paper")?.innerHTML;
        if (!printContent) return;

        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print Question Paper</title>');
            printWindow.document.write('<style>body{font-family:sans-serif;padding:2rem}h1,h2,h3{margin-bottom:0.5rem;text-align:center;}ul{padding-left:1.5rem;margin-bottom:1rem}.question-item{margin-bottom:1rem;page-break-inside:avoid;}.marks{float:right;font-weight:bold;}.section-title{font-weight:bold;font-size:1.25rem;text-align:center;margin-top:1.5rem;margin-bottom:1rem;}.mcq-options{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem 1rem;padding-left:1.5rem;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };

    if (!paper) {
        return null; // Loading state is handled by the page's dynamic import
    }

    return (
        <div className="flex h-full flex-col bg-muted/20 dark:bg-transparent">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">Question Paper Viewer</h1>
                </div>
                <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <Card className="max-w-4xl mx-auto shadow-lg" id="printable-paper">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">{paper.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 py-6">
                        <div>
                            <h3 className="font-semibold mb-2 text-center">General Instructions:</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mx-auto max-w-2xl">
                                {paper.generalInstructions.map((inst, i) => <li key={i}>{inst}</li>)}
                            </ul>
                        </div>
                        <Separator />
                        
                        {paper.sectionA?.length > 0 && <div className="space-y-4 pt-4">
                            <h3 className="section-title">Section A</h3>
                            {paper.sectionA.map((q, i) => <div key={i} className="question-item">
                                <p>{i+1}. {q.question}<span className="marks">({q.marks})</span></p>
                                <div className="mcq-options mt-2">
                                    <span>(a) {q.options.a}</span>
                                    <span>(b) {q.options.b}</span>
                                    <span>(c) {q.options.c}</span>
                                    <span>(d) {q.options.d}</span>
                                </div>
                            </div>)}
                        </div>}

                        {paper.sectionB?.length > 0 && <div className="space-y-4 pt-4">
                            <h3 className="section-title">Section B</h3>
                            {paper.sectionB.map((q, i) => <div key={i} className="question-item"><p>{i+1}. {q.question}<span className="marks">({q.marks})</span></p></div>)}
                        </div>}

                        {paper.sectionC?.length > 0 && <div className="space-y-4 pt-4">
                             <h3 className="section-title">Section C</h3>
                            {paper.sectionC.map((q, i) => <div key={i} className="question-item"><p>{i+1}. {q.question}<span className="marks">({q.marks})</span></p></div>)}
                        </div>}

                        {paper.sectionD?.length > 0 && <div className="space-y-4 pt-4">
                            <h3 className="section-title">Section D</h3>
                            {paper.sectionD.map((q, i) => <div key={i} className="question-item"><p>{i+1}. {q.question}<span className="marks">({q.marks})</span></p></div>)}
                        </div>}

                        {paper.sectionE?.length > 0 && <div className="space-y-4 pt-4">
                            <h3 className="section-title">Section E</h3>
                            {paper.sectionE.map((c, i) => <div key={i} className="question-item space-y-2">
                                <p className="font-semibold">{i+1}. Case Study:</p>
                                <p className="text-sm text-muted-foreground border-l-2 pl-4 italic">{c.case}</p>
                                {c.questions.map((q, qi) => <p key={qi} className="pl-4">{String.fromCharCode(97 + qi)}) {q.question}<span className="marks">({q.marks})</span></p>)}
                            </div>)}
                        </div>}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
