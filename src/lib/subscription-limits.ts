/**
 * Subscription tiers and their usage limits
 */

export type SubscriptionTier = 'free' | 'go' | 'plus' | 'pro';

export interface UsageLimits {
    // AI Chat messages
    aiMessagesPerMonth: number;

    // Combined Messages (Chat, Flashcards, Quiz, etc.)
    messagesPerDay: number;

    // Flashcards
    flashcardsPerDay: number;
    flashcardsPerMonth: number;

    // Quiz generations
    quizGenerationsPerDay: number;
    quizGenerationsPerMonth: number;

    // Study sessions
    studySessionsPerDay: number;

    // Image generations
    imageGenerationsPerDay: number;
    imageGenerationsPerMonth: number;

    // PDF uploads
    pdfUploadsPerDay: number;
    pdfUploadsPerMonth: number;

    // Web scraping
    webScrapesPerDay: number;

    // YouTube extractions
    youtubeExtractionsPerDay: number;

    // Mind maps
    mindMapsPerDay: number;

    // Presentations
    presentationsPerDay: number;

    // Question papers
    questionPapersPerDay: number;

    // Code analysis
    codeAnalysisPerDay: number;

    // Image search
    imageSearchesPerDay: number;

    // Web search AI
    webSearchAIPerDay: number;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, UsageLimits> = {
    free: {
        aiMessagesPerMonth: -1,
        messagesPerDay: -1,
        flashcardsPerDay: -1,
        flashcardsPerMonth: -1,
        quizGenerationsPerDay: -1,
        quizGenerationsPerMonth: -1,
        studySessionsPerDay: -1,
        imageGenerationsPerDay: -1,
        imageGenerationsPerMonth: -1,
        pdfUploadsPerDay: -1,
        pdfUploadsPerMonth: -1,
        webScrapesPerDay: -1,
        youtubeExtractionsPerDay: -1,
        mindMapsPerDay: -1,
        presentationsPerDay: -1,
        questionPapersPerDay: -1,
        codeAnalysisPerDay: -1,
        imageSearchesPerDay: -1,
        webSearchAIPerDay: -1,
    },
    go: {
        aiMessagesPerMonth: 500,
        messagesPerDay: 500,
        flashcardsPerDay: 50,
        flashcardsPerMonth: 1000,
        quizGenerationsPerDay: 50,
        quizGenerationsPerMonth: 1000,
        studySessionsPerDay: 20,
        imageGenerationsPerDay: 20,
        imageGenerationsPerMonth: 500,
        pdfUploadsPerDay: 20,
        pdfUploadsPerMonth: 500,
        webScrapesPerDay: 50,
        youtubeExtractionsPerDay: 50,
        mindMapsPerDay: 30,
        presentationsPerDay: 20,
        questionPapersPerDay: 30,
        codeAnalysisPerDay: 50,
        imageSearchesPerDay: 100,
        webSearchAIPerDay: 100,
    },
    plus: {
        aiMessagesPerMonth: -1, // unlimited
        messagesPerDay: -1, // unlimited
        flashcardsPerDay: -1,
        flashcardsPerMonth: -1,
        quizGenerationsPerDay: -1,
        quizGenerationsPerMonth: -1,
        studySessionsPerDay: -1,
        imageGenerationsPerDay: -1,
        imageGenerationsPerMonth: -1,
        pdfUploadsPerDay: -1,
        pdfUploadsPerMonth: -1,
        webScrapesPerDay: -1,
        youtubeExtractionsPerDay: -1,
        mindMapsPerDay: -1,
        presentationsPerDay: -1,
        questionPapersPerDay: -1,
        codeAnalysisPerDay: -1,
        imageSearchesPerDay: -1,
        webSearchAIPerDay: -1,
    },
    pro: {
        aiMessagesPerMonth: -1, // unlimited
        messagesPerDay: -1, // unlimited
        flashcardsPerDay: -1,
        flashcardsPerMonth: -1,
        quizGenerationsPerDay: -1,
        quizGenerationsPerMonth: -1,
        studySessionsPerDay: -1,
        imageGenerationsPerDay: -1,
        imageGenerationsPerMonth: -1,
        pdfUploadsPerDay: -1,
        pdfUploadsPerMonth: -1,
        webScrapesPerDay: -1,
        youtubeExtractionsPerDay: -1,
        mindMapsPerDay: -1,
        presentationsPerDay: -1,
        questionPapersPerDay: -1,
        codeAnalysisPerDay: -1,
        imageSearchesPerDay: -1,
        webSearchAIPerDay: -1,
    },
};

export const SUBSCRIPTION_PRICES = {
    free: { inr: 0, usd: 0 },
    go: { inr: 20, usd: 0.25 },
    plus: { inr: 100, usd: 1.2 },
    pro: { inr: 499, usd: 6 },
};

export const SUBSCRIPTION_FEATURES = {
    free: [
        'Standard AI model access',
        'Basic content analysis',
        '30 AI messages per month',
        '6 flashcards & quizzes per day',
        'Text & image-based study sessions',
        'Community support',
    ],
    go: [
        'Everything in Free, plus:',
        '500 AI messages per month',
        '50 flashcards & quizzes per day',
        'PDF & DOCX uploads',
        'Access to Study Planner & Calendar',
        'Ad-free experience',
    ],
    plus: [
        'Everything in Go, plus:',
        'Unlimited AI messages',
        'Unlimited generations & study sessions',
        'Collaborative Study Rooms',
        'Performance Analytics Dashboard',
        'Deck Marketplace to share & sell content',
        'Priority support',
    ],
    pro: [
        'Everything in Plus, plus:',
        'Early access to new features',
        'API access for custom integrations',
        'Advanced tools for educators',
        'Team management features',
        'Dedicated account manager',
    ],
};

export type UsageType = keyof UsageLimits;

export const USAGE_TYPE_LABELS: Record<UsageType, string> = {
    aiMessagesPerMonth: 'AI Messages',
    messagesPerDay: 'Messages',
    flashcardsPerDay: 'Flashcards',
    flashcardsPerMonth: 'Flashcards (Monthly)',
    quizGenerationsPerDay: 'Quiz Generations',
    quizGenerationsPerMonth: 'Quiz Generations (Monthly)',
    studySessionsPerDay: 'Study Sessions',
    imageGenerationsPerDay: 'Image Generations',
    imageGenerationsPerMonth: 'Image Generations (Monthly)',
    pdfUploadsPerDay: 'PDF Uploads',
    pdfUploadsPerMonth: 'PDF Uploads (Monthly)',
    webScrapesPerDay: 'Web Scrapes',
    youtubeExtractionsPerDay: 'YouTube Extractions',
    mindMapsPerDay: 'Mind Maps',
    presentationsPerDay: 'Presentations',
    questionPapersPerDay: 'Question Papers',
    codeAnalysisPerDay: 'Code Analysis',
    imageSearchesPerDay: 'Image Searches',
    webSearchAIPerDay: 'Web Search AI',
};
