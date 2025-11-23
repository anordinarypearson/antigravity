# Adding Images to AI Answers

## Option 1: AI Can Suggest Images (Current Implementation)

The AI can now include image links in markdown responses:

```markdown
![Description](https://image.pollinations.ai/prompt/your-prompt?width=800&height=600)
```

## Option 2: AI-Generated Diagrams

For educational content, AI can create:
- **Mermaid Diagrams** (already supported in markdown)
- **Mathematical visualizations** (with KaTeX)
- **Image links** from free APIs

## How to Use

### In AI Prompts:
Update the system prompt to tell AI it can include images:

```typescript
const systemPrompt = `...
You can include images in your responses using:
1. Markdown image syntax: ![description](url)
2. Image generation: Use https://image.pollinations.ai/prompt/{description}
3. Mermaid diagrams for flowcharts and diagrams
...`;
```

### Image Generation API

Free API endpoint (no key needed):
```
https://image.pollinations.ai/prompt/{your-description}?width=512&height=512
```

Example:
```markdown
Here's a diagram of the water cycle:
![Water Cycle](https://image.pollinations.ai/prompt/water%20cycle%20diagram%20showing%20evaporation%20condensation%20precipitation?width=800&height=600)
```

### Image Generator Component

Created `src/components/image-generator.tsx` for standalone image generation.

## Integration Steps

### 1. Update System Prompt

Add to `src/app/api/chat-stream/route.ts`:

```typescript
const imageInstruction = `
**Image Generation:**
You can include images in your responses to help explain concepts:
- Use markdown: ![description](url)
- For generated images: https://image.pollinations.ai/prompt/{description}
- For diagrams: Use mermaid code blocks
`;
```

### 2. Already Works!

ReactMarkdown already renders images from URLs, so AI just needs to include them in responses.

### 3. Test It

Ask the AI:
```
"Explain photosynthesis with a diagram"
```

AI should respond with text + image link.

## Example Usage

**User**: "Show me a diagram of the solar system"

**AI Response**:
```markdown
Here's a visual representation of our solar system:

![Solar System](https://image.pollinations.ai/prompt/solar%20system%20diagram%20showing%20all%20planets%20orbiting%20the%20sun?width=800&height=600)

The solar system consists of...
```

## Next Steps

1. Update system prompt to enable image suggestions
2. AI will automatically include relevant images
3. Images render in chat via ReactMarkdown
