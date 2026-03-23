"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { WavyLoader, WavyStyle, WavyShape } from "./ui/wavy-loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Settings2, Waves, Maximize2, Zap, Square, Circle } from "lucide-react";

export const WavyLoaderPreferences = () => {
  const [style, setStyle] = useState<WavyStyle>('standard');
  const [shape, setShape] = useState<WavyShape>('circle');
  const [size, setSize] = useState(40);
  const [speed, setSpeed] = useState(1.5);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('wavy-loader-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStyle(parsed.style || 'standard');
        setShape(parsed.shape || 'circle');
        setSize(parsed.size || 40);
        setSpeed(parsed.speed || 1.5);
      } catch (e) {
        console.error("Error parsing wavy settings", e);
      }
    }
  }, []);

  const handleSave = (newStyle?: WavyStyle, newSize?: number, newSpeed?: number, newShape?: WavyShape) => {
    const s = newStyle ?? style;
    const z = newSize ?? size;
    const sp = newSpeed ?? speed;
    const sh = newShape ?? shape;
    
    const settings = { style: s, size: z, speed: sp, shape: sh };
    localStorage.setItem('wavy-loader-settings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('wavy-settings-updated', { detail: settings }));
  };

  if (!isMounted) return null;

  return (
    <Card className="w-full bg-card/40 backdrop-blur-xl border-border/40 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Waves className="h-6 w-6 text-primary animate-pulse" />
            Wavy System
          </CardTitle>
          <CardDescription className="text-muted-foreground/70 font-medium">
            Customize the global loading and mask structures.
          </CardDescription>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="mask-wavy border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all font-bold gap-2">
              <Settings2 className="h-4 w-4" />
              Tune Structure
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-2xl border-border/40 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">Wavy Architect</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">
                Fine-tune the mathematical wavy structure used across the app.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-8 py-6">
              <div className="flex justify-center p-12 bg-muted/20 mask-wavy border border-primary/10">
                <WavyLoader style={style} shape={shape} size={80} speed={speed} color="hsl(var(--primary))" usePreset={false} />
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        <Waves className="h-3.5 w-3.5" />
                        Base Shape
                    </div>
                    <RadioGroup 
                        value={shape} 
                        onValueChange={(val) => { 
                            const s = val as WavyShape;
                            setShape(s); 
                            handleSave(style, size, speed, s); 
                        }}
                        className="grid grid-cols-2 gap-3"
                    >
                        {[
                            { id: 'circle', icon: Circle, label: 'Circular' },
                            { id: 'square', icon: Square, label: 'Square' }
                        ].map((s) => (
                            <div key={s.id}>
                                <RadioGroupItem value={s.id} id={`shape-${s.id}`} className="peer sr-only" />
                                <Label
                                    htmlFor={`shape-${s.id}`}
                                    className="flex items-center gap-3 rounded-xl border-2 border-muted bg-popover/40 p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-pointer group"
                                >
                                    <s.icon className="h-4 w-4" />
                                    <span className="text-sm font-black uppercase tracking-tight">{s.label}</span>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    <Maximize2 className="h-3.5 w-3.5" />
                    Wavy Pattern
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
                      { id: 'standard', label: 'Classic', desc: 'Balanced' },
                      { id: 'high-frequency', label: 'Frequency', desc: 'Ripples' },
                      { id: 'deep', label: 'Abyssal', desc: 'Curves' },
                      { id: 'chaotic', label: 'Ethereal', desc: 'Organic' }
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
                      Amplitude ({size}px)
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

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      <Zap className="h-3.5 w-3.5" />
                      Velocity ({speed}s)
                    </div>
                  </div>
                  <Slider 
                    value={[speed]} 
                    min={0.2} 
                    max={4} 
                    step={0.1} 
                    onValueChange={([val]) => { 
                      setSpeed(val); 
                      handleSave(style, size, val); 
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
      
      <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-6">
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-muted/20 border border-border/10 items-center justify-center">
           <WavyLoader style={style} shape={shape} size={32} speed={speed} color="hsl(var(--primary))" usePreset={false} />
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Preview</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-2xl bg-muted/20 border border-border/10 justify-center">
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Shape</span>
           <span className="text-sm font-black capitalize">{shape}</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-2xl bg-muted/20 border border-border/10 justify-center">
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Pattern</span>
           <span className="text-sm font-black capitalize">{style.replace('-', ' ')}</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-2xl bg-muted/20 border border-border/10 justify-center">
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Amplitude</span>
           <span className="text-sm font-black">{size}px</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-2xl bg-muted/20 border border-border/10 justify-center">
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Velocity</span>
           <span className="text-sm font-black">{speed}s</span>
        </div>
      </CardContent>
    </Card>
  );
};
