666666666666666666666666666666

declare module 'lucide-react' {
  import { SVGProps, ComponentType } from 'react';

  // Define a generic LucideIcon type
  type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

  // Add specific icons that might be missing from default types
  export const StopCircle: LucideIcon;
  export const X: LucideIcon;
  export const Newspaper: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Star: LucideIcon;
  export const KeyRound: LucideIcon;

  // Re-export all other members from the original module
  export * from 'lucide-react/dist/lucide-react';
}
