import React from "react";
import { cn } from "../../utils/cn";
import { pageContainerClass, pageHeaderClass, pageSubtitleClass } from "../../constants/themeClasses";

/**
 * Standard responsive page wrapper for app routes.
 */
export function PageContainer({ children, className, size = "default" }) {
  const sizes = {
    default: "max-w-5xl",
    wide: "max-w-[1600px]",
    narrow: "max-w-3xl",
    full: "max-w-none",
  };

  return (
    <div className={cn(pageContainerClass, sizes[size] || sizes.default, className)}>
      {children}
    </div>
  );
}

export function PageTitle({ title, subtitle, actions, className }) {
  return (
    <header className={cn("mb-8", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {title ? <h1 className={pageHeaderClass}>{title}</h1> : null}
          {subtitle ? <p className={pageSubtitleClass}>{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
