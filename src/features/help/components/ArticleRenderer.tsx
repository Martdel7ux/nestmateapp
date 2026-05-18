import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  className?: string;
}

export function ArticleRenderer({ content, className }: Props) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }: { children?: ReactNode }) => (
            <h1 className="text-2xl font-bold text-foreground mt-6 mb-3 first:mt-0">{children}</h1>
          ),
          h2: ({ children }: { children?: ReactNode }) => (
            <h2 className="text-xl font-semibold text-foreground mt-5 mb-2">{children}</h2>
          ),
          h3: ({ children }: { children?: ReactNode }) => (
            <h3 className="text-base font-semibold text-foreground mt-4 mb-1.5">{children}</h3>
          ),
          p: ({ children }: { children?: ReactNode }) => (
            <p className="text-sm text-foreground/90 leading-relaxed mb-3">{children}</p>
          ),
          ul: ({ children }: { children?: ReactNode }) => (
            <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-foreground/90">{children}</ul>
          ),
          ol: ({ children }: { children?: ReactNode }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 text-sm text-foreground/90">{children}</ol>
          ),
          li: ({ children }: { children?: ReactNode }) => <li className="leading-relaxed">{children}</li>,
          code: ({ inline, children }: { inline?: boolean; children?: ReactNode }) =>
            inline ? (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">{children}</code>
            ) : (
              <code className="block rounded-xl bg-muted px-4 py-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre mb-3">
                {children}
              </code>
            ),
          pre: ({ children }: { children?: ReactNode }) => <div className="mb-3">{children}</div>,
          blockquote: ({ children }: { children?: ReactNode }) => (
            <blockquote className="border-l-4 border-primary/40 pl-4 text-sm text-muted-foreground italic mb-3 bg-primary/5 py-2 pr-3 rounded-r-xl">
              {children}
            </blockquote>
          ),
          strong: ({ children }: { children?: ReactNode }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          a: ({ href, children }: { href?: string; children?: ReactNode }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }: { src?: string; alt?: string }) => (
            <img
              src={src}
              alt={alt ?? ""}
              className="rounded-2xl w-full object-cover my-4 max-h-64"
            />
          ),
          hr: () => <hr className="border-border my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
