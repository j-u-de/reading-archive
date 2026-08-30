import type { Metadata } from 'next';
import './globals.css';
import RegisterSW from './register-sw';

export const metadata: Metadata = { title: 'Reading Archive', description: '你的私人数字书房', manifest: '/manifest.webmanifest', icons: { icon: '/icon.svg' } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body><RegisterSW />{children}</body></html>;
}
