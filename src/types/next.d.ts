// Type declarations for Next.js modules
declare module 'next/link';
declare module 'next/font/google';
declare module 'next' {
  export type Metadata = {
    title?: string;
    description?: string;
    [key: string]: string | string[] | number | boolean | undefined;
  };
}
