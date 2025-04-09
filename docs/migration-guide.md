# Card Profit Pro - Component Migration Guide

## Overview

This document describes the migration process of components from the legacy project structure to the new `/src` directory structure, following Next.js 13+ App Router conventions.

## Migration Strategy

We are using a phased approach to migrate components:

1. **Phase 1:** Create target directories in `/src`
2. **Phase 2:** Migrate components to a temporary location (`/src/components/ui-migrated`)
3. **Phase 3:** Test components in isolation
4. **Phase 4:** Compare migrated components with existing components in `/src/components/ui` (if any)
5. **Phase 5:** Final integration and cleanup

## Current Migration Status

### Completed Migrations

The following components have been migrated to `/src/components/ui-migrated`:

#### UI Components
- ✅ `accordion.tsx`
- ✅ `alert-dialog.tsx`
- ✅ `avatar.tsx`
- ✅ `aurora-background.tsx`
- ✅ `breadcrumb.tsx`
- ✅ `carousel.tsx`
- ✅ `chart.tsx`
- ✅ `command.tsx`
- ✅ `dialog.tsx`
- ✅ `navigation-menu.tsx`
- ✅ `pagination.tsx`
- ✅ `scroll-area.tsx`
- ✅ `separator.tsx`

#### Provider Components
- ✅ `clerk-client-provider.tsx`
- ✅ `tanstack-client-provider.tsx`

### Pending Migrations

The following components still need to be migrated:

- ✅ `alert.tsx`
- ✅ `aspect-ratio.tsx`
- ✅ `badge.tsx`
- ✅ `calendar.tsx`
- ✅ `card.tsx`
- ✅ `checkbox.tsx`
- ⏳ `color-picker.tsx`
- ⏳ `data-table.tsx`
- ⏳ `date-picker.tsx`
- ✅ `dropdown-menu.tsx`
- ✅ `form.tsx`
- ✅ `hover-card.tsx`
- ✅ `input.tsx`
- ✅ `label.tsx`
- ✅ `popover.tsx`
- ✅ `progress.tsx`
- ✅ `radio-group.tsx`
- ✅ `select.tsx`
- ✅ `sheet.tsx`
- ✅ `skeleton.tsx`
- ✅ `slider.tsx`
- ✅ `switch.tsx`
- ✅ `table.tsx`
- ✅ `tabs.tsx`
- ✅ `textarea.tsx`
- ✅ `toast.tsx`
- ✅ `toggle-group.tsx`
- ✅ `toggle.tsx`
- ✅ `tooltip.tsx`

## Testing

A test page is available at `/component-test` to validate the rendering of migrated components in a Next.js app context. This page imports and renders all migrated components to ensure they function correctly.

## Using the Migration Script

To simplify and automate the migration process, we've provided a Node.js script that handles the migration of individual components. The script:

1. Copies the component from the legacy directory to the new directory
2. Updates import paths to use the `@/` prefix
3. Updates the migration-guide.md file to mark the component as migrated
4. Updates the test file to import the component

### Usage

```bash
# On Windows
node scripts/migrate-component.js <component-name>

# On Linux/Mac
chmod +x scripts/migrate-component.js  # Only needed once
./scripts/migrate-component.js <component-name>
```

### Example

```bash
node scripts/migrate-component.js badge
```

This will migrate the `badge.tsx` component from `components/ui/` to `src/components/ui-migrated/`.

## Technical Notes

### TypeScript Errors

When viewing the migrated components in isolation, TypeScript/linter errors are expected and normal. These errors are related to:

1. Missing type declarations for external modules (React, Radix UI, etc.)
2. Implicit `any` types for refs and props
3. JSX element type errors

These errors do not affect component functionality and will resolve automatically when the components are used within the application's proper TypeScript context.

### Import Paths

All migrated components use the following import path pattern:

```tsx
import { cn } from "@/lib/utils"
```

These paths will work correctly in the new directory structure but may need adjustment if the utility functions are also migrated to new locations.

## Recommended Next Steps

1. Complete migration of remaining UI components
2. Migrate utility functions in `/lib` to `/src/lib`
3. Migrate hooks in `/hooks` to `/src/hooks`
4. Test all components in various app contexts
5. Move components from `/src/components/ui-migrated` to `/src/components/ui` (after comparison)
6. Update import paths throughout the application
7. Clean up legacy directories 