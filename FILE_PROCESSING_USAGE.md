# How to Use Enhanced File Processing

## Quick Integration

Add to any page where you want file upload:

```tsx
import { EnhancedFileUpload } from '@/components/enhanced-file-upload';

export default function MyPage() {
  return (
    <EnhancedFileUpload
      onFileProcessed={(file) => {
        // file.content = extracted text
        // file.metadata = file info
        console.log('Processed:', file);
      }}
      maxSizeMB={10}
    />
  );
}
```

## Direct API

For custom implementations:

```typescript
import { processFile } from '@/lib/file-processors';

const file = /* get file */;
const result = await processFile(file, {
  onProgress: (percent, status) => {
    console.log(`${status}: ${percent}%`);
  }
});

// result.content = extracted text
// result.metadata = {pages, wordCount, etc}
```

## Features

✅ PDF text extraction
✅ Image OCR (Tesseract)
✅ DOCX support  
✅ Progress bars
✅ File preview
