// Quick test script to verify streaming works
// Run with: node test-streaming.js

async function testStreaming() {
    console.log('Testing streaming API...');

    try {
        const response = await fetch('http://localhost:3000/api/chat-stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                history: [
                    {
                        role: 'user',
                        content: 'Tell me a short story about a robot in exactly 3 sentences.'
                    }
                ],
                userName: 'Test User',
                fileContent: null,
                imageDataUri: null,
                model: 'auto',
                isMusicMode: false,
                isPlayground: false,
                answerTypes: {},
            }),
        });

        console.log('Response Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            return;
        }

        // Check if it's JSON (error) or streaming text
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            const error = await response.json();
            console.error('API Error:', error);
            return;
        }

        // Read the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        console.log('\n=== STREAMING RESPONSE ===\n');

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            fullResponse += chunk;
            process.stdout.write(chunk); // Print each chunk as it arrives
        }

        console.log('\n\n=== STREAM COMPLETE ===');
        console.log('Total length:', fullResponse.length, 'characters');
        console.log('✅ Streaming test PASSED!');

    } catch (error) {
        console.error('❌ Test FAILED:', error.message);
    }
}

testStreaming();
