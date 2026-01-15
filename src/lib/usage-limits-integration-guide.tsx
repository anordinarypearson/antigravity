/**
 * USAGE LIMITS INTEGRATION GUIDE
 * 
 * This file demonstrates how to integrate usage limits into your components.
 * Follow these patterns across all features that need usage tracking.
 */

import { useUsageLimits } from '@/hooks/use-usage-limits';
import { UsageLimitDialog } from '@/components/usage-limit-dialog';
import { useState } from 'react';
import { UsageType } from '@/lib/subscription-limits';

/**
 * EXAMPLE 1: Chat Component Integration
 * 
 * Add usage limits to AI chat messages
 */
export function ChatComponentExample() {
    const { canUseFeature, incrementUsage, subscription } = useUsageLimits();
    const [showLimitDialog, setShowLimitDialog] = useState(false);
    const [limitInfo, setLimitInfo] = useState<{
        type: UsageType;
        current: number;
        limit: number;
    } | null>(null);

    const handleSendMessage = async (message: string) => {
        // Check if user can send a message
        const check = canUseFeature('aiMessagesPerMonth');

        if (!check.allowed) {
            // Show limit dialog
            setLimitInfo({
                type: 'aiMessagesPerMonth',
                current: check.current,
                limit: check.limit,
            });
            setShowLimitDialog(true);
            return;
        }

        // Increment usage counter
        const success = await incrementUsage('aiMessagesPerMonth');

        if (!success) {
            // Handle error
            console.error('Failed to increment usage');
            return;
        }

        // Proceed with sending message
        // ... your existing logic
    };

    return (
        <>
            {/* Your chat UI */}
            <button onClick={() => handleSendMessage('Hello')}>
                Send Message
            </button>

            {/* Usage limit dialog */}
            {limitInfo && (
                <UsageLimitDialog
                    isOpen={showLimitDialog}
                    onOpenChange={setShowLimitDialog}
                    limitType={limitInfo.type}
                    currentUsage={limitInfo.current}
                    limit={limitInfo.limit}
                    currentTier={subscription?.tier || 'free'}
                />
            )}
        </>
    );
}

/**
 * EXAMPLE 2: Flashcard Generation Integration
 */
export function FlashcardGeneratorExample() {
    const { canUseFeature, incrementUsage, subscription } = useUsageLimits();
    const [showLimitDialog, setShowLimitDialog] = useState(false);
    const [limitInfo, setLimitInfo] = useState<any>(null);

    const handleGenerateFlashcards = async () => {
        const check = canUseFeature('flashcardsPerDay');

        if (!check.allowed) {
            setLimitInfo({
                type: 'flashcardsPerDay',
                current: check.current,
                limit: check.limit,
            });
            setShowLimitDialog(true);
            return;
        }

        await incrementUsage('flashcardsPerDay');

        // Generate flashcards
        // ... your logic
    };

    return (
        <>
            <button onClick={handleGenerateFlashcards}>
                Generate Flashcards
            </button>

            {limitInfo && (
                <UsageLimitDialog
                    isOpen={showLimitDialog}
                    onOpenChange={setShowLimitDialog}
                    limitType={limitInfo.type}
                    currentUsage={limitInfo.current}
                    limit={limitInfo.limit}
                    currentTier={subscription?.tier || 'free'}
                />
            )}
        </>
    );
}

/**
 * EXAMPLE 3: Quiz Generation Integration
 */
export function QuizGeneratorExample() {
    const { canUseFeature, incrementUsage, subscription } = useUsageLimits();
    const [showLimitDialog, setShowLimitDialog] = useState(false);
    const [limitInfo, setLimitInfo] = useState<any>(null);

    const handleGenerateQuiz = async () => {
        const check = canUseFeature('quizGenerationsPerDay');

        if (!check.allowed) {
            setLimitInfo({
                type: 'quizGenerationsPerDay',
                current: check.current,
                limit: check.limit,
            });
            setShowLimitDialog(true);
            return;
        }

        await incrementUsage('quizGenerationsPerDay');

        // Generate quiz
        // ... your logic
    };

    return (
        <>
            <button onClick={handleGenerateQuiz}>
                Generate Quiz
            </button>

            {limitInfo && (
                <UsageLimitDialog
                    isOpen={showLimitDialog}
                    onOpenChange={setShowLimitDialog}
                    limitType={limitInfo.type}
                    currentUsage={limitInfo.current}
                    limit={limitInfo.limit}
                    currentTier={subscription?.tier || 'free'}
                />
            )}
        </>
    );
}

/**
 * EXAMPLE 4: PDF Upload Integration
 */
export function PDFUploadExample() {
    const { canUseFeature, incrementUsage, subscription } = useUsageLimits();
    const [showLimitDialog, setShowLimitDialog] = useState(false);
    const [limitInfo, setLimitInfo] = useState<any>(null);

    const handlePDFUpload = async (file: File) => {
        const check = canUseFeature('pdfUploadsPerDay');

        if (!check.allowed) {
            setLimitInfo({
                type: 'pdfUploadsPerDay',
                current: check.current,
                limit: check.limit,
            });
            setShowLimitDialog(true);
            return;
        }

        await incrementUsage('pdfUploadsPerDay');

        // Process PDF
        // ... your logic
    };

    return (
        <>
            <input type="file" accept=".pdf" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePDFUpload(file);
            }} />

            {limitInfo && (
                <UsageLimitDialog
                    isOpen={showLimitDialog}
                    onOpenChange={setShowLimitDialog}
                    limitType={limitInfo.type}
                    currentUsage={limitInfo.current}
                    limit={limitInfo.limit}
                    currentTier={subscription?.tier || 'free'}
                />
            )}
        </>
    );
}

/**
 * EXAMPLE 5: Image Generation Integration
 */
export function ImageGeneratorExample() {
    const { canUseFeature, incrementUsage, subscription } = useUsageLimits();
    const [showLimitDialog, setShowLimitDialog] = useState(false);
    const [limitInfo, setLimitInfo] = useState<any>(null);

    const handleGenerateImage = async (prompt: string) => {
        const check = canUseFeature('imageGenerationsPerDay');

        if (!check.allowed) {
            setLimitInfo({
                type: 'imageGenerationsPerDay',
                current: check.current,
                limit: check.limit,
            });
            setShowLimitDialog(true);
            return;
        }

        await incrementUsage('imageGenerationsPerDay');

        // Generate image
        // ... your logic
    };

    return (
        <>
            <button onClick={() => handleGenerateImage('A beautiful sunset')}>
                Generate Image
            </button>

            {limitInfo && (
                <UsageLimitDialog
                    isOpen={showLimitDialog}
                    onOpenChange={setShowLimitDialog}
                    limitType={limitInfo.type}
                    currentUsage={limitInfo.current}
                    limit={limitInfo.limit}
                    currentTier={subscription?.tier || 'free'}
                />
            )}
        </>
    );
}

/**
 * FEATURES TO INTEGRATE:
 * 
 * 1. ✅ AI Chat Messages - aiMessagesPerMonth
 * 2. ✅ Flashcard Generation - flashcardsPerDay
 * 3. ✅ Quiz Generation - quizGenerationsPerDay
 * 4. Study Sessions - studySessionsPerDay
 * 5. ✅ Image Generation - imageGenerationsPerDay
 * 6. ✅ PDF Uploads - pdfUploadsPerDay
 * 7. Web Scraping - webScrapesPerDay
 * 8. YouTube Extractions - youtubeExtractionsPerDay
 * 9. Mind Maps - mindMapsPerDay
 * 10. Presentations - presentationsPerDay
 * 11. Question Papers - questionPapersPerDay
 * 12. Code Analysis - codeAnalysisPerDay
 * 13. Image Search - imageSearchesPerDay
 * 14. Web Search AI - webSearchAIPerDay
 * 
 * Apply the same pattern to all these features!
 */
