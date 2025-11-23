
import { webScraperAction } from './src/app/web-scraper';

async function testScraper() {
    console.log("Testing Web Scraper...");
    const query = "PM of India";
    console.log(`Query: ${query}`);

    try {
        const result = await webScraperAction({ query });

        if (result.error) {
            console.error("Error:", result.error);
        } else {
            console.log("Success!");
            console.log("Answer:", result.data?.answer);
            console.log("Sources:", result.data?.sources.length);
            console.log("Response Time:", result.data?.responseTime);
        }
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testScraper();
