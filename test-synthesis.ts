
import { synthesizeAnswer } from './src/app/web-scraper';

function testSynthesis() {
    console.log("Testing Synthesis Logic...");
    const query = "React Server Components";
    const sources = [
        {
            title: "React Server Components",
            url: "https://react.dev/blog/2020/12/21/data-fetching-with-react-server-components",
            content: `
                React Server Components are a new feature in React that allows you to render components on the server.
                This reduces the bundle size sent to the client and improves performance.
                Server Components can directly access the database and filesystem.
                They are different from Server Side Rendering (SSR) because they don't hydrate on the client.
            `
        },
        {
            title: "Next.js Server Components",
            url: "https://nextjs.org/docs/app/building-your-application/rendering/server-components",
            content: `
                Next.js App Router uses React Server Components by default.
                This means all components are server components unless you add the "use client" directive.
                Server Components allow you to keep sensitive data and logic on the server.
            `
        },
        {
            title: "Irrelevant Article",
            url: "https://example.com/cooking",
            content: `
                Here is a recipe for chocolate cake. It requires flour, sugar, and eggs.
                Bake at 350 degrees for 30 minutes.
            `
        }
    ];

    const answer = synthesizeAnswer(query, sources);
    console.log("\nGenerated Answer:\n");
    console.log(answer);

    if (answer.includes("React Server Components") && answer.includes("Next.js App Router")) {
        console.log("\nSUCCESS: Relevant info extracted.");
    } else {
        console.error("\nFAILURE: Relevant info missing.");
    }
}

testSynthesis();
