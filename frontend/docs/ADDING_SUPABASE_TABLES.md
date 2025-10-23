# Quick Guide: Adding New Supabase Tables to Your App

## The 5-Step Process

### Step 1: Update Database Types (ALWAYS DO THIS FIRST!)
```bash
cd frontend
npx supabase gen types typescript --project-id lgveqfnpkxvzbnnwuled > src/types/database.types.ts
```

### Step 2: Check the Table Structure
Look in `src/types/database.types.ts` for your table:
```typescript
your_table_name: {
  Row: {
    id: string
    // ... other fields
  }
}
```

### Step 3: Create the Server Actions
Create `src/app/actions/[table-name]-actions.ts`:

```typescript
"use server"

import { createClient } from "@/utils/supabase/server"

// Match the interface EXACTLY to your database types
export interface YourItem {
  id: string
  // Copy fields from database.types.ts Row definition
}

export async function getItems(): Promise<{ items: YourItem[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('your_table_name') // EXACT table name from database
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching items:', error)
      return { items: [], error: error.message }
    }

    return { items: data || [] }
  } catch (error) {
    return { items: [], error: 'Unexpected error' }
  }
}

export async function createItem(itemData: Partial<YourItem>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('your_table_name')
    .insert(itemData)
    .select()
    .single()
  
  return { item: data, error: error?.message }
}

export async function updateItem(id: string, updates: Partial<YourItem>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('your_table_name')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { item: data, error: error?.message }
}

export async function deleteItem(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('your_table_name')
    .delete()
    .eq('id', id)
  
  return { success: !error, error: error?.message }
}
```

### Step 4: Create the Page
Create `src/app/[table-name]/page.tsx`:

```typescript
import { getItems } from "@/app/actions/[table-name]-actions"

export const dynamic = "force-dynamic"

export default async function ItemsPage() {
  const { items, error } = await getItems()
  
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Your Items</h1>
      
      {items.length === 0 ? (
        <p>No items found</p>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="p-4 border rounded">
              {/* Display your item fields */}
              <pre>{JSON.stringify(item, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Step 5: Add to Sidebar Navigation
Edit `src/components/app-sidebar.tsx`:

```typescript
const items = [
  // ... existing items
  {
    title: "Your Items",
    url: "/your-items",
    icon: YourIcon,
  },
]
```

## Common Patterns

### For Tables with Tabs/Phases
If your table has a status/phase field (like projects), use this pattern:

```typescript
const getItemsByTab = (tab: string) => {
  switch (tab) {
    case 'active':
      return items.filter(item => item.status === 'active')
    case 'completed':
      return items.filter(item => item.status === 'completed')
    default:
      return items
  }
}

// In your component:
<Tabs>
  <TabsList>
    <TabsTrigger value="active">Active ({getItemsByTab('active').length})</TabsTrigger>
    <TabsTrigger value="completed">Completed ({getItemsByTab('completed').length})</TabsTrigger>
  </TabsList>
  {/* Tab contents */}
</Tabs>
```

### For Editable Tables
Use the projects page as a template - it has inline editing with proper save/cancel functionality.

### For Tables with Search
```typescript
const [searchTerm, setSearchTerm] = useState("")

const filteredItems = items.filter(item => 
  item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.description?.toLowerCase().includes(searchTerm.toLowerCase())
)
```

## Quick Checklist

- [ ] Run `npx supabase gen types typescript --project-id ...`
- [ ] Check table exists in `database.types.ts`
- [ ] Create server actions file
- [ ] Match interface EXACTLY to Row type
- [ ] Create page component
- [ ] Add to sidebar navigation
- [ ] Test CRUD operations

## Debugging Tips

1. **Check Console Logs**: Add `console.log('Items:', items)` to see what data you're getting
2. **Verify Table Name**: Make sure it matches EXACTLY (case-sensitive)
3. **Check Field Types**: String vs number IDs are a common issue
4. **RLS Policies**: Make sure your Supabase table has appropriate Row Level Security

## Example Tables You Mentioned

### Submittals Table
```typescript
// Likely fields:
interface Submittal {
  id: string
  project_id: number
  submittal_number: string
  description: string
  status: string // pending, approved, rejected
  submitted_date: string
  due_date: string
  // etc.
}
```

### SOP Table
```typescript
// Likely fields:
interface SOP {
  id: string
  title: string
  content: string
  category: string
  version: string
  effective_date: string
  // etc.
}
```

## Time-Saving Script

Create a bash script `new-table.sh`:

```bash
#!/bin/bash
TABLE_NAME=$1
PAGE_NAME=$2

# Update types
npx supabase gen types typescript --project-id lgveqfnpkxvzbnnwuled > src/types/database.types.ts

# Create directories
mkdir -p src/app/$PAGE_NAME
mkdir -p src/app/actions

# Copy template files (create these once)
cp templates/table-actions.template.ts src/app/actions/${TABLE_NAME}-actions.ts
cp templates/table-page.template.tsx src/app/$PAGE_NAME/page.tsx

# Replace placeholders
sed -i "" "s/YOUR_TABLE_NAME/$TABLE_NAME/g" src/app/actions/${TABLE_NAME}-actions.ts
sed -i "" "s/YOUR_TABLE_NAME/$TABLE_NAME/g" src/app/$PAGE_NAME/page.tsx

echo "Created files for $TABLE_NAME table at /$PAGE_NAME"
echo "Don't forget to:"
echo "1. Update the interface in ${TABLE_NAME}-actions.ts"
echo "2. Add to sidebar navigation"
```

Usage: `./new-table.sh submittals submittals`