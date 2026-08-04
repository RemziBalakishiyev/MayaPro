/**
 * Cədvəllərdə hesablana bilməyən / göstərilməsi lazım olmayan dəyər üçün
 * vahid boş göstərici: gözə görünən "—" + ekran oxuyucusu üçün izah.
 */
export function EmptyValue({
  /** Ekran oxuyucusunun oxuduğu izah. */
  label = "məlum deyil",
  /** Hover tooltip — yalnız verildikdə əlavə olunur. */
  title,
}: {
  label?: string;
  title?: string;
}) {
  return (
    <span className="text-stone-300" title={title}>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
