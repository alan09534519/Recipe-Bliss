# Design Guidelines: Couple's Recipe Sharing App

## Design Approach

**Reference-Based Approach** drawing inspiration from:
- **Pinterest**: Masonry-style recipe cards with visual priority
- **Instagram**: Photo-first, clean mobile interface
- **Notion**: Organized content hierarchy and readability
- **Tasty/Yummly**: Recipe-specific UX patterns

This app prioritizes visual appeal and intimacy for couples sharing personal recipes while maintaining practical functionality for cooking.

## Core Design Principles

1. **Mobile-First Visual Hierarchy**: Photos dominate, text supports
2. **Intimate & Warm**: Personal recipe collection, not clinical database
3. **Scan-friendly**: Quick access to ingredients and steps while cooking
4. **Touch-optimized**: Large tap targets, generous spacing for kitchen use

## Typography

**Font Stack**: 
- Headings: Google Fonts "Playfair Display" (elegant, food-editorial feel)
- Body: Google Fonts "Inter" (clean, readable)

**Scale**:
- Recipe titles: text-2xl md:text-3xl font-bold
- Section headers: text-lg font-semibold
- Ingredients/Steps: text-base
- Meta info (servings, time): text-sm

## Layout System

**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12
- Card padding: p-4 to p-6
- Section gaps: gap-6 to gap-8
- List item spacing: space-y-3
- Page margins: px-4 md:px-6

**Grid Structure**:
- Mobile: Single column (w-full)
- Tablet: 2 columns (md:grid-cols-2 gap-6)
- Desktop: 3 columns (lg:grid-cols-3 gap-8)

**Container**: max-w-7xl mx-auto for recipe grid

## Component Library

### Recipe Card
- **Structure**: Vertical card with rounded-xl corners
- **Image**: Aspect ratio 4:3, object-cover, rounded-t-xl
- **Content padding**: p-6
- **Shadow**: shadow-md with hover:shadow-xl transition
- **Border**: Subtle border (border border-gray-200)

**Card Anatomy**:
1. Recipe photo (full-width, 250px height on mobile)
2. Recipe title (text-2xl font-bold, mb-3)
3. Meta row (servings + cook time, text-sm, mb-4)
4. Tag chips (if applicable, inline-flex gap-2)

### Recipe Detail View
**Layout**: Single column, max-w-3xl mx-auto

**Sections**:
1. **Hero Image**: Full-width, h-64 md:h-96, object-cover
2. **Recipe Header** (p-6):
   - Title (text-3xl md:text-4xl font-bold)
   - Meta info row (servings, time, difficulty)
3. **Ingredients Section** (p-6, bg-subtle):
   - Header: "Ingredients" (text-xl font-semibold mb-4)
   - Checklist items with checkbox inputs
   - space-y-3 for list items
4. **Steps Section** (p-6):
   - Numbered list (1., 2., 3...)
   - Each step: space-y-4, text-base leading-relaxed
   - Step numbers: font-semibold

### Navigation
**Mobile Header** (fixed top):
- Height: h-16
- Layout: Flex justify-between items-center px-4
- Logo/title on left, add recipe button on right
- Shadow-sm for depth

**Bottom Navigation** (optional for mobile):
- Fixed bottom bar with Home, My Recipes, Add Recipe icons
- h-16, safe-area-inset-bottom for iOS

### Forms (Add Recipe)
- Input fields: p-3, rounded-lg, border
- Labels: text-sm font-medium mb-2
- Textareas for steps: min-h-32
- File upload: Dashed border area with centered upload icon
- Submit button: w-full p-4 rounded-lg font-semibold

### Interactive Elements
**Buttons**:
- Primary: px-6 py-3 rounded-lg font-semibold
- Icon buttons: p-3 rounded-full
- Touch target minimum: 44px × 44px

**Checkboxes** (ingredients):
- Size: w-5 h-5
- Rounded: rounded
- Strikethrough text when checked

## Images

### Image Strategy
**Hero Image**: NO - Recipe cards themselves are image-first, no need for separate hero

**Recipe Photos**: 
- Essential for every recipe card
- Placeholder: 600×450px food photography
- Alt text: "Photo of [recipe name]"
- Use placeholder services: "https://placehold.co/600x450/png?text=Recipe+Photo"

**Image Placement**:
1. Recipe cards: Top of each card (dominant visual)
2. Detail view: Full-width hero at top of recipe
3. Gallery view: Masonry grid of recipe photos

**Image Treatment**:
- Always rounded corners (rounded-xl for cards, rounded-t-xl for card tops)
- object-cover to maintain aspect ratios
- Lazy loading for performance

## Animations

**Minimal & Purposeful**:
- Card hover: transform hover:scale-105 transition-transform duration-200
- Button press: active:scale-95
- Page transitions: Fade in content (opacity animation)
- NO scroll animations or complex effects

## Accessibility

- All images have descriptive alt text
- Checkbox labels properly associated
- Touch targets minimum 44×44px
- Focus states visible on all interactive elements
- Semantic HTML (article for recipes, ol for steps, ul for ingredients)

## Mobile-First Optimizations

- Large, thumb-friendly tap areas
- Sticky ingredients list option (position-sticky)
- Readable font sizes (minimum 16px to prevent zoom)
- Optimized images (compressed, responsive srcset)
- Pull-to-refresh for recipe list
- Safe area insets for notched devices (pb-safe)