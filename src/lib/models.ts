export const AVAILABLE_MODELS = [
    {
        id: 'auto',
        name: 'Auto',
        description: 'Automatically selects the best available model.',
        logo: '✨'
    },
    {
        id: 'local-ollama',
        name: 'Local AI (Ollama)',
        description: 'Runs on your machine via Ollama — free, unlimited, and private.',
        logo: '🏠'
    },
    {
        id: 'DeepSeek-V3.2',
        name: 'DeepSeek V3.2',
        description: 'Latest DeepSeek with improved performance across all tasks.',
        logo: '🧠'
    },
    {
        id: 'DeepSeek-V3.1',
        name: 'DeepSeek V3.1',
        description: 'Advanced reasoning with deep analytical capabilities.',
        logo: '🔮'
    },
    {
        id: 'DeepSeek-V3.1-cb',
        name: 'DeepSeek V3.1 CB',
        description: 'Code-optimized variant with enhanced programming skills.',
        logo: '💻'
    },
    {
        id: 'Meta-Llama-3.3-70B-Instruct',
        name: 'Llama 3.3 70B',
        description: 'Powerful 70B model for nuanced, detailed conversations.',
        logo: '🐫'
    },
    {
        id: 'gpt-oss-120b',
        name: 'GPT-OSS 120B',
        description: 'Massive 120B parameter model for complex reasoning.',
        logo: '🌀'
    },
];

export const DEFAULT_MODEL_ID = 'auto';

// Fallback chain when 'auto' is selected — ordered by preference
export const AUTO_FALLBACK_CHAIN = [
    'DeepSeek-V3.2',
    'DeepSeek-V3.1',
    'Meta-Llama-3.3-70B-Instruct',
    'gpt-oss-120b',
    'local-ollama',
];
