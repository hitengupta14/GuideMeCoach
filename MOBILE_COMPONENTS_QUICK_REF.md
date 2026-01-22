# Mobile UI Components Quick Reference

## 🎨 Color Usage

### Primary Colors
```tsx
colors.primary         // #6366F1 - Main brand color
colors.primaryLight    // #818CF8 - Lighter variant
colors.primaryDark     // #4F46E5 - Darker variant
colors.secondary       // #FB923C - Accent color
colors.success         // #10B981 - Success states
colors.warning         // #F59E0B - Warnings
colors.error           // #EF4444 - Errors
```

### Text Colors
```tsx
colors.text            // Main text (#1F2937 light)
colors.textSecondary   // Secondary text (#6B7280 light)
colors.textTertiary    // Tertiary text (#9CA3AF light)
colors.textInverse     // Inverse text (#FFFFFF on dark)
```

### Background Colors
```tsx
colors.background      // Main background
colors.backgroundSecondary
colors.card            // Card background
colors.surface         // Surface elements
```

## 📦 Component Examples

### Button
```tsx
import { Button } from '@/components';

// Primary
<Button 
  label="Start"
  onPress={() => {}}
  isDark={isDark}
/>

// Secondary
<Button 
  label="Cancel"
  onPress={() => {}}
  variant="secondary"
  isDark={isDark}
/>

// Outline
<Button 
  label="Learn More"
  onPress={() => {}}
  variant="outline"
  isDark={isDark}
/>

// Ghost
<Button 
  label="Skip"
  onPress={() => {}}
  variant="ghost"
  isDark={isDark}
/>

// Danger
<Button 
  label="Delete"
  onPress={() => {}}
  variant="danger"
  isDark={isDark}
/>

// With Icon
<Button 
  label="Share"
  onPress={() => {}}
  icon={<MaterialCommunityIcons name="share" size={20} />}
  isDark={isDark}
/>

// Loading
<Button 
  label="Saving..."
  onPress={() => {}}
  loading={true}
  isDark={isDark}
/>

// Disabled
<Button 
  label="Disabled"
  onPress={() => {}}
  disabled={true}
  isDark={isDark}
/>

// Sizes
<Button label="Small" onPress={() => {}} size="sm" isDark={isDark} />
<Button label="Medium" onPress={() => {}} size="md" isDark={isDark} />
<Button label="Large" onPress={() => {}} size="lg" isDark={isDark} />

// Full width
<Button label="Full Width" onPress={() => {}} fullWidth isDark={isDark} />
```

### TextInput
```tsx
import { TextInput } from '@/components';

// Basic
<TextInput
  placeholder="Enter name"
  value={name}
  onChangeText={setName}
  isDark={isDark}
/>

// With Label
<TextInput
  label="Email"
  placeholder="you@example.com"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  isDark={isDark}
/>

// With Error
<TextInput
  label="Password"
  value={password}
  onChangeText={setPassword}
  error="Password too short"
  secureTextEntry
  isDark={isDark}
/>

// Multiline
<TextInput
  placeholder="Enter description"
  value={description}
  onChangeText={setDescription}
  multiline
  numberOfLines={4}
  isDark={isDark}
/>

// Disabled
<TextInput
  value="Disabled field"
  onChangeText={() => {}}
  disabled
  isDark={isDark}
/>
```

### Card
```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components';

// Basic
<Card isDark={isDark}>
  <CardBody>
    <Text>Card content</Text>
  </CardBody>
</Card>

// With Header
<Card isDark={isDark}>
  <CardHeader title="Title" subtitle="Subtitle" isDark={isDark} />
  <CardBody>
    <Text>Card content</Text>
  </CardBody>
</Card>

// With Footer
<Card isDark={isDark}>
  <CardHeader title="Confirm Action" isDark={isDark} />
  <CardBody>
    <Text>Are you sure?</Text>
  </CardBody>
  <CardFooter isDark={isDark}>
    <Button label="Confirm" onPress={() => {}} isDark={isDark} />
  </CardFooter>
</Card>

// Variants
<Card variant="default" isDark={isDark} />   // Outlined
<Card variant="elevated" isDark={isDark} />  // With shadow
<Card variant="flat" isDark={isDark} />      // Flat background

// Interactive
<Card 
  isDark={isDark}
  onPress={() => {}}
>
  <CardBody>
    <Text>Tap me</Text>
  </CardBody>
</Card>
```

### Avatar
```tsx
import { Avatar } from '@/components';

// With initials
<Avatar initials="JD" isDark={isDark} />

// With image
<Avatar 
  source="https://example.com/avatar.jpg" 
  isDark={isDark} 
/>

// Sizes
<Avatar initials="JD" size="sm" isDark={isDark} />
<Avatar initials="JD" size="md" isDark={isDark} />
<Avatar initials="JD" size="lg" isDark={isDark} />
<Avatar initials="JD" size="xl" isDark={isDark} />

// Custom color
<Avatar 
  initials="JD"
  backgroundColor={colors.secondary}
  isDark={isDark}
/>
```

### Badge
```tsx
import { Badge } from '@/components';

// Variants
<Badge label="Default" isDark={isDark} />
<Badge label="Success" variant="success" isDark={isDark} />
<Badge label="Warning" variant="warning" isDark={isDark} />
<Badge label="Error" variant="error" isDark={isDark} />
<Badge label="Info" variant="info" isDark={isDark} />

// Closeable
<Badge 
  label="Tag"
  isDark={isDark}
  onClose={() => {}}
/>
```

### ProgressBar
```tsx
import { ProgressBar } from '@/components';

// Basic
<ProgressBar progress={65} isDark={isDark} />

// Custom color
<ProgressBar 
  progress={65} 
  color={colors.success}
  isDark={isDark}
/>

// With label
<ProgressBar 
  progress={65}
  showLabel={true}
  isDark={isDark}
/>

// Different heights
<ProgressBar progress={65} height={4} isDark={isDark} />
<ProgressBar progress={65} height={8} isDark={isDark} />
```

### StatItem
```tsx
import { StatItem } from '@/components';

// Basic
<StatItem 
  label="Calories" 
  value="450" 
  isDark={isDark} 
/>

// With icon
<StatItem 
  label="Calories" 
  value="450"
  icon="fire"
  isDark={isDark}
/>

// With trend
<StatItem 
  label="Workouts" 
  value="42"
  icon="dumbbell"
  trend={{ value: 12, isPositive: true }}
  isDark={isDark}
/>

// Custom color
<StatItem 
  label="Distance" 
  value="5.2km"
  icon="map-marker"
  color={colors.primary}
  isDark={isDark}
/>
```

### Header
```tsx
import { Header } from '@/components';

// Basic
<Header title="Settings" isDark={isDark} />

// With subtitle
<Header 
  title="Workouts"
  subtitle="Your workout history"
  isDark={isDark}
/>

// With back button
<Header 
  title="Exercise Detail"
  onBackPress={() => navigation.goBack()}
  isDark={isDark}
/>

// With action
<Header 
  title="Exercises"
  rightAction={<Bell />}
  isDark={isDark}
/>

// Gradient variant
<Header 
  title="Dashboard"
  variant="gradient"
  isDark={isDark}
/>
```

### TabBar
```tsx
import { TabBar } from '@/components';

<TabBar
  tabs={[
    { name: 'home', icon: 'home', label: 'Home' },
    { name: 'exercises', icon: 'dumbbell', label: 'Exercises' },
    { name: 'profile', icon: 'account', label: 'Profile' },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  isDark={isDark}
/>
```

### Container
```tsx
import { Container, Section } from '@/components';

// Full screen container
<Container isDark={isDark}>
  <Section>
    <Text>Content</Text>
  </Section>
</Container>

// With custom padding
<Container padding="md" isDark={isDark}>
  <Text>Content</Text>
</Container>
```

## 🎯 Spacing Shortcuts

```tsx
import { spacing } from '@/theme/spacing';

spacing.xs      // 4px
spacing.sm      // 8px
spacing.md      // 12px
spacing.lg      // 16px
spacing.xl      // 20px
spacing['2xl']  // 24px
spacing['3xl']  // 32px
spacing['4xl']  // 40px
spacing['5xl']  // 48px
```

## 📝 Typography Shortcuts

```tsx
import { typography } from '@/theme/spacing';

typography.display1  // 32px, bold
typography.display2  // 28px, bold
typography.heading1  // 24px, bold
typography.heading2  // 20px, bold
typography.heading3  // 18px, semi-bold
typography.body1     // 16px
typography.body2     // 14px
typography.body3     // 13px
typography.label1    // 14px, semi-bold
typography.label2    // 12px, semi-bold
typography.caption1  // 12px
typography.caption2  // 11px
```

## 🚀 Best Practices

1. **Always pass `isDark` prop** from useThemeStore
2. **Use spacing constants** instead of hardcoded values
3. **Use typography styles** for consistent text
4. **Use color names** from theme, not hex values
5. **Test in both light and dark modes**
6. **Use variants** for semantic meaning
7. **Keep components reusable** and prop-driven
8. **Use proper touch targets** (min 48px)
