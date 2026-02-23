'use client';

import { ReactNode } from 'react';

const URL_REGEX = /(https?:\/\/[^\s<>"')\]},;]+)/g;

interface LinkifyProps {
  children: string;
}

export default function Linkify({ children }: LinkifyProps) {
  if (!children || typeof children !== 'string') return <>{children}</>;

  const parts = children.split(URL_REGEX);
  if (parts.length === 1) return <>{children}</>;

  const elements: ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (URL_REGEX.test(part)) {
      elements.push(
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline underline-offset-2 break-all"
        >
          {part}
        </a>
      );
    } else {
      elements.push(part);
    }
    // Reset regex lastIndex since we're using global flag
    URL_REGEX.lastIndex = 0;
  }

  return <>{elements}</>;
}
