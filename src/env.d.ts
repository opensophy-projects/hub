import 'astro/client';

declare global {
  const process: {
    env: Record<string, string | undefined>;
    stdout?: { isTTY?: boolean; write?: (chunk: string) => void };
    exit?: (code?: number) => never;
  };
}
