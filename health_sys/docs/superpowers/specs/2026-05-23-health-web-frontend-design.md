# Health Web Frontend Design

## Goal

Build a desktop-first health web frontend that also adapts cleanly to mobile browsers. The product should feel simple, healthy, warm, and polished, with a light AI companion layer rather than a heavy dashboard feel.

## Confirmed Direction

Use the B layout direction:

- Desktop web uses a top navigation layout.
- The first navigation item is `日程打卡`.
- Other primary entries are `拍照识别`, `我的档案`, `设备连接`, `推荐方案`, `附近店铺`, and `AI 助手`.
- The desktop home view is an `智能健康总览` page with functional cards.
- Mobile uses a responsive single-column layout with stronger emphasis on `日程打卡`.

## Visual Style

The interface uses a fresh health palette:

- Primary rose: `#ea4961`
- Coral: `#f5827d`
- Peach: `#fcceaa`
- Sage green: `#9bb899`
- Accent yellow: `#fff5c6` from RGB `255,245,198`

The yellow accent should be used sparingly, mainly for small highlights such as active calendar cells, subtle tag fills, hover states, and the mobile Agent input glow. It should not become a dominant background color.

Cards should stay clean, lightly bordered, and compact. Rounded corners can be soft but should not become overly bubbly. The page should feel like a practical health assistant with a friendly calendar detail.

## Desktop Layout

Desktop uses a top navigation bar. The main dashboard contains:

1. `实物拍照计算热量`
   A prominent card for uploading or taking a food photo, with estimated calories and nutrition fields.

2. `我的档案`
   Replaces the earlier `用户画像` naming. It contains basic profile data, goals, diet preferences, allergies or avoidances, and behavior-derived tags.

3. `扣子 Agent`
   A small square entry card on desktop. It should feel accessible but not overpower the dashboard.

4. `日程打卡`
   A larger calendar card. Each day cell must be large enough to later contain a small AI-generated image or icon.

5. `附近健康店铺`
   A map-style recommendation card for nearby shops or restaurants.

6. Recommendation summaries
   Meal and exercise recommendations are based on `我的档案`, device data, and food logging behavior.

## Mobile Layout

Mobile is not a separate product. It is a responsive version of the same web app.

Mobile priorities:

- `日程打卡` should take more vertical space near the top.
- Calendar day cells should be large enough for future AI image/icon content.
- The Agent should not appear as a square card on mobile.
- Instead, show an input-style entry near the lower part of the screen with the placeholder `点击和扣子聊天`.
- Main cards stack vertically: calendar, photo calorie scan, profile summary, recommendations.
- Navigation can collapse into a bottom navigation or compact mobile menu, with `日程打卡` first.

## Feature Scope For First Build

The first frontend build is a polished static/prototype UI with realistic mock data:

- Photo calorie scanning card and upload affordance.
- `我的档案` card with profile and behavior tags.
- Device connection card showing wearable sync status.
- Meal and exercise recommendation cards.
- Nearby shop/map recommendation card.
- Calendar check-in page with large date cells and icon placeholders.
- Desktop Agent square entry and mobile Agent input-style entry.

Actual backend integrations, real image calorie recognition, real wearable APIs, real map APIs, and live Coze Agent embedding can be added later. The UI should leave clear integration points for them.

## Component Structure

Expected components:

- `AppShell`: top navigation and responsive page frame.
- `DashboardPage`: desktop-first overview layout.
- `CalendarCheckIn`: calendar grid with large date cells and AI icon slots.
- `FoodScanCard`: photo/upload calorie scanning entry.
- `ProfileCard`: `我的档案` summary and health tags.
- `DeviceCard`: wearable/device sync status.
- `RecommendationCard`: meal and exercise suggestions.
- `NearbyShopsCard`: map/shop recommendation preview.
- `AgentEntry`: desktop square entry and mobile input-style entry.

## Responsive Rules

- Desktop: top navigation, multi-column dashboard grid.
- Tablet: reduce grid columns and keep top navigation readable.
- Mobile: single-column cards, enlarged calendar section, compact navigation, input-style Agent entry.
- Text must not overflow buttons or cards.
- Calendar cell dimensions should be stable so future icons do not shift the layout.

## Error And Empty States

Prototype states should include friendly placeholders:

- Food photo not uploaded yet.
- Device not connected.
- No nearby shop selected.
- Calendar day without an AI icon yet.
- Agent not embedded yet.

These states should look intentional and ready for integration.

## Testing And Verification

When implemented, verify:

- Desktop layout at common widths around 1440px and 1024px.
- Mobile layout around 390px width.
- Navigation stays readable.
- Calendar date cells can visually hold small icons.
- The mobile Agent input does not overlap bottom navigation.
- Colors remain balanced, with yellow used only as a highlight.
