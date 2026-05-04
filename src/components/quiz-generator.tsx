
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileQuestion, Wand2, Mic, MicOff } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';

export function QuizGenerator() {
  const [content, setContent] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = (event: any) => {
            toast({ title: "Speech Recognition Error", description: event.error, variant: "destructive" });
            setIsRecording(false);
        };
        recognition.onresult = (event: any) => {
            let fullTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    fullTranscript += event.results[i][0].transcript;
                }
            }
            if (fullTranscript) {
                setContent(prev => prev + fullTranscript + ' ');
            }
        };
    }
  }, [toast]);

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
        recognitionRef.current.start();
    }
  };

  const handleProceedToOptions = () => {
    if (content.trim().length < 50) {
      toast({
        title: "Content too short",
        description: "Please provide at least 50 characters to generate a quiz.",
        variant: "destructive",
      });
      return;
    }
    // We will store the content in localStorage to pass it to the next page.
    // This is simpler than passing potentially very long text in a URL.
    try {
        localStorage.setItem('quizContent', content);
        router.push('/quiz/options');
    } catch (e) {
        toast({
            title: "Could not save content",
            description: "There was an error while trying to proceed. Please try again.",
            variant: "destructive",
        });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex flex-col flex-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Generate a Quiz</CardTitle>
          <CardDescription>Paste your study material below to begin creating your quiz.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="relative h-full">
            <Textarea
              placeholder="Paste your content here..."
              className="h-full min-h-[300px] resize-none pr-10"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
             <Button
                size="icon"
                variant={isRecording ? 'destructive' : 'ghost'}
                onClick={handleToggleRecording}
                className="absolute bottom-3 right-3"
                >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                <span className="sr-only">{isRecording ? 'Stop recording' : 'Start recording'}</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleProceedToOptions} disabled={content.trim().length < 50}>
            <Wand2 className="mr-2 h-4 w-4" />
            Proceed to Quiz Options
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    
