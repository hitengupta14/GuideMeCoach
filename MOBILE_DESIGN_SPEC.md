# Mobile UI Design Specification

## 🎨 Design System Overview

### Brand Identity
- **Primary Color**: Indigo (#6366F1) - Modern, professional, trustworthy
- **Secondary Color**: Orange (#FB923C) - Energetic, action-oriented
- **Accent Palette**: Green, Amber, Red for status indicators

### Design Philosophy
- **Modern**: Contemporary design patterns following iOS and Material Design principles
- **Accessible**: WCAG AA compliant, 48px+ touch targets
- **Responsive**: Adapts seamlessly to all device sizes
- **Consistent**: Unified design system across all screens

---

## 📐 Layout System

### Screen Padding
```
Standard: 16px (lg)
Compact: 12px (md)
Compact: 8px (sm) - For nested elements
```

### Grid System
```
2-column: For tablets and landscape
1-column: For phones and portrait
Gap: 16px between elements
```

---

## 🎯 Component States

### Button States
1. **Default**: Full opacity, interactive
2. **Active**: Pressed state (0.7 opacity)
3. **Disabled**: 0.6 opacity, no interaction
4. **Loading**: Spinner visible, no interaction

### Card States
1. **Default**: Flat background
2. **Elevated**: Shadow 8px
3. **Hover**: Slightly lighter background
4. **Active**: Reduced opacity

### Input States
1. **Default**: Border visible
2. **Focused**: Primary color border, shadow
3. **Error**: Red border and error text
4. **Disabled**: Gray background, no interaction

---

## 🌈 Color Usage Guidelines

### Primary Backgrounds
- Use `colors.background` for main screen background
- Use `colors.card` for contained elements

### Text Hierarchy
1. **Primary Text**: `colors.text` (main content)
2. **Secondary Text**: `colors.textSecondary` (descriptions)
3. **Tertiary Text**: `colors.textTertiary` (hints, placeholders)

### Status Indicators
- **Success**: Green (#10B981) - Positive actions
- **Warning**: Amber (#F59E0B) - Caution needed
- **Error**: Red (#EF4444) - Problems, denials
- **Info**: Primary Blue (#6366F1) - Information

---

## 📱 Screen Templates

### Template 1: List Screen
```
┌─────────────────────┐
│ Gradient Header     │
│ Title + Subtitle    │
└─────────────────────┘
┌─────────────────────┐
│ Search Bar          │
└─────────────────────┘
┌─────────────────────┐
│ Filter Chips        │
│ Category | Level    │
└─────────────────────┘
┌─────────────────────┐
│ List Item 1         │
├─────────────────────┤
│ List Item 2         │
├─────────────────────┤
│ List Item 3         │
└─────────────────────┘
```

### Template 2: Dashboard Screen
```
┌─────────────────────┐
│ Gradient Header     │
│ Welcome Message     │
└─────────────────────┘
┌─────────────────────┐
│ Stat Cards Grid     │
│ ┌────┐  ┌────┐    │
│ │ A  │  │ B  │    │
│ └────┘  └────┘    │
└─────────────────────┘
┌─────────────────────┐
│ Main Card Section   │
│ With Progress       │
└─────────────────────┘
┌─────────────────────┐
│ Quick Actions Grid  │
│ ┌──┐┌──┐┌──┐┌──┐  │
│ │  ││  ││  ││  │  │
│ └──┘└──┘└──┘└──┘  │
└─────────────────────┘
```

### Template 3: Profile Screen
```
┌─────────────────────┐
│ Gradient Header     │
│ Avatar + Name       │
│ Email               │
└─────────────────────┘
┌─────────────────────┐
│ Stats Grid          │
│ ┌───┬───┬───┐      │
│ │ A │ B │ C │      │
│ └───┴───┴───┘      │
└─────────────────────┘
┌─────────────────────┐
│ Menu Item 1         │
├─────────────────────┤
│ Menu Item 2         │
├─────────────────────┤
│ Menu Item 3         │
└─────────────────────┘
┌─────────────────────┐
│ Action Button       │
└─────────────────────┘
```

---

## 🎬 Animation Specifications

### Page Transitions
- **Duration**: 300-400ms
- **Easing**: cubic-bezier (ease-out)
- **Type**: Fade + Slide combination

### Element Animations
- **Entrance**: Fade in + Scale (0.8 → 1)
- **Duration**: 300ms
- **Stagger**: 50ms between elements

### Button Press
- **Duration**: 100ms
- **Effect**: Scale (1 → 0.95) + opacity fade
- **Easing**: ease-in-out

### Loading States
- **Duration**: Infinite
- **Effect**: Pulse or rotation
- **Opacity range**: 0.6 → 1 or 360° rotation

---

## 🔤 Typography Scale

### Display
```
Display1: 32px, 700 weight, -0.5px letter spacing
Display2: 28px, 700 weight, -0.3px letter spacing
```

### Heading
```
Heading1: 24px, 700 weight
Heading2: 20px, 700 weight
Heading3: 18px, 600 weight
```

### Body
```
Body1: 16px, 400 weight
Body2: 14px, 400 weight
Body3: 13px, 400 weight
```

### Labels
```
Label1: 14px, 600 weight, 0.5px letter spacing
Label2: 12px, 600 weight, 0.5px letter spacing
```

### Captions
```
Caption1: 12px, 400 weight, 0.3px letter spacing
Caption2: 11px, 400 weight, 0.2px letter spacing
```

---

## 🎨 Component Specifications

### Buttons
```
Height:
  - Small: 40px
  - Medium: 48px
  - Large: 56px

Padding:
  - Horizontal: 16px (lg), 12px (md), 8px (sm)
  - Vertical: 16px (lg), 12px (md), 8px (sm)

Border Radius: 12px

Variants:
  1. Primary: Gradient (indigo to indigo-dark)
  2. Secondary: Solid orange
  3. Outline: Transparent with border
  4. Ghost: Text only
  5. Danger: Solid red
```

### Cards
```
Min Height: 56px (content dependent)
Border Radius: 16px
Padding: 16px

Variants:
  1. Default: Border + flat background
  2. Elevated: Shadow lg, no border
  3. Flat: Background color change only

Shadow Elevation:
  - Default: md (opacity 0.08)
  - Elevated: lg (opacity 0.12)
```

### Input Fields
```
Height: 48px
Border Radius: 8px
Border Width: 1px
Padding: 12px (horizontal), 12px (vertical)
Font Size: 16px (body2)

States:
  1. Default: Gray border
  2. Focus: Primary border + shadow
  3. Error: Red border + error text
  4. Disabled: Gray background
```

### Avatar
```
Sizes:
  - Small: 32px (diameter)
  - Medium: 48px
  - Large: 64px
  - X-Large: 96px

Border Radius: 50% (circular)
Font Size: diameter / 2.5
Font Weight: 700
```

### Badge
```
Height: 24px
Padding: 6px horizontal, 4px vertical
Border Radius: full (9999px)
Font Size: 12px (caption1)
Font Weight: 600

Variants:
  1. Default: Gray background
  2. Success: Green background + text
  3. Warning: Amber background + text
  4. Error: Red background + text
  5. Info: Blue background + text
```

---

## 🌙 Dark Mode Specifications

### Background Colors
```
Light: #FFFFFF
Dark: #111827 (pure black-adjacent)
```

### Text Colors
```
Light Primary: #1F2937
Dark Primary: #F3F4F6
Light Secondary: #6B7280
Dark Secondary: #D1D5DB
```

### Card Backgrounds
```
Light: #FFFFFF
Dark: #1F2937 (matches background, raised with border)
```

### Borders
```
Light: #E5E7EB
Dark: #374151
```

---

## 🎯 Spacing Scale

```
4px   - xs (element gaps)
8px   - sm (small spacing)
12px  - md (medium spacing)
16px  - lg (standard spacing) ← Most common
20px  - xl (large spacing)
24px  - 2xl (extra large)
32px  - 3xl (section spacing)
40px  - 4xl (large sections)
48px  - 5xl (hero spacing)
```

---

## 📏 Shadow Specifications

### Shadow Small
```
Offset: 0, 1px
Radius: 2px
Opacity: 0.05
Color: Black
```

### Shadow Medium
```
Offset: 0, 2px
Radius: 4px
Opacity: 0.08
Color: Black
```

### Shadow Large
```
Offset: 0, 4px
Radius: 8px
Opacity: 0.12
Color: Black
```

### Shadow X-Large
```
Offset: 0, 8px
Radius: 12px
Opacity: 0.16
Color: Black
```

---

## 🔄 Interaction States

### Touch Targets
- **Minimum**: 48x48px
- **Recommended**: 56x56px for primary actions

### Feedback
- **Visual**: Color change or scale
- **Duration**: 100-200ms
- **Feedback**: Immediate response

### Disabled
- **Opacity**: 0.6
- **Cursor**: Not-allowed (web)
- **Interaction**: Blocked

---

## ♿ Accessibility Guidelines

### Color Contrast
- Text on background: 4.5:1 (normal text)
- Large text: 3:1
- UI components: 3:1

### Touch Targets
- Minimum: 44x44px
- Recommended: 48x48px or larger
- Spacing: 8px minimum between targets

### Typography
- Line height: 1.5+ for body text
- Letter spacing: 0.5px for labels
- Max line length: 75 characters

### Motion
- Avoid: Flashing > 3x per second
- Provide: Reduced motion support
- Duration: Keep animations < 300ms

---

## 🎨 Color Palette Reference

### Primary Colors
```
#6366F1 - Primary (Indigo)
#818CF8 - Primary Light
#4F46E5 - Primary Dark
#FB923C - Secondary (Orange)
#FDBA74 - Secondary Light
#EA580C - Secondary Dark
```

### Status Colors
```
#10B981 - Success (Green)
#6EE7B7 - Success Light
#059669 - Success Dark
#F59E0B - Warning (Amber)
#FCD34D - Warning Light
#D97706 - Warning Dark
#EF4444 - Error (Red)
#FCA5A5 - Error Light
#DC2626 - Error Dark
```

### Neutral Colors
```
#1F2937 - Text (Light)
#F3F4F6 - Text (Dark)
#6B7280 - Text Secondary
#9CA3AF - Text Tertiary
#E5E7EB - Border
#F9FAFB - Background Secondary
#FFFFFF - Background (Light)
#111827 - Background (Dark)
```

---

## 📝 Implementation Checklist

- [ ] All text uses typography styles
- [ ] All spacing uses spacing constants
- [ ] All colors use theme colors
- [ ] All buttons use Button component
- [ ] All cards use Card component
- [ ] All inputs use TextInput component
- [ ] Dark mode tested
- [ ] Light mode tested
- [ ] Responsive layouts verified
- [ ] Touch targets 48px+
- [ ] Color contrast verified
- [ ] Animations smooth and timely
- [ ] Loading states visible
- [ ] Error states clear
- [ ] Accessible to screen readers

---

## 🚀 Design System Benefits

1. **Consistency**: Unified design across all screens
2. **Efficiency**: Reusable components reduce code duplication
3. **Maintainability**: Centralized theme updates
4. **Scalability**: Easy to add new screens and features
5. **Accessibility**: Built-in accessible patterns
6. **Performance**: Optimized component rendering
7. **User Experience**: Professional and polished feel

---

**Version**: 1.0  
**Last Updated**: January 22, 2026  
**Status**: ✅ Complete
