import type React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    component?: React.ReactNode;
  };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-medium tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-base leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
      {action?.component && (
        <div className="flex-shrink-0 ml-6">{action.component}</div>
      )}
    </div>
  );
}
