#!/bin/bash

# Usage: ./scripts/new-table.sh table_name page-name "Page Title"
# Example: ./scripts/new-table.sh submittals submittals "Submittals"

TABLE_NAME=$1
PAGE_NAME=$2
PAGE_TITLE=${3:-$PAGE_NAME}

if [ -z "$TABLE_NAME" ] || [ -z "$PAGE_NAME" ]; then
    echo "Usage: ./scripts/new-table.sh table_name page-name \"Page Title\""
    echo "Example: ./scripts/new-table.sh submittals submittals \"Submittals\""
    exit 1
fi

# Convert to different cases
ITEM_TYPE=$(echo $TABLE_NAME | sed 's/_\([a-z]\)/\U\1/g' | sed 's/^\([a-z]\)/\U\1/g' | sed 's/s$//')
ITEMS_TYPE="${ITEM_TYPE}s"
ITEM_LOWER=$(echo $ITEM_TYPE | tr '[:upper:]' '[:lower:]')
ITEMS_LOWER=$(echo $ITEMS_TYPE | tr '[:upper:]' '[:lower:]')

echo "Creating files for:"
echo "  Table: $TABLE_NAME"
echo "  Page: /$PAGE_NAME"
echo "  Type: $ITEM_TYPE"

# Update types
echo "Updating database types..."
npx supabase gen types typescript --project-id lgveqfnpkxvzbnnwuled > src/types/database.types.ts

# Create directories
mkdir -p src/app/$PAGE_NAME
mkdir -p src/app/actions

# Copy and update actions file
cp templates/table-actions.template.ts src/app/actions/${TABLE_NAME}-actions.ts
sed -i "" "s/YOUR_TABLE_NAME/$TABLE_NAME/g" src/app/actions/${TABLE_NAME}-actions.ts
sed -i "" "s/YOUR_ITEM_TYPE/$ITEM_TYPE/g" src/app/actions/${TABLE_NAME}-actions.ts
sed -i "" "s/YOUR_ITEMS/$ITEMS_TYPE/g" src/app/actions/${TABLE_NAME}-actions.ts
sed -i "" "s/YOUR_ITEM/$ITEM_TYPE/g" src/app/actions/${TABLE_NAME}-actions.ts

# Copy and update page file
cp templates/table-page.template.tsx src/app/$PAGE_NAME/page.tsx
sed -i "" "s/YOUR_TABLE_NAME/$TABLE_NAME/g" src/app/$PAGE_NAME/page.tsx
sed -i "" "s/YOUR_PAGE_NAME/${PAGE_NAME^}/g" src/app/$PAGE_NAME/page.tsx
sed -i "" "s/YOUR_PAGE_TITLE/$PAGE_TITLE/g" src/app/$PAGE_NAME/page.tsx
sed -i "" "s/YOUR_ITEMS/$ITEMS_LOWER/g" src/app/$PAGE_NAME/page.tsx
sed -i "" "s/YOUR_ITEM/$ITEM_LOWER/g" src/app/$PAGE_NAME/page.tsx

echo ""
echo "✅ Created files:"
echo "  - src/app/actions/${TABLE_NAME}-actions.ts"
echo "  - src/app/$PAGE_NAME/page.tsx"
echo ""
echo "📝 Next steps:"
echo "1. Check src/types/database.types.ts for your table structure"
echo "2. Update the interface in ${TABLE_NAME}-actions.ts to match"
echo "3. Customize the columns in $PAGE_NAME/page.tsx"
echo "4. Add to sidebar navigation in src/components/app-sidebar.tsx"
echo ""
echo "Example sidebar entry:"
echo "  {"
echo "    title: \"$PAGE_TITLE\","
echo "    url: \"/$PAGE_NAME\","
echo "    icon: FileText,"
echo "  },"