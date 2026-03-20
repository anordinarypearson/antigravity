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
  Inbox,
  Menu,
  ChevronDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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




export function AppSidebar() {
  const { setOpenMobile, toggleSidebar } = useSidebar();
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
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary"></span>
            )}
            <div className={cn("transition-all duration-200 group-hover/menu-button:scale-110", pathname === item.href ? "text-primary" : "")}>
              {item.icon}
            </div>
            <span className={cn("text-sm", pathname === item.href ? "text-primary font-semibold" : "")}>{item.name}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    ));
  }

  return (
    <Sidebar collapsible="icon" className="bg-sidebar/95 backdrop-blur-3xl border-r border-black/10 dark:border-sidebar-border/50 shadow-2xl text-sidebar-foreground">
      <SidebarHeader className="h-16 border-b border-black/10 dark:border-sidebar-border/50 p-0 justify-start">
        <div className="flex items-center justify-between w-full h-full px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold tracking-wider text-gradient flex items-baseline gap-0 group-data-[collapsible=icon]:hidden">
              <svg
                width="28"
                height="28"
                viewBox="0 0 1024 1024"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 -mr-0.5 relative top-[9px]"
              >
                <defs>
                  <linearGradient id="blueGradient" x1="256" y1="128" x2="768" y2="896" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1a3cff" />
                    <stop offset="100%" stopColor="#4d6bff" />
                  </linearGradient>
                </defs>
                <path
                  d="M 320 280 Q 512 120 704 280 L 664 340 Q 512 220 360 340 Q 512 460 664 580 L 624 640 Q 512 540 400 640 Q 512 760 704 640"
                  stroke="url(#blueGradient)"
                  strokeWidth="110"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle cx="750" cy="250" r="28" fill="#1a3cff" />
              </svg>
              <span>earnAI</span>
            </h1>
            {/* Logo shown when collapsed */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 1024 1024"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 hidden group-data-[collapsible=icon]:block"
            >
              <defs>
                <linearGradient id="blueGradient2" x1="256" y1="128" x2="768" y2="896" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1a3cff" />
                  <stop offset="100%" stopColor="#4d6bff" />
                </linearGradient>
              </defs>
              <path
                d="M 320 280 Q 512 120 704 280 L 664 340 Q 512 220 360 340 Q 512 460 664 580 L 624 640 Q 512 540 400 640 Q 512 760 704 640"
                stroke="url(#blueGradient2)"
                strokeWidth="110"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="750" cy="250" r="28" fill="#1a3cff" />
            </svg>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-grow flex flex-col pt-2 group-data-[collapsible=icon]:p-0">
        <div className="pb-2 group-data-[collapsible=icon]:hidden">
          <Button onClick={handleNewChat} variant="ghost" className="w-full justify-start transition-colors hover:bg-neutral-800 hover:text-white pl-2">
            <MessageSquare className="mr-2 h-5 w-5" />
            <span className="font-semibold group-data-[collapsible=icon]:hidden">New Chat</span>
          </Button>
        </div>
        <SidebarSeparator className="my-2 border-neutral-800/60 group-data-[collapsible=icon]:hidden" />
        <div className="flex-grow">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/'}
                  className="justify-start w-full gap-2.5 px-3 relative"
                >
                  {pathname === "/" && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary"></span>
                  )}
                  <Home className={pathname === "/" ? "text-primary" : ""} />
                  <span className={cn("text-sm", pathname === "/" ? "text-primary font-semibold" : "")}>Home</span>
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
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary"></span>
                  )}
                  <Calendar className={pathname === "/planner" ? "text-primary" : ""} />
                  <span className={cn("text-sm", pathname === "/planner" ? "text-primary font-semibold" : "")}>Planner</span>
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
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary"></span>
                  )}
                  <Inbox className={pathname === "/inbox" ? "text-primary" : ""} />
                  <span className={cn("text-sm", pathname === "/inbox" ? "text-primary font-semibold" : "")}>Inbox</span>
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
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary"></span>
                  )}
                  <Bot className={pathname === "/agent" ? "text-primary" : ""} />
                  <span className={cn("text-sm", pathname === "/agent" ? "text-primary font-semibold" : "")}>Agent</span>
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
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary"></span>
                  )}
                  <Users className={pathname === "/friends" ? "text-primary" : ""} />
                  <span className={cn("text-sm", pathname === "/friends" ? "text-primary font-semibold" : "")}>Friends</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarSeparator className="my-4 border-neutral-800/60" />

          <Collapsible className="group/study">
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 my-2 group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel className="uppercase text-xs font-semibold tracking-wider text-sidebar-group-foreground p-0 m-0">Study Tools</SidebarGroupLabel>
              <ChevronDown className="h-3.5 w-3.5 text-sidebar-group-foreground transition-transform duration-200 group-data-[state=open]/study:rotate-180" />
            </CollapsibleTrigger>
            <SidebarGroupLabel className="uppercase text-xs font-semibold tracking-wider px-3 my-2 text-sidebar-group-foreground hidden group-data-[collapsible=icon]:block">Tools</SidebarGroupLabel>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <SidebarMenu>
                {renderMenuItems(studyTools)}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>

          <SidebarSeparator className="my-4 border-neutral-800/60" />

          <Collapsible className="group/resources">
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 my-2 group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel className="uppercase text-xs font-semibold tracking-wider text-sidebar-group-foreground p-0 m-0">Resources</SidebarGroupLabel>
              <ChevronDown className="h-3.5 w-3.5 text-sidebar-group-foreground transition-transform duration-200 group-data-[state=open]/resources:rotate-180" />
            </CollapsibleTrigger>
            <SidebarGroupLabel className="uppercase text-xs font-semibold tracking-wider px-3 my-2 text-sidebar-group-foreground hidden group-data-[collapsible=icon]:block">More</SidebarGroupLabel>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <SidebarMenu>
                {renderMenuItems(resources)}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
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