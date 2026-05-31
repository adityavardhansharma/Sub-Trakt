<div align="center">
  <img src="assets/icon.png" alt="Sub Trakt app icon" width="112" height="112" />

# Sub Trakt

**A polished mobile subscription tracker for people who want to see recurring costs before they surprise them.**

[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=061A23)](https://reactnative.dev/)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.txt)

</div>

---

## Overview

Sub Trakt is a clean, calendar-first subscription tracker built with Expo and React Native. It helps users capture every recurring service, understand monthly spend at a glance, and browse upcoming charges through a tactile mobile interface.

The app focuses on the product experience rather than complicated setup: fast subscription entry, a visual billing calendar, responsive light/dark theming, simple profile personalization, and local-first storage that keeps the experience instant.

## What the app does

### Calendar-centered cost awareness

Sub Trakt treats subscriptions as events in a monthly calendar. Users can swipe between months, tap a day to inspect renewals, and instantly see how each billing date contributes to the month’s total.

### Subscription management

Users can add, edit, and delete subscriptions with:

- Service name
- Price
- Monthly or yearly billing cycle
- Start / renewal date
- Logo, emoji, or automatic favicon-style visual identity

### Monthly spend summary

The app calculates a total for the visible month so users can quickly understand recurring commitments without manually adding each service.

### Visual subscription identity

Subscriptions are easier to scan because the interface supports remote service icons, emoji-style logos, and generated initials when no logo is available.

### Personal profile

A lightweight profile section stores the user’s name and email locally, making the tracker feel personal without requiring an account system.

### Light and dark modes

Sub Trakt includes a theme system with persistent preferences and system-aware colors, so the interface remains comfortable across different device settings.

## Product design

Sub Trakt is designed around three ideas:

1. **Make recurring spending visible.** The calendar layout turns renewals into concrete dates instead of hidden line items.
2. **Keep interactions lightweight.** Bottom sheets, animated buttons, swipe gestures, and concise forms reduce friction for quick updates.
3. **Use calm, native-feeling surfaces.** Gradients, soft borders, safe-area-aware layouts, and subtle motion create a premium finance-tool feel without overwhelming the user.

## Feature highlights

| Area | Details |
| --- | --- |
| Billing calendar | 6-week monthly grid, current-day awareness, renewal markers, date selection, and swipe navigation. |
| Cost intelligence | Monthly total calculation that understands monthly and yearly subscriptions. |
| Subscription editor | Modal workflow for creating and updating services, prices, cycles, dates, and logo values. |
| Local data | Subscriptions, profile details, and theme preference are stored with AsyncStorage. |
| Theming | Light/dark palettes, system preference support, and native system UI background updates. |
| Mobile polish | Safe areas, animated press states, spring transitions, pan gestures, blur/gradient visual language, and iconography. |

## Tech stack

| Technology | Role in the app |
| --- | --- |
| **Expo** | App runtime, native project configuration, status bar, system UI, images, gradients, blur, and development workflow. |
| **React Native** | Cross-platform mobile UI primitives and gesture-ready screens. |
| **React 19** | Component model, state management with hooks, memoized derived values, and context. |
| **TypeScript** | Strong typing for subscription models, theme contracts, profile data, and app logic. |
| **AsyncStorage** | Local persistence for subscriptions, profile data, and theme preference. |
| **date-fns** | Calendar generation, month navigation, date formatting, and renewal calculations. |
| **lucide-react-native** | Consistent outline icons for navigation, actions, profile, theme, and status UI. |
| **expo-image** | Efficient logo/icon rendering for local and remote subscription visuals. |
| **expo-linear-gradient** | Premium gradients used across the app’s visual surfaces. |

## Architecture at a glance

```text
Sub-Trakt/
├── App.tsx                         # Main app shell, calendar UI, navigation, profile, and modal orchestration
├── src/
│   ├── components/                 # Reusable product UI pieces
│   │   ├── LogoAvatar.tsx          # Logo, emoji, or initials rendering for services
│   │   └── SubscriptionFormModal.tsx
│   ├── context/
│   │   └── AppThemeContext.tsx     # Theme preference, system theme resolution, and palette provider
│   ├── lib/
│   │   └── calendarLogic.ts        # Calendar grid, renewal matching, and monthly total calculations
│   ├── storage/
│   │   ├── profile.ts              # Local profile persistence
│   │   └── subscriptions.ts        # Local subscription CRUD helpers
│   └── theme/
│       └── colors.ts               # Light and dark color tokens
├── assets/                         # App icon, favicon, splash, and adaptive icon
├── app.json                        # Expo app metadata and native behavior
├── package.json                    # Runtime dependencies and scripts
└── LICENSE.txt                     # MIT license
```

## Core flows

### Add a subscription

1. Open the subscription form.
2. Enter the service name and cost.
3. Choose monthly or yearly recurrence.
4. Pick the start / renewal date.
5. Save it and see it appear on the billing calendar.

### Review upcoming charges

1. Swipe or tap through months.
2. Select a calendar day.
3. Review the subscriptions billed on that date.
4. Use the monthly total to understand the bigger picture.

### Personalize the experience

1. Open the profile panel.
2. Save a name and email locally.
3. Toggle light/dark mode to match your preferred look.

## Design system notes

- **Color tokens:** Centralized light and dark palettes keep visual decisions consistent.
- **Motion:** Animated press feedback, spring transitions, and swipe-driven month changes make the app feel tactile.
- **Cards and surfaces:** Raised cards, borders, gradients, and blur-inspired styling separate key financial information without heavy visual noise.
- **Typography:** Uppercase labels, strong totals, and compact metadata create a dashboard-like hierarchy.
- **Icon language:** Lucide icons reinforce common actions such as adding, editing, navigating, opening settings, and switching themes.

## Data model

A subscription is stored locally with the following shape:

```ts
type Subscription = {
  id: string;
  name: string;
  logo: string | null;
  price: number;
  cycle: "monthly" | "yearly";
  startDate: string;
  createdAt: string;
};
```

This model keeps the app simple and predictable while still supporting recurring billing logic and visual service identity.

## Project values

- **Private by default:** Core data is saved on-device.
- **Fast to use:** No account creation is required to start tracking.
- **Readable at a glance:** The calendar and monthly total answer the most important questions quickly.
- **Beautiful but practical:** Visual polish supports clarity instead of competing with it.

## License

Sub Trakt is released under the [MIT License](LICENSE.txt).
