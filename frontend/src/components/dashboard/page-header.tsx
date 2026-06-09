import { pageHeaderSubtitleClass, pageHeaderTitleClass } from "@/lib/dashboard-ui";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={className ?? "mb-6 px-4"}>
      <h1 className={pageHeaderTitleClass}>{title}</h1>
      <p className={pageHeaderSubtitleClass}>{subtitle}</p>
    </div>
  );
}
