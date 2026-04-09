'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FolderOpen, Settings, BookOpen } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 mb-6 flex items-center justify-between py-3 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-[#0f1729]/80 backdrop-blur-md border-b border-white/5">
      <Link href="/" className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
        <Image
          src="/logo.png"
          alt="Celi-Hire"
          width={40}
          height={40}
          className="rounded-xl"
        />
        <div>
          <h1 className="text-xl font-bold gradient-text leading-tight">Celi-Hire</h1>
          <p className="text-xs text-slate-400">셀리맥스 면접 리포트</p>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <a
          href="https://www.notion.so/celimax/1-322a8576028480f7b9a6d0fe1799bb11"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 glass-button text-white text-sm rounded-lg hover:scale-105 transition-transform"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">인터뷰 가이드</span>
        </a>
        <Link
          href="/history"
          className="flex items-center gap-2 px-3 py-2 glass-button text-white text-sm rounded-lg hover:scale-105 transition-transform"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">저장된 보고서</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 glass-button text-white text-sm rounded-lg hover:scale-105 transition-transform"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">설정</span>
        </Link>
      </div>
    </header>
  );
}
