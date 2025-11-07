/**
 * Converts Jalali (Persian) date to Gregorian date
 * @param jalaliDate - Jalali date string in format "YYYY-MM-DD" or "YYYY/MM/DD"
 * @returns Gregorian Date object or null if invalid
 */
export function jalaliToGregorian(jalaliDate: string): Date | null {
  if (!jalaliDate) return null;

  try {
    // Normalize the date string (handle both - and / separators)
    const normalized = jalaliDate.replace(/\//g, '-');
    const parts = normalized.split('-').map(Number);

    if (parts.length !== 3) return null;

    const [jy, jm, jd] = parts;

    // Jalali to Gregorian conversion algorithm
    const gy = jy <= 979 ? 621 : 1600;
    let days = (365 * (jy - 1)) + Math.floor((jy - 1) / 33) * 8 + Math.floor(((jy - 1) % 33 + 3) / 4);

    if (jm !== 1) {
      days += (jm < 7) ? (jm - 1) * 31 : 186 + (jm - 7) * 30;
    }
    days += jd;

    let gy2 = gy;
    let leap = true;
    while (days > 365 + (leap ? 1 : 0)) {
      days -= 365 + (leap ? 1 : 0);
      gy2++;
      leap = (gy2 % 4 === 0 && gy2 % 100 !== 0) || (gy2 % 400 === 0);
    }

    const monthDays = [31, 28 + (leap ? 1 : 0), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 1;
    let gd = days;

    for (let i = 0; i < 12; i++) {
      if (gd <= monthDays[i]) {
        gm = i + 1;
        break;
      }
      gd -= monthDays[i];
    }

    return new Date(gy2, gm - 1, gd);
  } catch (error) {
    return null;
  }
}

/**
 * Converts Gregorian date to Jalali date string
 * @param date - Gregorian Date object
 * @returns Jalali date string in format "YYYY-MM-DD" or null if invalid
 */
export function gregorianToJalali(date: Date): string | null {
  if (!date) return null;

  try {
    const gy = date.getFullYear();
    const gm = date.getMonth() + 1;
    const gd = date.getDate();

    // Gregorian to Jalali conversion algorithm
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    let gy2 = gy > 1600 ? gy - 1600 : gy - 621;
    let days = (365 * gy2) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];

    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }

    let jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    let jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);

    return `${jy.toString().padStart(4, '0')}-${jm.toString().padStart(2, '0')}-${jd.toString().padStart(2, '0')}`;
  } catch (error) {
    return null;
  }
}

