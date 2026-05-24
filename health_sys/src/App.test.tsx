import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("Health web frontend", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the approved navigation and key integration labels", () => {
    render(<App />);

    expect(screen.getByText("日程打卡")).toBeInTheDocument();
    expect(screen.getByText("我的档案")).toBeInTheDocument();
    expect(screen.queryByText("用户画像")).not.toBeInTheDocument();
    expect(screen.getByText("点击和扣子聊天")).toBeInTheDocument();
    expect(screen.queryByText("R255 G245 B198")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "和agent一起打卡吧" })).toBeInTheDocument();
    expect(screen.getByAltText("1日打卡照片")).toBeInTheDocument();
    expect(screen.getByAltText("4日打卡照片")).toBeInTheDocument();
    expect(screen.getByAltText("7日打卡照片")).toBeInTheDocument();
  });

  it("opens the same agent drawer from the food scan card and AI assistant entry", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开餐食识别对话" }));
    expect(screen.getByRole("dialog", { name: "餐食识别 Agent" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "关闭 Agent 对话" }));
    await user.click(screen.getByRole("button", { name: "打开扣子 Agent 对话" }));
    expect(screen.getByRole("dialog", { name: "餐食识别 Agent" })).toBeInTheDocument();
  });

  it("sends a text-only agent message when no image is uploaded", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ answer: "可以试试魔芋牛肉和清炒绿叶菜" }), {
        headers: { "Content-Type": "application/json" },
        status: 200
      })
    );

    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开餐食识别对话" }));
    await user.type(screen.getByLabelText("补充说明"), "我想吃辣但是减脂的菜品，有什么推荐吗？");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/chat",
        expect.objectContaining({
          body: JSON.stringify({ message: "我想吃辣但是减脂的菜品，有什么推荐吗？" }),
          headers: { "Content-Type": "application/json" },
          method: "POST"
        })
      );
    });
    expect(await screen.findByText("可以试试魔芋牛肉和清炒绿叶菜")).toBeInTheDocument();
  });

  it("prefills the agent drawer from food and exercise recommendation buttons", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "agent餐单推荐" }));
    expect(screen.getByRole("dialog", { name: "餐食识别 Agent" })).toBeInTheDocument();
    expect(screen.getByLabelText("补充说明")).toHaveValue("我想吃辣但是减脂的菜品，有什么推荐吗？");

    await user.click(screen.getByRole("button", { name: "关闭 Agent 对话" }));
    await user.click(screen.getByRole("button", { name: "agent运动推荐" }));
    expect(screen.getByRole("dialog", { name: "餐食识别 Agent" })).toBeInTheDocument();
    expect(screen.getByLabelText("补充说明")).toHaveValue("有没有一些初学者瘦腿运动推荐？");
  });

  it("prefills the agent drawer from the calendar check-in button", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "和agent一起打卡吧" }));

    expect(screen.getByRole("dialog", { name: "餐食识别 Agent" })).toBeInTheDocument();
    expect(screen.getByLabelText("补充说明")).toHaveValue("我今天吃了...");
  });

  it("shows demo wearable data after syncing the band", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "同步手环" }));

    expect(screen.getAllByText("连接成功").length).toBeGreaterThan(0);
    expect(screen.getByText("7,642 步")).toBeInTheDocument();
    expect(screen.getByText("心率 82 bpm")).toBeInTheDocument();
    expect(screen.getByText("睡眠 7.4 h")).toBeInTheDocument();
    expect(screen.getByText("运动 34 min")).toBeInTheDocument();
  });

  it("loads nearby healthy shops from browser location", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ shops: [{ distance: "356m", name: "鲜活轻食", note: "低脂沙拉套餐" }] }), {
        headers: { "Content-Type": "application/json" },
        status: 200
      })
    );

    render(<App />);

    await user.click(screen.getByRole("button", { name: "获取附近推荐" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/nearby-shops?lat=22.3468&lng=113.5805");
    });
    expect(await screen.findByText("鲜活轻食")).toBeInTheDocument();
    expect(screen.getByText("356m")).toBeInTheDocument();
    expect(screen.getByText("低脂沙拉套餐")).toBeInTheDocument();
  });

  it("renders the returned answer after uploading an image to the agent drawer", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ answer: "估算总热量约 520 kcal" }), {
        headers: { "Content-Type": "application/json" },
        status: 200
      })
    );

    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开餐食识别对话" }));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const imageFile = new File(["meal"], "lunch.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [imageFile] } });

    await waitFor(() => {
      expect(screen.getByAltText("lunch.png")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("估算总热量约 520 kcal")).toBeInTheDocument();
  });
});
