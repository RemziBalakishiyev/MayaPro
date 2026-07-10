/** WhatsApp xatırlatma linki (borc barədə). MVP formatı ilə eyni. */
export const waLink = (phone: string, debt: number): string => {
  const clean = (phone || "").replace(/\D/g, "");
  const text = `Salam, sizdə ${debt.toFixed(
    2,
  )} AZN qalıq borc görünür. Zəhmət olmasa ödənişi tamamlayın.`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
};
