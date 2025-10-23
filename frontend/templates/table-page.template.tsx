import { getYOUR_ITEMS } from "@/app/actions/YOUR_TABLE_NAME-actions";

export const dynamic = "force-dynamic";

export default async function YOUR_PAGE_NAME() {
  const result = await getYOUR_ITEMS();
  
  const items = result?.items || [];
  const error = result?.error || undefined;

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
        <h3 className="font-medium">Error loading YOUR_ITEMS</h3>
        <p className="text-sm mt-1">{error}</p>
        <p className="text-sm mt-2">
          Make sure the YOUR_TABLE_NAME table exists in your Supabase database.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">YOUR_PAGE_TITLE</h1>
        {/* Add your action button here if needed */}
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No YOUR_ITEMS found</h3>
          <p className="text-sm text-gray-600 mb-4">
            Get started by adding your first YOUR_ITEM.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2 text-left">ID</th>
                {/* TODO: Add your column headers here */}
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-4 py-2">{item.id}</td>
                  {/* TODO: Add your column data here */}
                  <td className="px-4 py-2">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-2">
                    <button className="text-blue-600 hover:underline mr-4">Edit</button>
                    <button className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Debug info - remove in production */}
      <details className="mt-8">
        <summary className="cursor-pointer text-gray-600">Debug: Raw Data</summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
          {JSON.stringify(items, null, 2)}
        </pre>
      </details>
    </div>
  );
}