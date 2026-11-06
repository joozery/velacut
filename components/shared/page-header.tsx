import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Pattern หัวหน้า: pill badge ตัวเลขสรุป → H1/H2 ใหญ่กลางจอ → คำอธิบาย
 * (การ์ดเนื้อหาวางต่อด้านล่างเอง)
 */
export function PageHeader({
  badge,
  title,
  highlight,
  description,
  as: Heading = "h2",
  className,
  children,
}: {
  badge?: React.ReactNode;
  title: React.ReactNode;
  highlight?: React.ReactNode;
  description?: React.ReactNode;
  as?: "h1" | "h2";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("mx-auto flex max-w-4xl flex-col items-start border-l-[3px] border-primary pl-5 text-left", className)}>
      {badge && (
        <Badge variant="soft" size="lg" className="mb-4">
          {badge}
        </Badge>
      )}
      <Heading
        className={cn(
          "font-bold tracking-tight text-balance",
          Heading === "h1" ? "text-4xl leading-[1.15] sm:text-5xl md:text-6xl" : "text-3xl leading-tight sm:text-4xl",
        )}
      >
        {title}
        {highlight && (
          <>
            <br />
            <span className="text-primary">{highlight}</span>
          </>
        )}
      </Heading>
      {description && <p className="mt-4 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">{description}</p>}
      {children}
    </header>
  );
}
