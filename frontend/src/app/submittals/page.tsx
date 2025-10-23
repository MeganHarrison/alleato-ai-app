import { getSubmittals } from "@/app/actions/submittals-actions";

export const dynamic = "force-dynamic";

export default async function SubmittalsPage() {
  const result = await getSubmittals();
  
  const submittals = result?.items || [];
  const error = result?.error || undefined;

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
        <h3 className="font-medium">Error loading submittals</h3>
        <p className="text-sm mt-1">{error}</p>
        <p className="text-sm mt-2">
          Make sure the submittals table exists in your Supabase database.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Submittals</h1>
        {/* Add your action button here if needed */}
      </div>

      {submittals.length === 0 ? (
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submittals found</h3>
          <p className="text-sm text-gray-600 mb-4">
            Get started by adding your first submittal.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2 text-left">Submittal #</th>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Project</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Submitted</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submittals.map((submittal) => (
                <tr key={submittal.id} className="border-b">
                  <td className="px-4 py-2 font-medium">{submittal.submittal_number}</td>
                  <td className="px-4 py-2">{submittal.title}</td>
                  <td className="px-4 py-2">{submittal.project_name || 'Project ' + submittal.project_id}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      submittal.status === 'approved' ? 'bg-green-100 text-green-800' :
                      submittal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      submittal.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {submittal.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      submittal.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      submittal.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {submittal.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {submittal.submission_date ? new Date(submittal.submission_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-2">
                    <button className="text-blue-600 hover:underline mr-4">View</button>
                    <button className="text-blue-600 hover:underline">Edit</button>
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
          {JSON.stringify(submittals, null, 2)}
        </pre>
      </details>
    </div>
  );
}