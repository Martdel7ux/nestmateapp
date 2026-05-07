export function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <>
      {/* Blue logo shown in light mode */}
      <img
        src="/logo-blue.png"
        alt="NestMate"
        className={`${className} object-contain dark:hidden`}
      />
      {/* White logo shown in dark mode */}
      <img
        src="/logo-white.png"
        alt="NestMate"
        className={`${className} hidden object-contain dark:block`}
      />
    </>
  );
}
