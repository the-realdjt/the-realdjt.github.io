import { Bot, CalendarDays, Camera, HeartPulse, MapPinned, Salad, UserRound, Watch } from "lucide-react";

const navItems = [
  { label: "日程打卡", icon: CalendarDays },
  { label: "拍照识别", icon: Camera },
  { label: "我的档案", icon: UserRound },
  { label: "设备连接", icon: Watch },
  { label: "推荐方案", icon: Salad },
  { label: "附近店铺", icon: MapPinned },
  { label: "AI 助手", icon: Bot }
];

export function TopNavigation() {
  return (
    <header className="top-navigation">
      <a className="brand-mark" href="#top" aria-label="NutriBloom 首页">
        <span className="brand-symbol">
          <HeartPulse size={20} strokeWidth={2.4} />
        </span>
        <span>
          <strong>NutriBloom</strong>
          <small>智能健康助手</small>
        </span>
      </a>
      <nav className="nav-links" aria-label="主导航">
        {navItems.map(({ label, icon: Icon }, index) => (
          <a className={index === 0 ? "active" : ""} href={`#${label}`} key={label}>
            <Icon size={16} strokeWidth={2.2} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </header>
  );
}
