

"use client";

import { Button } from "@/components/ui/button";
import { Copy, FlaskConical, PlayCircle, Trash2, Edit } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { ChatContent } from "./chat-content";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { useRouter } from "next/navigation";

import { SharedHeader } from "./shared-header";


export function PlaygroundContent() {
    const { toast } = useToast();
    const router = useRouter();
    const [canvasContent, setCanvasContent] = useState(`
<div style="border: 2px solid #4A90E2; border-radius: 8px; padding: 16px; background-color: rgba(74, 144, 226, 0.1);">
<h3 style="color: #4A90E2; margin-top: 0;">⚡️ Electrochemistry: A Visual Guide</h3>

> [!NOTE]
> **Electrochemistry** is the branch of chemistry that studies the relationship between <u>electrical energy</u> and <u>chemical change</u>. It focuses on redox (reduction-oxidation) reactions, where electrons are transferred between species.
</div>

---

<div style="border: 2px solid #F5A623; border-radius: 8px; padding: 16px; background-color: rgba(245, 166, 35, 0.1);">
<h3 style="color: #F5A623;">Core Concepts</h3>

#### 1. Redox Reactions
A fundamental concept involving the transfer of electrons.
> [!TIP]
> Remember the mnemonic **"OIL RIG"**:
> - **O**xidation **I**s **L**oss (of electrons)
> - **R**eduction **I**s **G**ain (of electrons)

- The species that **loses** electrons is the **reductant** (it gets oxidized).
- The species that **gains** electrons is the **oxidant** (it gets reduced).

#### 2. Electrochemical Cells
This is where the magic happens! We can harness electron flow.

| Feature | 🔋 Galvanic (Voltaic) Cell | 🔌 Electrolytic Cell |
| :--- | :--- | :--- |
| **Energy Conversion** | Chemical → Electrical | Electrical → Chemical |
| **Spontaneity** | ✅ Spontaneous ($ΔG < 0$) | ❌ Non-spontaneous ($ΔG > 0$) |
| **Anode Sign** | **-** (Negative) | **+** (Positive) |
| **Cathode Sign**| **+** (Positive) | **-** (Negative) |
| **Example** | Battery, Fuel Cell | Electroplating, Water Electrolysis|

#### 3. Standard Cell Notation (ASCII Diagram)
A shorthand to represent the components of a galvanic cell.

\`\`\`
  Anode Side (Oxidation)       ||     Cathode Side (Reduction)
   ┌─────────┐                 ||       ┌─────────┐
   │         │ Salt Bridge     ||       │         │
Zn(s) | Zn²⁺(aq, 1M)         ||     Cu²⁺(aq, 1M) | Cu(s)
   │         ├─────────────────||───────┤         │
   └─────────┘                 ||       └─────────┘
   e⁻ flow → → → → → → → → → → → ||
\`\`\`
This represents the reaction $Zn(s) + Cu^{2+}(aq) \rightarrow Zn^{2+}(aq) + Cu(s)$.
</div>

---

<div style="border: 2px solid #50E3C2; border-radius: 8px; padding: 16px; background-color: rgba(80, 227, 194, 0.1);">
<h3 style="color: #50E3C2; margin-top:0;">💡 Key Equations</h3>

> [!SUCCESS]
> The **Nernst Equation** is crucial for calculating cell potential under non-standard conditions.
> $$
> E_{cell} = E^o_{cell} - \frac{RT}{nF} \ln Q
> $$
> Where:
> - $E_{cell}$ is the cell potential.
> - $E^o_{cell}$ is the standard cell potential.
> - $R$ is the gas constant.
> - $T$ is the temperature in Kelvin.
> - $n$ is the number of moles of electrons transferred.
> - $F$ is Faraday's constant.
> - $Q$ is the reaction quotient.
</div>

---

### 🤔 Follow-up Question

How does changing the concentration of the reactants in a galvanic cell affect its voltage?`);
    const chatRef = useRef<{ handleReceiveCanvasContent: (content: string) => void }>(null);

    const handleCopyCanvas = () => {
        navigator.clipboard.writeText(canvasContent);
        toast({ title: "Canvas Copied", description: "Content copied to clipboard." });
    };

    const handleClearCanvas = () => {
        setCanvasContent("");
        toast({ title: "Canvas Cleared" });
    };

    const handleOpenInEditor = () => {
        if (!canvasContent) {
            toast({ title: "Canvas is empty", description: "There is nothing to edit.", variant: 'destructive' });
            return;
        }
        localStorage.setItem('aiEditorContent', canvasContent);
        router.push('/ai-editor');
    }

    const handleReceiveCanvasContent = (content: string) => {
        setCanvasContent(content);
        if (chatRef.current) {
            chatRef.current.handleReceiveCanvasContent(content);
        }
    };

    return (
        <div className="flex h-full flex-col">
            <SharedHeader
                title="Playground"
                leftElement={<BackButton />}
            />
            <main className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    <ResizablePanel defaultSize={50}>
                        <ChatContent ref={chatRef} isPlayground={true} onCanvasContent={handleReceiveCanvasContent} />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                        <div className="flex flex-col h-full">
                            <div className="p-2 border-b flex items-center justify-between bg-muted/50">
                                <p className="text-sm font-semibold flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Canvas</p>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" onClick={handleOpenInEditor}><Edit className="h-4 w-4 mr-2" />Run in Editor</Button>
                                    <Button variant="ghost" size="sm" onClick={handleCopyCanvas}><Copy className="h-4 w-4 mr-2" />Copy</Button>
                                    <Button variant="ghost" size="sm" onClick={handleClearCanvas}><Trash2 className="h-4 w-4 mr-2" />Clear</Button>
                                </div>
                            </div>
                            <div className="flex-1 p-4 bg-background">
                                <Textarea
                                    placeholder="The AI's generated code or content will appear here. You can also use it as a scratchpad."
                                    className="h-full w-full resize-none border-0 focus-visible:ring-0 p-0 bg-transparent font-mono text-sm"
                                    value={canvasContent}
                                    onChange={(e) => setCanvasContent(e.target.value)}
                                />
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    );
}




