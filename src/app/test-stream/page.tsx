'use client';

import { useState } from 'react';

export default function StreamingTestPage() {
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const testStreaming = async () => {
        setResponse('');
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    history: [
                        {
                            role: 'user',
                            content: 'Tell me a very short joke in 2 sentences.'
                        }
                    ],
                    userName: 'Test User',
                    fileContent: null,
                    imageDataUri: null,
                    model: 'gemma-3-12b-it',
                    isMusicMode: false,
                    isPlayground: false,
                    answerTypes: {},
                }),
            });

            console.log('Response status:', res.status);
            console.log('Content-Type:', res.headers.get('content-type'));

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            const contentType = res.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const data = await res.json();
                setResponse(JSON.stringify(data, null, 2));
                setIsLoading(false);
                return;
            }

            // Handle streaming response
            const reader = res.body?.getReader();
            if (!reader) {
                throw new Error('No reader');
            }

            const decoder = new TextDecoder();
            let accumulated = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;
                setResponse(accumulated);
            }

            setIsLoading(false);
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Streaming API Test (No Auth Required)</h1>

            <button
                onClick={testStreaming}
                disabled={isLoading}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    marginBottom: '20px',
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
            >
                {isLoading ? 'Testing...' : 'Test Streaming'}
            </button>

            {error && (
                <div style={{
                    padding: '15px',
                    background: '#fee',
                    border: '1px solid #f00',
                    borderRadius: '5px',
                    marginBottom: '20px'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div style={{
                padding: '15px',
                background: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '5px',
                minHeight: '200px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace'
            }}>
                {response || 'Response will appear here...'}
            </div>

            <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                <p>This test page bypasses authentication to directly test the streaming API.</p>
                <p>If streaming works, you should see the response appear word-by-word.</p>
            </div>
        </div>
    );
}
