import { cn } from "@/lib/utils";

export const AppLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M 75 25 C 75 10, 25 10, 25 30 C 25 50, 75 50, 75 70 C 75 90, 25 90, 25 75"
      stroke="#2563eb"
      strokeWidth="24"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);
