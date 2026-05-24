# Health Web Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution for this repo because the user asked to implement directly in this session and this directory is not a git repository. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished desktop-first responsive health web frontend from the approved design spec.

**Architecture:** Use a Vite React app with focused TSX components and a single CSS design system. The app is a static frontend prototype with realistic mock data and clear integration points for food recognition, wearable devices, map recommendations, and Coze Agent.

**Tech Stack:** Vite, React, TypeScript, CSS, lucide-react, Vitest, Testing Library.

---

## File Structure

- Create `package.json`: scripts and dependencies.
- Create `index.html`: Vite HTML entry.
- Create `src/main.tsx`: React mount entry.
- Create `src/App.tsx`: app composition and mock data.
- Create `src/App.test.tsx`: behavior tests for key labels, layout content, and mobile Agent placeholder text.
- Create `src/styles.css`: full responsive visual system and component styling.
- Create `src/vite-env.d.ts`: Vite type reference.
- Create `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`: TypeScript and Vite config.

## Tasks

### Task 1: Project Scaffold And Test Setup

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.test.tsx`
- Create: `src/vite-env.d.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`

- [ ] **Step 1: Create package and config files**

Create a Vite React TypeScript setup with scripts:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: Write failing UI tests first**

`src/App.test.tsx` must assert:

```tsx
expect(screen.getByText("日程打卡")).toBeInTheDocument();
expect(screen.getByText("我的档案")).toBeInTheDocument();
expect(screen.getByText("点击和扣子聊天")).toBeInTheDocument();
expect(screen.getByText("R255 G245 B198")).toBeInTheDocument();
```

- [ ] **Step 3: Run tests and verify red**

Run `npm test`. Expected: fail before dependencies or implementation are complete.

### Task 2: Implement React Content

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add mock data**

Define arrays for nav items, calendar days, profile tags, metrics, recommendations, and nearby shops.

- [ ] **Step 2: Build component sections**

Implement focused inline components:

```tsx
function TopNavigation() {}
function CalendarCheckIn() {}
function FoodScanCard() {}
function ProfileCard() {}
function DeviceCard() {}
function RecommendationPanel() {}
function NearbyShopsCard() {}
function AgentEntry() {}
```

- [ ] **Step 3: Compose dashboard**

Render a desktop-first grid with top navigation, hero summary, food scan, profile, Agent square, calendar, recommendations, devices, and map card.

- [ ] **Step 4: Run tests and verify green**

Run `npm test`. Expected: all UI label tests pass.

### Task 3: Implement Styling And Responsiveness

**Files:**
- Create: `src/styles.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Import styles**

Import `./styles.css` in `src/main.tsx`.

- [ ] **Step 2: Add desktop design system**

Use CSS variables:

```css
--rose: #ea4961;
--coral: #f5827d;
--peach: #fcceaa;
--sage: #9bb899;
--sun: #fff5c6;
```

- [ ] **Step 3: Add responsive rules**

At mobile widths, stack cards, enlarge the calendar section, hide the desktop Agent square, and show the input-style Agent entry with `点击和扣子聊天`.

- [ ] **Step 4: Run build**

Run `npm run build`. Expected: TypeScript and Vite build succeed.

### Task 4: Local Verification

**Files:**
- No new files.

- [ ] **Step 1: Start dev server**

Run `npm run dev -- --port 5173`.

- [ ] **Step 2: Verify browser response**

Run `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5173/ -TimeoutSec 5`. Expected: `200 OK`.

- [ ] **Step 3: Final manual checks**

Check the UI at desktop width and narrow width. Confirm:

- Top navigation starts with `日程打卡`.
- `用户画像` does not appear.
- `我的档案` appears.
- Desktop Agent is a small square.
- Mobile Agent is an input-style entry.
- Calendar cells are large enough for future AI icons.
- Yellow `#fff5c6` appears only as a small accent.
