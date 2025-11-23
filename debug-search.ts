
import { webSearch } from './src/ai/tools/web-search';

async function debugSearch() {
    console.log("Debugging Web Search...");
    const query = "PM of India";
    const result = await webSearch({ query });
    console.log("Result:", JSON.stringify(result, null, 2));
}

debugSearch();
