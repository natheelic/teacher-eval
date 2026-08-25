export function AppLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 109 113"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="4" y="4" width="101" height="105" rx="24" fill="#030303" />
      <path
        d="M32 76V37h14.5c9 0 14.5 5.4 14.5 13.2 0 5-2.6 9-6.8 11.2L64 76H50.8l-8.6-13H43v13H32Zm11-21.6h2.6c3.4 0 5.4-1.7 5.4-4.6 0-2.9-2-4.5-5.4-4.5H43v9.1Z"
        fill="white"
      />
    </svg>
  );
}
