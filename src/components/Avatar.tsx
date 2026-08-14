export function Avatar({
  src,
  alt,
  fallback,
  size = "lg",
}: {
  src?: string;
  alt: string;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-16 w-16 text-xl",
    lg: "h-32 w-32 text-4xl",
    xl: "h-40 w-40 text-5xl",
  };

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-foreground ${sizeClasses[size]}`}
      aria-label={alt}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="font-display font-medium">{fallback}</span>
      )}
    </div>
  );
}
