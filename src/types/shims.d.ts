declare module "sonner" {
  export const Toaster: (props: any) => JSX.Element;
  export const toast: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
}

declare module "react-markdown" {
  const ReactMarkdown: (props: any) => JSX.Element;
  export default ReactMarkdown;
}

declare module "react-hook-form" {
  export function useForm<T = any>(options?: any): any;
}

declare module "clsx" {
  export type ClassValue = any;
  export function clsx(...inputs: ClassValue[]): string;
}

declare module "tailwind-merge" {
  export function twMerge(...inputs: string[]): string;
}

declare module "undici-types";
declare module "type-fest";
declare module "@vite-pwa/assets-generator/config";
declare module "@vite-pwa/assets-generator/api";
declare module "csstype" {
  const content: any;
  export = content;
}

interface ExtendableEvent extends Event {}
