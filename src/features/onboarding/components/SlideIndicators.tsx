interface SlideIndicatorsProps {
  total: number;
  current: number;
}

export function SlideIndicators({ total, current }: SlideIndicatorsProps) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current
              ? "w-5 bg-primary"
              : "w-1.5 bg-border"
          }`}
        />
      ))}
    </div>
  );
}
