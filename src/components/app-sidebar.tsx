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
  { name: "Image Search", icon: <ImageIcon />, href: "/image-search" },
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
    className="h-full w-full p-2"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#EF4444", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#991B1B", stopOpacity: 1 }} />
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
  // TEMPORARILY MODIFIED: Make auth optional
  const auth = useAuth();
  const user = auth?.user;
  const signOut = auth?.signOut || (() => { });

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
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-red-600"></span>
            )}
            <div className={cn("transition-transform duration-200 group-hover/menu-button:scale-110", pathname === item.href ? "text-red-600" : "")}>
              {item.icon}
            </div>
            <span className={cn("text-sm", pathname === item.href ? "text-red-600 font-medium" : "")}>{item.name}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    ));
  }

  return (
    <Sidebar className="bg-sidebar border-r border-neutral-800/50 text-sidebar-foreground">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-primary-foreground border border-neutral-700 shadow-sm">
            <AppLogo />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-gradient">SearnAI</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-grow flex flex-col">
        <div className="px-2 pb-2">
          <Button onClick={handleNewChat} className="w-full justify-start bg-neutral-800 hover:bg-neutral-700 transition-colors text-white shadow-md border border-neutral-700">
            <MessageSquare className="mr-2 h-4 w-4" />
            <span className="font-semibold">New Chat</span>
          </Button>
        </div>
        <div className="flex-grow">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/'}
                  className="justify-start w-full gap-2.5 px-3 relative"
                >
                  {pathname === "/" && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-red-600"></span>
                  )}
                  <Home className={pathname === "/" ? "text-red-600" : ""} />
                  <span className={cn("text-sm", pathname === "/" ? "text-red-600 font-medium" : "")}>Home</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href="/planner" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/planner'}
                  className="justify-start w-full gap-2.5 px-3 relative"
                >
                  {pathname === "/planner" && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-red-600"></span>
                  )}
                  <Calendar className={pathname === "/planner" ? "text-red-600" : ""} />
                  <span className={cn("text-sm", pathname === "/planner" ? "text-red-600 font-medium" : "")}>Planner</span>
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
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-red-600"></span>
                  )}
                  <Inbox className={pathname === "/inbox" ? "text-red-600" : ""} />
                  <span className={cn("text-sm", pathname === "/inbox" ? "text-red-600 font-medium" : "")}>Inbox</span>
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
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-red-600"></span>
                  )}
                  <Bot className={pathname === "/agent" ? "text-red-600" : ""} />
                  <span className={cn("text-sm", pathname === "/agent" ? "text-red-600 font-medium" : "")}>Agent</span>
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
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-red-600"></span>
                  )}
                  <Users className={pathname === "/friends" ? "text-red-600" : ""} />
                  <span className={cn("text-sm", pathname === "/friends" ? "text-red-600 font-medium" : "")}>Friends</span>
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
            {/* TEMPORARILY HIDDEN when no user */}
            {user && (
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} className="w-full justify-start gap-2.5 px-3">
                  <LogOut />
                  <span className="text-sm">Log Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}