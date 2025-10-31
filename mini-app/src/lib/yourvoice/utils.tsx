export type SaIdResult = {
  id_valid: boolean;
  age?: number;
  is_18_plus?: boolean;
  age_bucket?: '<18' | '18-24' | '25-34' | '35-44' | '45-54' | '55+';
  gender?: 'male' | 'female';
  citizen_or_pr?: 'citizen' | 'permanent_resident' | 'unknown';
};

export function validateSAId(input: string): SaIdResult {
  const digits = (input || '').replace(/\D/g, '');
  if (digits.length !== 13) return { id_valid: false };

  const yy = parseInt(digits.slice(0, 2));
  const mm = parseInt(digits.slice(2, 4));
  const dd = parseInt(digits.slice(4, 6));
  const year = yy >= 50 ? 1900 + yy : 2000 + yy;
  const birth = new Date(year, mm - 1, dd);
  const validDate =
    birth.getFullYear() === year &&
    birth.getMonth() === mm - 1 &&
    birth.getDate() === dd;

  if (!validDate) return { id_valid: false };

  const seq = parseInt(digits.slice(6, 10));
  const gender = seq >= 5000 ? 'male' : 'female';
  const c = digits[10];
  const citizen_or_pr =
    c === '0' ? 'citizen' : c === '1' ? 'permanent_resident' : 'unknown';

  if (!luhn13(digits)) return { id_valid: false };

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;

  const is_18_plus = age >= 18;
  const age_bucket =
    age < 18
      ? '<18'
      : age <= 24
        ? '18-24'
        : age <= 34
          ? '25-34'
          : age <= 44
            ? '35-44'
            : age <= 54
              ? '45-54'
              : '55+';

  return { id_valid: true, age, is_18_plus, age_bucket, gender, citizen_or_pr };
}

function luhn13(num: string): boolean {
  let sum = 0,
    alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
