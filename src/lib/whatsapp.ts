import { Customer, Shop } from '../types/index.ts';

/**
 * Clean Kenyan phone number into international WhatsApp format (+254XXXXXXXXX)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('254')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    return `254${cleaned.substring(1)}`;
  }
  if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    return `254${cleaned}`;
  }
  return cleaned;
}

/**
 * Generate polite WhatsApp / SMS reminder message
 */
export function buildDebtReminderMessage(
  customer: Customer,
  shop: Shop,
  language: 'en' | 'sw' = 'en'
): string {
  const amountStr = Number(customer.currentDebt).toLocaleString();
  const shopName = shop.name;
  const customerName = customer.nickname || customer.name;

  let mpesaDetails = '';
  if (shop.mpesaType === 'till') {
    mpesaDetails = `Lipa Na M-Pesa Buy Goods Till: ${shop.mpesaNumber}`;
  } else if (shop.mpesaType === 'paybill') {
    mpesaDetails = `Paybill: ${shop.mpesaNumber} (Account: ${shop.accountNumber || customerName})`;
  } else {
    mpesaDetails = `M-Pesa Nambari: ${shop.mpesaNumber || shop.phoneNumber}`;
  }

  if (language === 'sw') {
    return `Hujambo ${customerName}, salio lako la mkopo katika duka la ${shopName} ni KES ${amountStr}. Tafadhali unaombwa kulipia kupitia ${mpesaDetails}. Asante kwa ushirikiano na uaminifu wako!`;
  }

  return `Hello ${customerName}, your current outstanding credit balance at ${shopName} is KES ${amountStr}. Kindly settle via ${mpesaDetails}. Thank you for your continued support!`;
}

/**
 * Opens WhatsApp directly or returns the URL
 */
export function getWhatsAppUrl(customer: Customer, shop: Shop, language: 'en' | 'sw' = 'en'): string {
  const phone = formatPhoneForWhatsApp(customer.phoneNumber);
  const message = encodeURIComponent(buildDebtReminderMessage(customer, shop, language));
  return `https://wa.me/${phone}?text=${message}`;
}

/**
 * Opens Native SMS app with pre-filled recipient and text
 */
export function getSmsUrl(customer: Customer, shop: Shop, language: 'en' | 'sw' = 'en'): string {
  const phone = formatPhoneForWhatsApp(customer.phoneNumber);
  const message = encodeURIComponent(buildDebtReminderMessage(customer, shop, language));
  return `sms:${phone}?body=${message}`;
}
