// Type declarations for ChatGPT SDK bootstrap
declare global {
  interface Window {
    innerBaseUrl: string;
    __isChatGptApp: boolean;
    openai?: {
      openExternal: (options: { href: string }) => void;
    };
  }
}

export {};

