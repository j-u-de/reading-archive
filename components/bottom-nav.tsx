import {BarChart3,BookOpen,FileText,Settings} from "lucide-react";
const links=[['library','书架','/',BookOpen],['analytics','统计','/analytics',BarChart3],['reports','报告','/reports',FileText],['settings','设置','/settings',Settings]] as const;
export default function BottomNav({active}:{active:string}){return <nav className="bottom-nav" aria-label="主导航">{links.map(([k,l,h,I])=><a className={active===k?'active':''} href={h} key={k}><I size={20}/><span>{l}</span></a>)}<a href="/login"><span>登录</span></a></nav>}
