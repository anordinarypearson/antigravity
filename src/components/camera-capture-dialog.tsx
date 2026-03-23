
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCapture: (dataUri: string) => void;
}

export function CameraCaptureDialog({ isOpen, onOpenChange, onCapture }: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | undefined>(undefined);
  
  const { toast } = useToast();

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreamReady(false);
  }, []);

  const startStream = useCallback(async (deviceId?: string) => {
    stopStream();
    setHasPermission(null);
    setIsStreamReady(false);

    const constraints: MediaTrackConstraints = {
      facingMode: { ideal: "environment" },
    };
    if (deviceId) {
      constraints.deviceId = { exact: deviceId };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: constraints });
      streamRef.current = stream;
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasPermission(false);
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description: "Please enable camera permissions in your browser settings.",
      });
    }
  }, [stopStream, toast]);

  useEffect(() => {
    if (isOpen) {
      const getDevicesAndStart = async () => {
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
          setDevices(videoDevices);

          let initialDeviceId = currentDeviceId;
          if (!initialDeviceId && videoDevices.length > 0) {
            const backCamera = videoDevices.find((d) => d.label.toLowerCase().includes("back"));
            initialDeviceId = backCamera ? backCamera.deviceId : videoDevices[0].deviceId;
            setCurrentDeviceId(initialDeviceId);
          }
          await startStream(initialDeviceId);
        } catch (e) {
          console.error("Device enumeration failed:", e);
          setHasPermission(false);
        }
      };
      getDevicesAndStart();
    } else {
      stopStream();
    }
  }, [isOpen, currentDeviceId, startStream, stopStream]);

  const handleSwitchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex((d) => d.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setCurrentDeviceId(devices[nextIndex].deviceId);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !isStreamReady) return;

    setIsCapturing(true);

    // Simple stabilization: take a few frames and pick the "sharpest"
    // This is a placeholder for a more complex algorithm. For now, we just add a delay.
    setTimeout(() => {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current!.videoWidth;
        canvas.height = videoRef.current!.videoHeight;
        const context = canvas.getContext("2d");
        if (context) {
            context.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);
            const dataUri = canvas.toDataURL("image/png");
            onCapture(dataUri);
        } else {
             toast({ title: "Capture failed", description: "Could not get canvas context.", variant: "destructive" });
        }
        setIsCapturing(false);
        onOpenChange(false);
    }, 500); // 500ms delay to allow focus
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Capture Document</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full aspect-video rounded-md bg-muted"
            autoPlay
            muted
            playsInline
            onCanPlay={() => setIsStreamReady(true)}
          />
          {hasPermission === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center">
              <WavyLoader className="h-8 w-8 animate-spin" />
              <p className="mt-2 text-muted-foreground">Requesting camera access...</p>
            </div>
          )}
          {hasPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4 text-center">
              <Alert variant="destructive">
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  Please enable camera permissions in your browser settings to use this feature. You might need to reload the page.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center w-full gap-2">
            <div>
                 {devices.length > 1 && (
                    <Button variant="outline" onClick={handleSwitchCamera} disabled={isCapturing}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Switch Camera
                    </Button>
                )}
            </div>
            <div className="flex gap-2">
                <DialogClose asChild>
                    <Button variant="outline" disabled={isCapturing}>Cancel</Button>
                </DialogClose>
                <Button onClick={handleCapture} disabled={!isStreamReady || isCapturing}>
                    {isCapturing ? <WavyLoader className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isCapturing ? "Capturing..." : "Capture"}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
