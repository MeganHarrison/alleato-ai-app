# Supabase Table Debugging Guide

## When Tables Show No Data - Debugging Checklist

### 1. First Step: Add an "All" Tab
Always add a temporary "All" tab to bypass any filtering logic:

```tsx
<TabsTrigger value="all" className="text-orange-600">
  All ({projects.length})
</TabsTrigger>
```

This immediately tells you if:
- Data is being fetched from Supabase (shows count)
- The issue is with filtering vs. data fetching

### 2. Add Console Logging to Data Fetch
In your fetch function, log the actual data and unique values:

```tsx
const fetchProjects = async () => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    
  if (data && data.length > 0) {
    // Log unique values for the field you're filtering by
    const phases = data.map(p => p.phase || p.current_phase).filter(Boolean)
    const uniquePhases = [...new Set(phases)]
    console.log("Unique project phases:", uniquePhases)
    console.log("Sample project:", data[0]) // See full structure
  }
}
```

### 3. Add Debugging to Filter Functions
Log what's happening during filtering:

```tsx
const getProjectsByTab = (tab: string) => {
  console.log(`Getting projects for tab: ${tab}`)
  console.log(`Total projects: ${projects.length}`)
  
  // Log each project's relevant fields
  projects.forEach(p => {
    console.log(`Project: ${p.name}, phase: ${p.phase}, current_phase: ${p.current_phase}`)
  })
  
  // After filtering, log the count
  console.log(`Projects in ${tab} tab: ${result.length}`)
}
```

### 4. Common Issues and Solutions

#### Issue: Case Sensitivity
**Solution:** Always convert to lowercase before comparing:
```tsx
const phase = (p.phase || p.current_phase)?.toLowerCase()
```

#### Issue: Unknown Field Values
**Solution:** Check actual values in database first, don't assume:
- Phase might be "Current" not "In Progress"
- Status might be stored differently than displayed
- Check both possible field names (phase vs current_phase)

#### Issue: Null/Undefined Values
**Solution:** Handle missing data gracefully:
```tsx
// Include items with no phase in a default tab
if (!phase) return true  // for "current" tab
```

#### Issue: Different Phase Values Than Expected
**Solution:** Be inclusive with phase matching:
```tsx
// Instead of just 'in progress', include variations:
['current', 'active', 'development', 'construction', 'in progress', 'testing', 'building', 'execution']
```

### 5. Supabase-Specific Checks

1. **Check Row Level Security (RLS)**
   - Ensure RLS policies allow reading the data
   - Test with RLS disabled temporarily if needed

2. **Check the Supabase Dashboard**
   - View table data directly in Supabase UI
   - Verify column names match your code
   - Check data types

3. **Network Tab Debugging**
   - Open browser DevTools → Network tab
   - Look for the Supabase request
   - Check response data structure

### 6. Quick Debug Component
Add this temporary debug section to any table:

```tsx
{/* Debug Info - Remove in production */}
<div className="p-4 bg-gray-100 mb-4 text-xs">
  <p>Total projects: {projects.length}</p>
  <p>Current filter: {activeTab}</p>
  <p>Search term: "{searchTerm}"</p>
  <details>
    <summary>First 3 projects (click to expand)</summary>
    <pre>{JSON.stringify(projects.slice(0, 3), null, 2)}</pre>
  </details>
</div>
```

### 7. Step-by-Step Debugging Process

1. **Start with "All" tab** - Verify data exists
2. **Check console for unique values** - See what's actually in the database
3. **Temporarily remove search filtering** - Isolate the issue
4. **Check one filter at a time** - Add filters back gradually
5. **Verify case sensitivity** - Most common issue
6. **Check for null/undefined** - Handle edge cases
7. **Look at actual vs expected values** - Database might differ from assumptions

### Remember
- Don't assume field values - always check actual data first
- Case sensitivity is the #1 issue
- Always handle null/undefined gracefully
- Use console.log liberally during debugging
- Remove debug code before committing