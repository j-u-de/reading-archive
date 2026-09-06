import { BarChart3, BookOpen, FileText, ImagePlus, Settings } from "lucide-react";

const links = [
  ["library", "书架", "/", BookOpen],
  ["analytics", "统计", "/analytics", BarChart3],
  ["poster", "海报", "/poster", ImagePlus],
  ["reports", "报告", "/reports", FileText],
  ["settings", "设置", "/settings", Settings],
] as const;

export default function BottomNav({ active }: { active: string }) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {links.map(([k, l, h, I]) => (
        <a className={active === k ? "active" : ""} href={h} key={k}>
          <I size={22} />
          <span>{l}</span>
        </a>
      ))}
    </nav>
  );
}
