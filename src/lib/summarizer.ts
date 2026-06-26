export function generateExtractiveSummary(text: string, maxSentences: number = 3, query?: string): string {
    if (!text || text.trim().length === 0) return '';

    // 1. Split into sentences (smart regex that doesn't split on abbreviations like i.e. or single initials)
    // Splits on punctuation followed by space and a capital letter
    const rawSentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/g);
    
    // Helper to clean a raw sentence of news cruft
    const cleanSentence = (raw: string): string => {
        let s = raw.trim();
        // Strip Wikipedia citation numbers e.g. [21], [1]
        s = s.replace(/\[\d+\]/g, '');
        // Strip leading news attribution: "The New York Times — Thu, 07 May 2026 22:15:33 GMT:"
        s = s.replace(/^[A-Z][\w\s&'.,-]+(?: —| –| -| \|)\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[^:]*:\s*/i, '');
        // Strip "Source Name. " prefix
        s = s.replace(/^(?:Reuters|AP|BBC[\w\s]*|CNN|The [\w\s]+Times|The Guardian|Al Jazeera|NDTV|Bloomberg|Forbes|Axios|NPR)[\s.—–:-]+/i, '');
        // Strip timestamps
        s = s.replace(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+\d{1,2}\s+\w+\s+\d{4}[\s\d:]*(?:GMT|UTC|EST|PST|IST)?:?\s*/gi, '');
        // Strip bare times
        s = s.replace(/^\s*\d{1,2}:\d{2}(?:\s*(?:AM|PM|GMT|UTC|EST|PST|IST))?[\s:|-]*\s*/i, '');
        // Strip "X hours ago"
        s = s.replace(/(?:Updated\s+)?\d+\s+(?:hours?|minutes?|mins?|days?|seconds?)\s+ago\.?\s*/gi, '');
        // Remove unicode language bullets (like • Адыгабзэ • Afrikaans)
        s = s.replace(/•\s*[A-ZÀ-ÿА-Яа-я\w\s]+(?:\s*•)?/g, '');
        return s.trim();
    };

    const isNoise = (s: string): boolean => {
        if (s.length < 40 || s.split(' ').length < 6) return true;
        // Navigation / UI / CTA text
        if (/^(home|menu|search|skip to|share|print|close|read more|click to|click here|see also|related|jump to|loading|please wait|explore|discover|shop)/i.test(s)) return true;
        // Specific noise and marketing phrases
        if (/(pdf download|check the complete list|former prime ministers pm's profile|subscribe to|sign up for|log in to|create an account|all rights reserved|order online|delivery|take away|dine-in|download our|app for easy|menu and offers|add to cart|buy now|sale ends|promo code)/i.test(s)) return true;
        // Pure date/source lines
        if (/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(s) && s.length < 100) return true;
        // Lines that are mostly a URL
        if (/https?:\/\/\S{30,}/i.test(s)) return true;
        // Lines that are just source attribution
        if (/^(?:Source|Photo|Image|Credit|By\s+[A-Z])/i.test(s) && s.length < 80) return true;
        // Lines filled with language symbols/lists
        if (/[А-Яа-яЁёΆ-ώԱ-Ֆა-ჰ]/.test(s) && s.split(' ').length < 10) return true;
        
        // Truncated search snippet artifacts (ends in ...)
        if (s.endsWith('...') || s.endsWith('…') || s.includes('... .') || s.includes('....') || s.endsWith('..')) return true;

        // Is it an FAQ question? Summaries should be declarative statements
        if (s.endsWith('?') || s.includes('### What') || s.startsWith('Q:')) return true;

        // Does it look like a breadcrumb, link dump, or tag list? (e.g. "Data - India - India Country Profile")
        const dashCount = (s.match(/\s-\s/g) || []).length;
        const pipeCount = (s.match(/\s\|\s/g) || []).length;
        if (dashCount > 2 || pipeCount > 2) return true;

        // Is it heavily Title Cased? (e.g. "The Economics Of Dowry: Causes And Effects")
        const words = s.split(' ').filter(w => w.length > 2);
        const capitalizedWords = words.filter(w => /^[A-Z]/.test(w));
        if (words.length > 0 && (capitalizedWords.length / words.length) > 0.5) return true;

        // Long string of non-words
        const nonEnglishChars = s.match(/[^\x00-\x7F]/g);
        if (nonEnglishChars && nonEnglishChars.length > s.length * 0.3) return true;
        
        return false;
    };

    // Clean and filter sentences
    const sentences = rawSentences
        .map(s => cleanSentence(s.replace(/\s+/g, ' ')))
        .filter(s => !isNoise(s));

    if (sentences.length === 0) return '';
    if (sentences.length <= maxSentences) {
        return sentences.join(' ');
    }

    // 2. Simple Stopword list
    const stopWords = new Set([
        'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
        'click', 'subscribe', 'read', 'more', 'advertisement', 'copyright', 'privacy', 'policy', 'terms'
    ]);

    // Tokenize function
    const getWords = (sentence: string) => {
        return (sentence.toLowerCase().match(/[a-z]+/g) || [])
            .filter(w => !stopWords.has(w) && w.length > 2); // strictly > 2 length to avoid tiny artifacts
    };

    // 3. Build TF-IDF like word frequency across the whole text
    const termFreq: Record<string, number> = {};
    const docFreq: Record<string, number> = {};
    const sentenceWords: string[][] = sentences.map(getWords);
    const numDocs = sentences.length;
    
    sentenceWords.forEach(words => {
        const uniqueWords = new Set(words);
        uniqueWords.forEach(w => {
            docFreq[w] = (docFreq[w] || 0) + 1;
        });
        words.forEach(w => {
            termFreq[w] = (termFreq[w] || 0) + 1;
        });
    });

    // Calculate actual TF-IDF
    const tfIdf: Record<string, number> = {};
    Object.keys(termFreq).forEach(w => {
        const tf = termFreq[w];
        const idf = Math.log(numDocs / (1 + docFreq[w]));
        tfIdf[w] = tf * idf;
    });

    // 4. Score sentences based on TF-IDF
    const queryWords = query ? new Set(getWords(query)) : new Set<string>();

    const sentenceScores = sentences.map((sentence, idx) => {
        const words = sentenceWords[idx];
        if (words.length === 0) return { idx, score: 0, sentence };

        let score = 0;
        words.forEach(w => {
            score += tfIdf[w] || 0;
        });

        // Normalize by length (avoiding huge sentences hoarding score)
        score = score / Math.sqrt(words.length);

        // Position boost: first few sentences of an article are highly important
        if (idx < 2) score *= 1.5;

        // Pronoun penalty: Out of context sentences starting with pronouns are bad
        if (/^(He|She|It|They|This|That|These|Those)\b/i.test(sentence)) {
            score *= 0.6;
        }

        // Run-on penalty: > 35 words is usually a bad sentence to extract
        if (sentence.split(' ').length > 35) {
            score *= 0.7;
        }

        // Query Relevance Boost
        if (queryWords.size > 0) {
            let matchCount = 0;
            words.forEach(w => {
                if (queryWords.has(w)) matchCount++;
            });
            if (matchCount > 0) {
                const boost = 1 + (matchCount / queryWords.size) * 1.0;
                score *= boost;
            }
        }

        return { idx, score, sentence };
    });

    // 5. Select top N sentences
    sentenceScores.sort((a, b) => b.score - a.score);
    
    // Pick the best non-redundant sentences
    const topSentences: typeof sentenceScores = [];
    for (const item of sentenceScores) {
        if (topSentences.length >= maxSentences) break;
        
        // Anti-redundancy: if this sentence is >70% similar to an already picked one, skip it
        const wordsA = new Set(sentenceWords[item.idx]);
        let isTooSimilar = false;
        for (const picked of topSentences) {
            const wordsB = new Set(sentenceWords[picked.idx]);
            const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
            const similarity = intersection.size / Math.min(wordsA.size, wordsB.size);
            if (similarity > 0.7) {
                isTooSimilar = true;
                break;
            }
        }
        
        if (!isTooSimilar) {
            topSentences.push(item);
        }
    }

    // 6. Re-order them chronologically as they appeared in text
    topSentences.sort((a, b) => a.idx - b.idx);

    return topSentences.map(s => s.sentence).join(' ');
}
