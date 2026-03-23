"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { WavyLoader, WavyStyle } from "./ui/wavy-loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Settings2, Waves, Maximize2 } from "lucide-react";

export const WavyLoaderPreferences = () => {
  const [style, setStyle] = useState<WavyStyle>('standard');
  const [size, setSize] = useState(40);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('wavy-loader-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStyle(parsed.style || 'standard');
        setSize(parsed.size || 40);
      } catch (e) {
        console.error("Error parsing wavy settings", e);
      }
    }
  }, []);

  const handleSave = (newStyle?: WavyStyle, newSize?: number) => {
    const s = newStyle ?? style;
    const z = newSize ?? size;
    
    const settings = { style: s, size: z };
    localStorage.setItem('wavy-loader-settings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('wavy-settings-updated', { detail: settings }));
  };

  if (!isMounted) return null;

  return (
    <Card className="w-full bg-card/40 backdrop-blur-xl border-border/40 shadow-xl mt-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Waves className="h-6 w-6 text-primary animate-pulse" />
            Wavy Loading System
          </CardTitle>
          <CardDescription className="text-muted-foreground/70 font-medium">
            Customize the global circular wavy ring structure.
          </CardDescription>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all font-bold gap-2">
              <Settings2 className="h-4 w-4" />
              Tune Structure
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-2xl border-border/40 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">Wavy Loading Architect</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">
                Select your preferred circular wave style and adjust its size.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-8 py-6">
              <div className="flex justify-center p-12 bg-muted/20 border border-primary/10 rounded-[3rem]">
                <WavyLoader style={style} size={80} color="hsl(var(--primary))" usePreset={false} />
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    <Waves className="h-3.5 w-3.5" />
                    Ring Pattern
                  </div>
                  <RadioGroup 
                    value={style} 
                    onValueChange={(val) => { 
                      const s = val as WavyStyle;
                      setStyle(s); 
                      handleSave(s); 
                    }}
                    className="grid grid-cols-2 gap-3"
                  >
                    {[
                      { id: 'standard', label: 'Classic', desc: 'Google-like' },
                      { id: 'ripples', label: 'Ripples', desc: 'High frequency' },
                      { id: 'soft', label: 'Soft', desc: 'Subtle wave' },
                      { id: 'dynamic', label: 'Dynamic', desc: 'Oscillating' }
                    ].map((item) => (
                      <div key={item.id}>
                        <RadioGroupItem value={item.id} id={item.id} className="peer sr-only" />
                        <Label
                          htmlFor={item.id}
                          className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover/40 p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-pointer group text-center"
                        >
                          <span className="text-sm font-black uppercase tracking-tight mb-1">{item.label}</span>
                          <span className="text-[9px] text-muted-foreground font-medium">{item.desc}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      <Maximize2 className="h-3.5 w-3.5" />
                      Amplitude/Size ({size}px)
                    </div>
                  </div>
                  <Slider 
                    value={[size]} 
                    min={20} 
                    max={150} 
                    step={2} 
                    onValueChange={([val]) => { 
                      setSize(val); 
                      handleSave(style, val); 
                    }} 
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button onClick={() => window.location.reload()} variant="link" className="text-[10px] font-bold uppercase tracking-widest text-primary/50 hover:text-primary transition-colors">
                Apply Refresh
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
        <div className="flex flex-col gap-2 p-6 rounded-3xl bg-muted/20 border border-border/10 items-center justify-center">
           <WavyLoader style={style} size={48} color="hsl(var(--primary))" usePreset={false} />
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-2">Active Preview</span>
        </div>
        <div className="flex flex-col gap-2 p-6 rounded-3xl bg-muted/20 border border-border/10 justify-center items-center">
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Pattern Selection</span>
           <span className="text-xl font-black capitalize tracking-tight text-primary">{style}</span>
        </div>
        <div className="flex flex-col gap-2 p-6 rounded-3xl bg-muted/20 border border-border/10 justify-center items-center">
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Amplitude Setting</span>
           <span className="text-xl font-black tracking-tight text-primary">{size}px</span>
        </div>
      </CardContent>
    </Card>
  );
};
