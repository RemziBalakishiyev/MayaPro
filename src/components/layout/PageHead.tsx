import { PageHeader, type PageHeaderProps } from "./PageHeader";

export type PageHeadProps = Pick<
  PageHeaderProps,
  "title" | "subtitle" | "actions"
>;

/**
 * @deprecated FE#69 — `PageHeader` istifadə edin.
 *
 * Bu ad geriyə uyğunluq üçün saxlanılır: mövcud səhifələr `PageHead` çağırışı
 * ilə işləməyə davam edir və eyni standart görünüşü alır (komponent silinmir,
 * yenidən yazılmır — sadəcə `PageHeader`-ə yönləndirilir).
 */
export function PageHead({ title, subtitle, actions }: PageHeadProps) {
  return <PageHeader title={title} subtitle={subtitle} actions={actions} />;
}
