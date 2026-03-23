
"use client";

import type { AnalyzeContentOutput, GenerateFlashcardsOutput, GenerateQuizzesOutput } from "@/app/actions";
import { analyzeContentAction, generateFlashcardsAction, textToSpeechAction, chatWithTutorAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileUp,  Wand2, Image as ImageIcon, X, Volume2, Pilcrow, BrainCircuit, HelpCircle, BookCopy, ListTree, Code, Copy, Mic, MicOff, Camera } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import React, { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { Flashcard } from "./flashcard";
import { SidebarTrigger } from "./ui/sidebar";
import { SharedHeader } from "./shared-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { TutorChat } from "./tutor-chat";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import Image from "next/image";
import { BackButton } from "./back-button";
import { Progress } from "./ui/progress";
import Tesseract from 'tesseract.js';
import { CameraCaptureDialog } from "./camera-capture-dialog";

declare const puter: any;

export function StudyNowContent() {
  const [content, setContent] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeContentOutput | null>(null);
  const [flashcards, setFlashcards] = useState<GenerateFlashcardsOutput['flashcards'] | null>(null);

  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("analysis");
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [isLoadingMaterial, startLoadingMaterial] = useTransition();
  const [isGeneratingFlashcards, startGeneratingFlashcards] = useTransition();
  const [isGeneratingQuiz, startGeneratingQuiz] = useTransition();
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);


  useEffect(() => {
    // Check for content from PDF Hub
    const pdfContent = localStorage.getItem('pdfStudyContent');
    if (pdfContent) {
      try {
        const { title: pdfTitle, content: pdfText } = JSON.parse(pdfContent);
        setTitle(pdfTitle);
        setContent(pdfText);
        toast({
          title: "PDF Content Loaded",
          description: `Successfully loaded content from ${pdfTitle}.pdf. Click Analyze to begin.`,
        });
      } catch (e) {
        console.error("Failed to parse PDF content from localStorage", e);
      } finally {
        // Clear the item so it's not loaded again on subsequent visits
        localStorage.removeItem('pdfStudyContent');
      }
    }
  }, [toast]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        setFinalTranscript("");
      };
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = (event: any) => {
        toast({ title: "Speech Recognition Error", description: event.error, variant: "destructive" });
        setIsRecording(false);
      };
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let currentFinalTranscript = finalTranscript;
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setFinalTranscript(currentFinalTranscript);
        setContent(currentFinalTranscript + interimTranscript);
      };
    }
  }, [toast, finalTranscript]);

  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser does not support voice-to-text.",
        variant: "destructive",
      });
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setContent('');
      setFinalTranscript('');
      recognitionRef.current.start();
    }
  };


  const handleAnalyze = useCallback(async () => {
    if (content.trim().length < 50) {
      toast({
        title: "Content too short",
        description: "Please provide at least 50 characters for a better analysis.",
        variant: "destructive",
      });
      return;
    }
    startAnalyzing(async () => {
      const result = await analyzeContentAction(content);
      if (result.error) {
        toast({ title: "Analysis Failed", description: result.error, variant: "destructive" });
      } else if (result.data) {
        setAnalysis(result.data ?? null);
        setFlashcards(null);
        setActiveTab("analysis");
      }
    });
  }, [content, toast]);

  const handleGenerateFlashcards = useCallback(async () => {
    if (!analysis) return;
    startGeneratingFlashcards(async () => {
      const flashcardContent = `Key Concepts: ${analysis.keyConcepts.map(c => c.concept).join(', ')}. Questions: ${analysis.potentialQuestions?.join(' ')}`;
      const result = await generateFlashcardsAction({ content: flashcardContent });
      if (result.error) {
        toast({ title: "Flashcard Generation Failed", description: result.error, variant: "destructive" });
      } else {
        setFlashcards(result.data?.flashcards ?? []);
        setActiveTab("flashcards");
      }
    });
  }, [analysis, toast]);

  const handleGenerateQuiz = async () => {
    if (!analysis) return;
    try {
      const quizContent = `Key Concepts: ${analysis.keyConcepts.map(c => c.concept).join(', ')}. Questions: ${analysis.potentialQuestions?.join(' ')}`;
      localStorage.setItem('quizContent', quizContent);
      router.push('/quiz/options');
    } catch (e) {
      toast({
        title: "Could not start quiz",
        description: "There was an error while preparing the quiz content.",
        variant: "destructive",
      });
    }
  };

  const handleFileUploadClick = () => fileInputRef.current?.click();
  const handleImageUploadClick = () => imageInputRef.current?.click();

  const handleTextToSpeech = async (text: string, id: string) => {
    if (isSynthesizing === id) {
      setAudioDataUri(null);
      setIsSynthesizing(null);
      return;
    }
    setIsSynthesizing(id);
    setAudioDataUri(null);
    try {
      const result = await textToSpeechAction({ text });
      if (result.error) {
        toast({ title: 'Audio Generation Failed', description: result.error, variant: 'destructive' });
        setIsSynthesizing(null);
      } else if (result.data) {
        setAudioDataUri(result.data.audioDataUri);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      setIsSynthesizing(null);
    }
  };

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${type} Copied!`, description: `The ${type.toLowerCase()} has been copied to your clipboard.` });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setContent(text);
          setTitle(file.name.replace('.txt', ''));
          setAnalysis(null); setFlashcards(null); setImageDataUri(null);
          toast({ title: "File loaded", description: "The file content has been loaded. Click Analyze to begin." });
        };
        reader.readAsText(file);
      } else {
        toast({ title: "Invalid file type", description: "Please upload a .txt file.", variant: "destructive" });
      }
    }
  };

  const preprocessImage = (file: File, maxSize: number = 2000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement("img");
        img.onload = () => {
          let { width, height } = img;
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Could not get canvas context"));

          // Grayscale and contrast
          ctx.filter = 'grayscale(1) contrast(1.5)';
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.95)); // Use high quality JPEG
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file (e.g., PNG, JPG).", variant: "destructive" });
      return;
    }

    startLoadingMaterial(async () => {
      setIsOcrProcessing(true);
      setOcrProgress(0);

      try {
        const processedDataUri = await preprocessImage(file);
        setImageDataUri(processedDataUri);
        setAnalysis(null);
        setFlashcards(null);

        const { data: { text } } = await Tesseract.recognize(
          processedDataUri,
          'eng',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                setOcrProgress(Math.round(m.progress * 100));
              }
            }
          }
        );
        setContent(text);
        setTitle(file.name);
        toast({ title: "Image & Text Loaded!", description: "Text has been extracted via OCR. Click Analyze to begin." });
      } catch (error: any) {
        toast({ title: "Image processing or OCR failed", description: error.message || "Could not read or process the image file.", variant: "destructive" });
        setImageDataUri(null);
        setContent("");
      } finally {
        setIsOcrProcessing(false);
      }
    });
  };

  const clearImage = () => {
    setImageDataUri(null); setTitle(""); setContent(""); setAnalysis(null); setFlashcards(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  const handleTutorChat = async (history: any) => await chatWithTutorAction({ content, history });

  const handleCaptureImage = (dataUri: string) => {
    startLoadingMaterial(async () => {
      setIsOcrProcessing(true);
      setOcrProgress(0);
      try {
        setImageDataUri(dataUri);
        const { data: { text } } = await Tesseract.recognize(
          dataUri,
          'eng',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                setOcrProgress(Math.round(m.progress * 100));
              }
            }
          }
        );
        setContent(text || "");
        setTitle("Camera Capture");
        setAnalysis(null);
        setFlashcards(null);
        toast({ title: "Image Captured & Text Extracted!", description: "The captured image is ready for analysis." });
      } catch (error: any) {
        toast({ title: "OCR Failed", description: error.message || "Could not extract text from the captured image.", variant: "destructive" });
        setContent("");
      } finally {
        setIsOcrProcessing(false);
      }
    });
  };

  const isLoading = isAnalyzing || isLoadingMaterial || isGeneratingFlashcards || isGeneratingQuiz;

  const TABS = [
    { value: "analysis", label: "Analysis", disabled: !analysis },
    { value: "flashcards", label: "Flashcards", disabled: !analysis },
    { value: "quiz", label: "Quiz", disabled: !analysis },
    { value: "tutor", label: "Tutor", disabled: !analysis }
  ];

  return (
    <div className="flex h-screen flex-col bg-muted/40">
      <CameraCaptureDialog
        isOpen={isCameraDialogOpen}
        onOpenChange={setIsCameraDialogOpen}
        onCapture={handleCaptureImage}
      />
      <SharedHeader
        title="Study Session"
        leftElement={<BackButton />}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card className="flex flex-col @container">
            <CardHeader>
              <CardTitle>Your Study Material</CardTitle>
              <CardDescription>Paste text, upload a document, or capture an image. Analysis is done by Qwen.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <Input placeholder="Enter a title for your material..." value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-semibold" disabled={isLoading} />
              {isLoadingMaterial ? <Skeleton className="w-full h-full min-h-[300px] flex-1" /> : imageDataUri ? (
                <div className="relative flex-1 min-h-[300px]">
                  <Image src={imageDataUri} alt="Uploaded content" layout="fill" objectFit="contain" className="rounded-md border" />
                  {isOcrProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-md">
                      <WavyLoader className="h-8 w-8 animate-spin text-white" />
                      <p className="text-white mt-2">Extracting text... {ocrProgress}%</p>
                      <Progress value={ocrProgress} className="w-40 mt-2 h-1" />
                    </div>
                  )}
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-10 h-8 w-8" onClick={clearImage} disabled={isOcrProcessing}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="relative h-full">
                  <Textarea placeholder="Paste your study content here... (min. 50 characters)" className="h-full min-h-[300px] resize-none pr-10" value={content} onChange={(e) => setContent(e.target.value)} />
                  <Button size="icon" variant={isRecording ? 'destructive' : 'ghost'} onClick={handleToggleRecording} className="absolute bottom-3 right-3">
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span className="sr-only">{isRecording ? 'Stop recording' : 'Start recording'}</span>
                  </Button>
                </div>
              )}
              {imageDataUri && <Textarea placeholder="Text extracted via OCR will appear here. You can edit it before analysis." className="h-24 resize-none" value={content} onChange={(e) => setContent(e.target.value)} />}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2 @sm:flex-row">
              <Button onClick={handleAnalyze} disabled={isLoading || isOcrProcessing || content.trim().length < 50} className="w-full sm:w-auto h-11 touch-manipulation">
                {isAnalyzing ? <WavyLoader className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Analyze
              </Button>
              <div className="flex items-stretch gap-2 flex-1">
                <Button variant="outline" className="flex-1 h-11 touch-manipulation" onClick={handleFileUploadClick} disabled={isLoading}><FileUp className="mr-2 h-4 w-4" /><span className="hidden sm:inline">.txt</span><span className="sm:hidden">Text</span></Button>
                <Button variant="outline" className="flex-1 h-11 touch-manipulation" onClick={handleImageUploadClick} disabled={isLoading}><ImageIcon className="mr-2 h-4 w-4" />Image</Button>
                <Button variant="outline" className="flex-1 h-11 touch-manipulation" onClick={() => setIsCameraDialogOpen(true)} disabled={isLoading}><Camera className="mr-2 h-4 w-4" /><span className="hidden sm:inline">Capture</span><span className="sm:hidden">Cam</span></Button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt" />
              <input type="file" ref={imageInputRef} onChange={handleImageFileChange} className="hidden" accept="image/*" />
            </CardFooter>
          </Card>

          <Card className="flex flex-col @container min-h-[400px]">
            <CardHeader>
              <CardTitle>AI-Powered Study Tools</CardTitle>
              <CardDescription>Tools are powered by their optimal AI models.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {isAnalyzing && !analysis ? (
                <div className="space-y-4 p-1">
                  <Skeleton className="h-8 w-1/3" /><Skeleton className="h-20 w-full" /><Skeleton className="h-8 w-1/3" /><Skeleton className="h-20 w-full" />
                </div>
              ) : !analysis ? (
                <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/50">
                  <div className="text-center p-8">
                    <Wand2 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Ready to Learn?</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Analyze your material to generate study tools.</p>
                  </div>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
                  <TabsList className="grid w-full grid-cols-4 h-auto">
                    {TABS.map(tab => <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled} className="py-2.5 text-xs sm:text-sm touch-manipulation">{tab.label}</TabsTrigger>)}
                  </TabsList>
                  <ScrollArea className="mt-4 flex-1">
                    <TabsContent value="analysis" className="h-full">
                      <Accordion type="multiple" defaultValue={['summary', 'key-concepts']} className="w-full space-y-3 pr-4">
                        <AccordionItem value="summary" className="rounded-md border bg-card px-4">
                          <AccordionTrigger className="py-4 text-left font-medium hover:no-underline text-base"><div className="flex items-center gap-3"><Pilcrow />Summary</div></AccordionTrigger>
                          <AccordionContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                            <div className="flex justify-end">
                              <Button size="icon" variant="ghost" onClick={() => handleTextToSpeech(analysis.summary, 'summary')} disabled={!!isSynthesizing} className="mb-2">
                                {isSynthesizing === 'summary' ? <WavyLoader className="animate-spin" /> : <Volume2 />}
                              </Button>
                            </div>
                            {audioDataUri && isSynthesizing === 'summary' && (
                              <div className="mb-2">
                                <audio controls autoPlay src={audioDataUri} className="w-full" onEnded={() => { setAudioDataUri(null); setIsSynthesizing(null); }} />
                              </div>
                            )}
                            <p>{analysis.summary}</p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="key-concepts" className="rounded-md border bg-card px-4">
                          <AccordionTrigger className="py-4 text-left font-medium hover:no-underline text-base"><div className="flex items-center gap-3"><BrainCircuit />Key Concepts</div></AccordionTrigger>
                          <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                            {analysis.keyConcepts?.map((concept, i) => <div key={i} className="py-2"><p className="font-semibold !my-0">{concept.concept}</p><p className="text-muted-foreground !my-0">{concept.explanation}</p></div>)}
                          </AccordionContent>
                        </AccordionItem>
                        {analysis.codeExamples?.length > 0 && (
                          <AccordionItem value="code-examples" className="rounded-md border bg-card px-4">
                            <AccordionTrigger className="py-4 text-left font-medium hover:no-underline text-base"><div className="flex items-center gap-3"><Code />Code Examples</div></AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              {analysis.codeExamples.map((example, i) => <div key={i} className="space-y-2"><p className="text-sm text-muted-foreground">{example.explanation}</p><div className="relative rounded-md bg-muted/50 p-4 font-mono text-xs"><Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => handleCopyToClipboard(example.code, "Code")}><Copy className="h-4 w-4" /></Button><pre className="whitespace-pre-wrap"><code>{example.code}</code></pre></div></div>)}
                            </AccordionContent>
                          </AccordionItem>
                        )}
                        <AccordionItem value="potential-questions" className="rounded-md border bg-card px-4">
                          <AccordionTrigger className="py-4 text-left font-medium hover:no-underline text-base"><div className="flex items-center gap-3"><HelpCircle />Potential Questions</div></AccordionTrigger>
                          <AccordionContent className="prose-sm dark:prose-invert max-w-none">
                            <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">{analysis.potentialQuestions?.map((q, i) => <li key={i}>{q}</li>)}</ul>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="related-topics" className="rounded-md border bg-card px-4">
                          <AccordionTrigger className="py-4 text-left font-medium hover:no-underline text-base"><div className="flex items-center gap-3"><ListTree />Related Topics</div></AccordionTrigger>
                          <AccordionContent className="prose-sm dark:prose-invert max-w-none">
                            <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">{analysis.relatedTopics?.map((q, i) => <li key={i}>{q}</li>)}</ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>
                    <TabsContent value="flashcards" className="h-full">
                      {isGeneratingFlashcards ? <div className="flex h-full items-center justify-center gap-2 text-muted-foreground"><WavyLoader className="animate-spin" /> <p>Generating flashcards...</p></div> : flashcards ? (
                        <div className="grid grid-cols-1 gap-4 pr-4 @md:grid-cols-2">
                          {flashcards.map((card, i) => <Flashcard key={i} {...card} />)}
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Button onClick={handleGenerateFlashcards} disabled={isGeneratingFlashcards} className="h-11 touch-manipulation"><BookCopy className="mr-2 h-4 w-4" />Generate Flashcards</Button>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="quiz" className="h-full">
                      {isGeneratingQuiz ? <div className="flex h-full items-center justify-center gap-2 text-muted-foreground"><WavyLoader className="animate-spin" /> <p>Generating quiz...</p></div> : (
                        <div className="flex h-full items-center justify-center">
                          <Button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz} className="h-11 touch-manipulation"><HelpCircle className="mr-2 h-4 w-4" />Generate Quiz & Start</Button>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="tutor" className="h-full">
                      <TutorChat content={analysis ? (imageDataUri ? `Image name: ${title}. Key Concepts from Image: ${analysis.keyConcepts.map(c => c.concept).join(', ')}. Potential Questions from Image: ${analysis.potentialQuestions?.join(' ')}` : content) : content} onSendMessage={handleTutorChat} />
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </main >
    </div >
  );
}
