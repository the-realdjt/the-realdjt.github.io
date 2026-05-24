export const calendarDays = [
  { date: 1, checked: true },
  { date: 2, checked: false },
  { date: 3, checked: true },
  { date: 4, checked: false },
  { date: 5, checked: false },
  { date: 6, checked: true },
  { date: 7, checked: false },
  { date: 8, checked: true },
  { date: 9, checked: false },
  { date: 10, checked: true },
  { date: 11, checked: false },
  { date: 12, checked: true },
  { date: 13, checked: false },
  { date: 14, checked: false }
];

export const metrics = [
  { label: "今日摄入", value: "1,286", unit: "kcal" },
  { label: "手环步数", value: "6,820", unit: "步" },
  { label: "推荐运动", value: "18", unit: "分钟" }
];

export const profileTags = ["控糖", "轻食偏好", "晚间运动", "不吃香菜", "目标减脂"];

export const recommendations = [
  {
    actionLabel: "agent餐单推荐",
    agentPrompt: "我想吃辣但是减脂的菜品，有什么推荐吗？",
    title: "午餐推荐",
    detail: "鸡胸藜麦碗 + 番茄菌菇汤，预计 468 kcal",
    meta: "高蛋白 · 少油"
  },
  {
    actionLabel: "agent运动推荐",
    agentPrompt: "有没有一些初学者瘦腿运动推荐？",
    title: "饭后运动",
    detail: "餐后 30 分钟快走 18 分钟，心率保持轻中强度",
    meta: "手环同步"
  }
];

export const shops = [
  { name: "青禾轻食", distance: "700m", note: "低脂套餐可选" },
  { name: "谷雨鲜蔬", distance: "1.2km", note: "高纤维沙拉" }
];
