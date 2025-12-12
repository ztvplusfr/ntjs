# Design Document

## Overview

This design addresses the date sorting issue in the user history page where dates are displayed in incorrect chronological order. The solution involves modifying the date grouping logic to sort date groups by their actual date values rather than displaying them in the order they appear in the data.

## Architecture

The fix will be implemented entirely in the client-side React component (`app/profile/history/page.tsx`) without requiring any backend changes. The solution involves:

1. Converting date labels back to Date objects for proper sorting
2. Sorting the grouped entries by date in descending order
3. Maintaining the existing UI and functionality

## Components and Interfaces

### Modified Components

**ProfileHistoryPage Component**
- Location: `app/profile/history/page.tsx`
- Modification: Update the date grouping and sorting logic
- Interface: No changes to props or external interfaces

### Data Flow

1. History entries are fetched from the API (unchanged)
2. Entries are grouped by date label using `toLocaleDateString()` (unchanged)
3. **NEW**: Date groups are sorted by converting labels back to Date objects
4. Sorted groups are rendered in chronological order (most recent first)

## Data Models

No changes to existing data models. The `HistoryEntry` interface remains unchanged:

```typescript
interface HistoryEntry {
  content_id: number
  content_type: 'movie' | 'series'
  title?: string
  poster?: string
  backdrop?: string
  last_watched_at?: string
  season?: number
  episode?: number
  video_id?: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Date groups are sorted chronologically
*For any* set of history entries with different dates, the rendered date groups should appear in descending chronological order (most recent first)
**Validates: Requirements 1.1**

### Property 2: Date grouping preserves entries
*For any* set of history entries, grouping by date should not lose or duplicate any entries
**Validates: Requirements 1.2**

### Property 3: Within-group order is preserved
*For any* set of history entries with the same date, their relative order within the date group should remain unchanged after sorting
**Validates: Requirements 1.3**

## Error Handling

- **Invalid dates**: If `last_watched_at` is null or invalid, entries will be grouped under "Date inconnue" (unchanged behavior)
- **Parsing errors**: Date parsing failures will not crash the component; invalid dates will be handled gracefully
- **Empty history**: No changes to existing empty state handling

## Testing Strategy

### Unit Testing
- Test date group sorting with various date combinations
- Test edge cases like invalid dates and null values
- Test that entry order within groups is preserved

### Property-Based Testing
We will use Jest with `fast-check` for property-based testing to verify:
- Date sorting correctness across random date combinations
- Entry preservation during grouping and sorting
- Order preservation within date groups

Each property-based test will run a minimum of 100 iterations and be tagged with comments referencing the design document properties using the format: '**Feature: history-date-sorting, Property {number}: {property_text}**'