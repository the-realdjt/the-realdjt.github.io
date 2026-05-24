import { useState } from "react";
import checkInImageOne from "../../img/1.png";
import checkInImageTwo from "../../img/2.png";
import {
  Bot,
  CalendarDays,
  Camera,
  ChevronRight,
  MapPinned,
  Salad,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Watch
} from "lucide-react";
import { fetchNearbyShops, type NearbyShop } from "../api/shops";
import { calendarDays, metrics, profileTags, recommendations, shops } from "./dashboard-data";
import { TopNavigation } from "./TopNavigation";

const SYSU_ZHUHAI_SOUTH_GATE = {
  latitude: 22.3468,
  longitude: 113.5805
};

const CHECK_IN_PROMPT = "我今天吃了...";
const CHECK_IN_IMAGES: Record<number, string> = {
  1: checkInImageOne,
  4: checkInImageTwo,
  7: checkInImageOne
};

type DashboardPageProps = {
  onOpenAgentChat: (prompt?: string) => void;
};

type WearableData = {
  exerciseMinutes: string;
  heartRate: string;
  sleepHours: string;
  steps: string;
};

const DEMO_WEARABLE_DATA: WearableData = {
  exerciseMinutes: "34 min",
  heartRate: "82 bpm",
  sleepHours: "7.4 h",
  steps: "7,642 步"
};

function HeroSummary({
  isWearableSynced,
  onOpenAgentChat,
  onSyncWearable
}: DashboardPageProps & { isWearableSynced: boolean; onSyncWearable: () => void }) {
  return (
    <section className="hero-panel" id="top">
      <div className="hero-copy">
        <p className="eyebrow">今日健康总览</p>
        <h1>把吃、动、睡和打卡放到一个清爽工作台里。</h1>
        <p>先看日程，再在 Agent 对话里上传餐照识别热量，结合我的档案和设备数据，生成餐单、运动和附近店铺建议。</p>
      </div>
      <div className="hero-actions">
        <button className="primary-action" type="button" onClick={() => onOpenAgentChat()}>
          <Camera size={18} />
          打开识别对话
        </button>
        <button className="secondary-action" type="button" onClick={onSyncWearable}>
          <Watch size={18} />
          {isWearableSynced ? "连接成功" : "同步手环"}
        </button>
      </div>
    </section>
  );
}

function MetricStrip() {
  return (
    <section className="metric-strip" aria-label="今日指标">
      {metrics.map((metric) => (
        <article className="metric-card" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <small>{metric.unit}</small>
        </article>
      ))}
    </section>
  );
}

function FoodScanCard({ onOpenAgentChat }: DashboardPageProps) {
  return (
    <section className="card scan-card" id="拍照识别">
      <div className="section-heading">
        <Camera size={20} />
        <h2>实物拍照计算热量</h2>
      </div>
      <p>上传或拍摄餐食后，将在 Agent 对话里识别食物并估算 kcal、蛋白质、碳水和脂肪。</p>
      <div className="photo-preview" aria-hidden="true">
        <span className="plate plate-large" />
        <span className="plate plate-small" />
      </div>
      <button type="button" onClick={() => onOpenAgentChat()} aria-label="打开餐食识别对话">
        进入 Agent 识别
        <ChevronRight size={17} />
      </button>
    </section>
  );
}

function ProfileCard() {
  return (
    <section className="card profile-card" id="我的档案">
      <div className="section-heading">
        <UserRound size={20} />
        <h2>我的档案 · 健康偏好</h2>
      </div>
      <p>基础信息、目标、饮食偏好、忌口和行为记录会成为推荐依据。</p>
      <div className="profile-tags">
        {profileTags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="profile-row">
        <ShieldCheck size={18} />
        <span>数据仅用于生成当前健康建议</span>
      </div>
    </section>
  );
}

function AgentEntry({ onOpenAgentChat }: DashboardPageProps) {
  return (
    <>
      <section className="card agent-card desktop-agent" id="AI 助手">
        <button className="agent-square agent-trigger" type="button" aria-label="打开扣子 Agent 对话" onClick={() => onOpenAgentChat()}>
          <Bot size={26} />
          <strong>扣子 Agent</strong>
          <span>问推荐原因</span>
        </button>
      </section>
      <section className="mobile-agent-entry" aria-label="扣子聊天入口">
        <button className="mobile-agent-entry-trigger" type="button" onClick={() => onOpenAgentChat()}>
          <span>点击和扣子聊天</span>
          <span className="mobile-agent-icon" aria-hidden="true">
            <Send size={16} />
          </span>
        </button>
      </section>
    </>
  );
}

function CalendarCheckIn({ onOpenAgentChat }: DashboardPageProps) {
  return (
    <section className="card calendar-card" id="日程打卡">
      <div className="calendar-heading">
        <div className="section-heading">
          <CalendarDays size={20} />
          <h2>日程打卡日历</h2>
        </div>
        <button className="calendar-agent-button" type="button" onClick={() => onOpenAgentChat(CHECK_IN_PROMPT)}>
          和agent一起打卡吧
        </button>
      </div>
      <div className="calendar-grid" aria-label="日程打卡日期">
        {calendarDays.map((day) => (
          <button className={day.checked ? "day-cell checked" : "day-cell"} type="button" key={day.date}>
            <span className="date">{day.date}</span>
            {CHECK_IN_IMAGES[day.date] ? (
              <img className="check-in-photo" alt={`${day.date}日打卡照片`} src={CHECK_IN_IMAGES[day.date]} />
            ) : (
              <span className="icon-slot" aria-hidden="true">
                <Sparkles size={14} />
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

function DeviceCard({ onSyncWearable, wearableData }: { onSyncWearable: () => void; wearableData: WearableData | null }) {
  return (
    <section className="card device-card" id="设备连接">
      <div className="section-heading">
        <Watch size={20} />
        <h2>设备连接</h2>
      </div>
      <div className="watch-visual" aria-hidden="true">
        <span />
      </div>
      <p>手环已同步：步数、睡眠、心率和运动记录。</p>
      <button className="device-sync-button" type="button" onClick={onSyncWearable}>
        <Watch size={15} />
        {wearableData ? "重新同步" : "同步手环数据"}
      </button>
      {wearableData ? (
        <div className="wearable-data-grid" aria-label="手环同步数据">
          <span>连接成功</span>
          <strong>{wearableData.steps}</strong>
          <span>心率 {wearableData.heartRate}</span>
          <span>睡眠 {wearableData.sleepHours}</span>
          <span>运动 {wearableData.exerciseMinutes}</span>
        </div>
      ) : null}
      <div className="device-status">
        <span />
        {wearableData ? "刚刚更新" : "12 分钟前更新"}
      </div>
    </section>
  );
}

function RecommendationPanel({ onOpenAgentChat }: DashboardPageProps) {
  return (
    <section className="card recommendation-card" id="推荐方案">
      <div className="section-heading">
        <Salad size={20} />
        <h2>推荐餐单 / 运动</h2>
      </div>
      <div className="recommendation-list">
        {recommendations.map((item) => (
          <article key={item.title}>
            <small>{item.meta}</small>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
            <button className="recommendation-agent-button" type="button" onClick={() => onOpenAgentChat(item.agentPrompt)}>
              <Bot size={16} />
              {item.actionLabel}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function NearbyShopsCard() {
  const [displayedShops, setDisplayedShops] = useState<NearbyShop[]>(shops);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLoadNearbyShops() {
    setIsLoading(true);
    setStatus("正在查询中山大学珠海校区南门 1 公里内店铺...");
    try {
      const nextShops = await fetchNearbyShops(SYSU_ZHUHAI_SOUTH_GATE);
      setDisplayedShops(nextShops);
      setStatus("已按中山大学珠海校区南门更新");
    } catch {
      setStatus("附近店铺获取失败，已显示默认推荐");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="card shops-card" id="附近店铺">
      <div className="shops-heading-row">
        <div className="section-heading">
          <MapPinned size={20} />
          <h2>附近健康店铺</h2>
        </div>
        <button className="nearby-shops-button" type="button" disabled={isLoading} onClick={handleLoadNearbyShops}>
          {isLoading ? "定位中" : "获取附近推荐"}
        </button>
      </div>
      <div className="map-preview" aria-label="附近健康店铺地图预览">
        <span className="map-road road-one" />
        <span className="map-road road-two" />
        <span className="map-pin" />
      </div>
      {status ? <p className="nearby-shops-status">{status}</p> : null}
      <div className="shop-list">
        {displayedShops.map((shop) => (
          <article key={shop.name}>
            <strong>{shop.name}</strong>
            <span>{shop.distance}</span>
            <small>{shop.note}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function NearbyAndDevicePanel({ onSyncWearable, wearableData }: { onSyncWearable: () => void; wearableData: WearableData | null }) {
  return (
    <section className="nearby-device-panel" aria-label="附近店铺与设备连接">
      <NearbyShopsCard />
      <DeviceCard onSyncWearable={onSyncWearable} wearableData={wearableData} />
    </section>
  );
}

export function DashboardPage({ onOpenAgentChat }: DashboardPageProps) {
  const [wearableData, setWearableData] = useState<WearableData | null>(null);
  const syncWearable = () => setWearableData(DEMO_WEARABLE_DATA);

  return (
    <>
      <TopNavigation />
      <div className="page">
        <HeroSummary isWearableSynced={Boolean(wearableData)} onOpenAgentChat={onOpenAgentChat} onSyncWearable={syncWearable} />
        <MetricStrip />
        <section className="dashboard-grid" aria-label="智能健康总览">
          <FoodScanCard onOpenAgentChat={onOpenAgentChat} />
          <ProfileCard />
          <AgentEntry onOpenAgentChat={onOpenAgentChat} />
          <CalendarCheckIn onOpenAgentChat={onOpenAgentChat} />
          <NearbyAndDevicePanel onSyncWearable={syncWearable} wearableData={wearableData} />
          <RecommendationPanel onOpenAgentChat={onOpenAgentChat} />
        </section>
      </div>
    </>
  );
}
