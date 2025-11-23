"use client";

import {
  Bell,
  BookOpen,
  HelpCircle,
  Home,
  Info,
  Plus,
  Search,
  Settings,
  Code,
  FileQuestion,
  Youtube,
  Rss,
  User,
  MoreHorizontal,
  GraduationCap,
  BrainCircuit,
  FileText,
  Layers,
  MessageSquare,
  Cpu,
  Presentation,
  File,
  Brush,
  Volume2,
  FileEdit,
  LogOut,
  Globe,
  Calendar,
  Image as ImageIcon,
  Music,
  Bot,
  View,
  FlaskConical,
  Users,
  Inbox, // Added Inbox icon
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { useSidebar } from "./ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

const studyTools = [
  { name: "Study Session", icon: <GraduationCap />, href: "/study-now" },
  { name: "AI Editor", icon: <Brush />, href: "/ai-editor" },
  { name: "Playground", icon: <FlaskConical />, href: "/playground" },
  { name: "Code Analyzer", icon: <Code />, href: "/code-analyzer" },
  { name: "Flashcards", icon: <Layers />, href: "/create-flashcards" },
  { name: "Quiz", icon: <FileQuestion />, href: "/quiz" },
  { name: "Mind Map", icon: <BrainCircuit />, href: "/mind-map" },
  { name: "Question Paper", icon: <FileText />, href: "/question-paper" },
  { name: "Presentation Maker", icon: <Presentation />, href: "/presentation-maker" },
  { name: "Image Generation", icon: <ImageIcon />, href: "/image-generation" },
];

const resources = [
  { name: "PDF Hub", icon: <File />, href: "/pdf-hub" },
  { name: "Web Browser", icon: <Globe />, href: "/web-browser" },
  { name: "Web Scraper", icon: <Search />, href: "/web-scraper" },
  { name: "YouTube Tools", icon: <Youtube />, href: "/youtube-extractor" },
  { name: "News", icon: <Rss />, href: "/news" },
  { name: "eBooks", icon: <BookOpen />, href: "/ebooks" },
  { name: "Text-to-Speech", icon: <Volume2 />, href: "/text-to-speech" },
  { name: "AI Training", icon: <Cpu />, href: "/ai-training" },
];

const mainNav = [
  { name: "Home", icon: <Home />, href: "/" },
  { name: "Planner", icon: <Calendar />, href: "/planner" },
  { name: "Agent", icon: <Bot />, href: "/agent" },
]

const AppLogo = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "hsl(var(--accent-start))", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "hsl(var(--accent-end))", stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path
      d="M50 2.88675L93.3013 26.4434V73.5566L50 97.1132L6.69873 73.5566V26.4434L50 2.88675Z"
      fill="currentColor"
      className="text-primary-foreground"
    />
    <path
      d="M63 40.5C63 36.3579 59.6421 33 55.5 33H44.5C40.3579 33 37 36.3579 37 40.5V43.5C37 47.6421 40.3579 51 44.5 51H55.5C59.6421 51 63 54.3579 63 58.5V61.5C63 65.6421 59.6421 69 55.5 69H44.5C40.3579 69 37 65.6421 37 61.5"
      stroke="url(#logoGradient)"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


export function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const currentPathname = usePathname();
  const [pathname, setPathname] = useState("");
  const { user, signOut } = useAuth();

  useEffect(() => {
    setPathname(currentPathname);
  }, [currentPathname]);


  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const handleNewChat = () => {
    handleLinkClick();
    try {
      if (pathname === '/') {
        localStorage.removeItem('chatHistory');
        sessionStorage.removeItem('chatScrollPosition');
        window.location.reload();
      } else {
        router.push('/');
      }
    } catch (e) {
      console.error("Could not clear storage", e);
    }
  };

  const renderMenuItems = (items: { name: string, icon: React.ReactNode, href: string }[]) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.name}>
        <Link href={item.href} passHref>
          <SidebarMenuButton
            tooltip={item.name}
            isActive={pathname === item.href}
            className="justify-start w-full gap-2.5 px-3 relative"
          >
            {pathname === item.href && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-accent"></span>
            )}
            <div className="transition-transform duration-200 group-hover/menu-button:scale-110">
              {item.icon}
            </div>
            <span className="text-sm">{item.name}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    ));
  }

  return (
    <Sidebar className="bg-black/80 border-r border-neutral-800/50 text-sidebar-foreground backdrop-blur-lg">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-primary-foreground border border-neutral-700">
            <AppLogo />
          </div>
          <h1 className="text-lg font-semibold tracking-wider text-gradient">SearnAI</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-grow flex flex-col">
        <div className="flex-grow">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/'}
                  className="justify-start w-full gap-2.5 px-3 relative"
                >
                  {pathname === "/" && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-accent"></span>
                  )}
                  <Home />
                  <span className="text-sm">Home</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleNewChat}
                className="justify-start w-full gap-2.5 px-3"
              >
                <MessageSquare />
                <span className="text-sm">New Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/planner" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/planner'}
                  className="justify-start w-full gap-2.5 px-3 relative"
                >
                  {pathname === "/planner" && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-accent"></span>
                  )}
                  <Calendar />
                  <span className="text-sm">Planner</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/inbox" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/inbox'}
                  className="justify-start w-full gap-2.5 px-3 relative"
                >
                  {pathname === "/inbox" && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-accent"></span>
                  )}
                  <Inbox />
                  <span className="text-sm">Inbox</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/agent" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/agent'}
                  className="justify-start w-full gap-2.5 px-3 relative"
                >
                  {pathname === "/agent" && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-accent"></span>
                  )}
                  <Bot />
                  <span className="text-sm">Agent</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/friends" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/friends'}
                  className="justify-start w-full gap-2.5 px-3 relative"
                >
                  {pathname === "/friends" && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-accent"></span>
                  )}
                  <Users />
                  <span className="text-sm">Friends</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarSeparator className="my-4 border-neutral-800/60" />

          <SidebarMenu>
            <SidebarGroupLabel className="uppercase text-xs font-semibold tracking-wider px-3 my-2 text-sidebar-group-foreground">Study Tools</SidebarGroupLabel>
            {renderMenuItems(studyTools)}
          </SidebarMenu>

          <SidebarSeparator className="my-4 border-neutral-800/60" />

          <SidebarMenu>
            <SidebarGroupLabel className="uppercase text-xs font-semibold tracking-wider px-3 my-2 text-sidebar-group-foreground">Resources</SidebarGroupLabel>
            {renderMenuItems(resources)}
          </SidebarMenu>
        </div>
        <SidebarFooter className="p-2 border-t border-neutral-800/60">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/settings">
                <SidebarMenuButton className="w-full justify-start gap-2.5 px-3" isActive={pathname.startsWith('/settings')}>
                  <Settings />
                  <span className="text-sm">Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/about">
                <SidebarMenuButton className="w-full justify-start gap-2.5 px-3" isActive={pathname === '/about'}>
                  <Info />
                  <span className="text-sm">About Us</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut} className="w-full justify-start gap-2.5 px-3">
                <LogOut />
                <span className="text-sm">Log Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}