import { MainLayout } from "@/components/main-layout";
import { WebScraperContent } from "@/components/web-scraper-content";

export const metadata = {
    title: "Web Scraper | SearnAI",
    description: "Get instant answers from the web with AI-powered scraping",
};

export default function WebScraperPage() {
    return (
        <MainLayout>
            <WebScraperContent />
        </MainLayout>
    );
}
