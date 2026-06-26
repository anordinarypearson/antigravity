import { NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';
import fs from 'fs';
import path from 'path';
import { searchImages } from '@/ai/tools/image-search';

export async function POST(req: Request) {
    try {
        const data = await req.json();

        if (!data.title || !data.slides || !Array.isArray(data.slides)) {
            return NextResponse.json({ error: 'Invalid presentation data format' }, { status: 400 });
        }

        console.log(`[Generate PPTX API] Building PPTX for: "${data.title}" with ${data.slides.length} slides.`);

        const pres = new PptxGenJS();
        pres.layout = "LAYOUT_16x9";

        // Title Slide
        const titleSlide = pres.addSlide();
        titleSlide.background = { color: "1A1A1A" };
        titleSlide.addText(data.title, {
            x: 1, y: 2, w: 8, h: 1.5,
            fontSize: 44, color: "FFFFFF", bold: true, align: "center", fontFace: "Arial"
        });
        if (data.subtitle) {
            titleSlide.addText(data.subtitle, {
                x: 1, y: 3.5, w: 8, h: 1,
                fontSize: 24, color: "4F46E5", align: "center", fontFace: "Arial"
            });
        }

        // Content Slides
        for (const slideData of data.slides) {
            const slide = pres.addSlide();
            slide.background = { color: "2B2B2B" };

            // Fetch Image if requested
            let imageUrl: string | null = null;
            if (slideData.imageQuery) {
                console.log(`[Generate PPTX API] Fetching image for query: "${slideData.imageQuery}"`);
                try {
                    const searchResult = await searchImages({ query: slideData.imageQuery, maxImages: 3 });
                    if (searchResult && searchResult.images && searchResult.images.length > 0) {
                        // Find first valid URL
                        const bestImage = searchResult.images.find((img: any) => img.url.startsWith('http'));
                        if (bestImage) {
                            imageUrl = bestImage.url;
                            console.log(`[Generate PPTX API] ✅ Found image: ${imageUrl}`);
                        }
                    }
                } catch (e) {
                    console.error(`[Generate PPTX API] ❌ Image search failed for "${slideData.imageQuery}":`, e);
                }
            }

            // Header
            slide.addText(slideData.title, {
                x: 0.5, y: 0.5, w: 9, h: 1,
                fontSize: 32, color: "FFFFFF", bold: true, fontFace: "Arial",
                fill: { color: "1A1A1A" }
            });

            // Layout based on whether we have an image
            const hasImage = !!imageUrl;
            const textWidth = hasImage ? 4.5 : 9;

            // Bullets
            if (slideData.bullets && Array.isArray(slideData.bullets)) {
                const bullets = slideData.bullets.map((b: string) => ({
                    text: b,
                    options: { bullet: true, fontSize: hasImage ? 20 : 24, color: "E0E0E0", breakLine: true, fontFace: "Arial" }
                }));
                slide.addText(bullets, { x: 0.5, y: 1.8, w: textWidth, h: 4, valign: "top" });
            }

            // Image
            if (hasImage && imageUrl) {
                try {
                    // Place image on the right side
                    slide.addImage({ 
                        path: imageUrl, 
                        x: 5.5, 
                        y: 1.8, 
                        w: 4, 
                        h: 3, 
                        sizing: { type: "contain", w: 4, h: 3 } 
                    });
                } catch (e) {
                    console.error(`[Generate PPTX API] ❌ Failed to embed image ${imageUrl}:`, e);
                }
            }
        }

        // Save File to /public/downloads
        const filename = `presentation-${Date.now()}.pptx`;
        const publicDownloadsDir = path.join(process.cwd(), 'public', 'downloads');

        if (!fs.existsSync(publicDownloadsDir)) {
            fs.mkdirSync(publicDownloadsDir, { recursive: true });
        }

        const filepath = path.join(publicDownloadsDir, filename);
        console.log(`[Generate PPTX API] Saving file to ${filepath}...`);

        await pres.writeFile({ fileName: filepath });
        console.log(`[Generate PPTX API] ✅ Successfully created: ${filename}`);

        return NextResponse.json({ url: `/downloads/${filename}` });

    } catch (error: any) {
        console.error("[Generate PPTX API] ❌ Fatal Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
