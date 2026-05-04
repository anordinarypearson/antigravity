
export const AVAILABLE_MODELS = [
    {
        id: 'auto',
        name: 'Auto',
        description: 'Automatically selects the best available model.',
        logo: '✨'
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
        id: 'DeepSeek-V3.2',
        name: 'DeepSeek V3.2',
        description: 'Latest DeepSeek with improved performance across all tasks.',
        logo: '🧠'
    },
    {
        id: 'Llama-4-Maverick-17B-128E-Instruct',
        name: 'Llama 4 Maverick',
        description: 'Meta\'s newest Llama 4 with 128 expert MoE architecture.',
        logo: '🦙'
    },
    {
        id: 'Meta-Llama-3.3-70B-Instruct',
        name: 'Llama 3.3 70B',
        description: 'Powerful 70B model for nuanced, detailed conversations.',
        logo: '🐫'
    },
    {
        id: 'MiniMax-M2.5',
        name: 'MiniMax M2.5',
        description: 'Efficient model with strong multilingual capabilities.',
        logo: '⚡'
    },
    {
        id: 'gemma-3-12b-it',
        name: 'Gemma 3 12B',
        description: 'Google\'s compact but capable open model.',
        logo: '💎'
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
    'Llama-4-Maverick-17B-128E-Instruct',
    'MiniMax-M2.5',
    'gemma-3-12b-it',
    'gpt-oss-120b',
];
