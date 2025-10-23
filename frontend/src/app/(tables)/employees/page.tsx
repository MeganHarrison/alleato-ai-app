import { EmployeesDataTable } from "@/components/tables/employees-data-table";
import { getEmployees } from "@/app/actions/employees-actions";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return <EmployeesDataTable employees={employees} />;
}
