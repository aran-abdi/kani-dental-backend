export const Messages = {
  AUTH: {
    INVALID_CREDENTIALS: 'اطلاعات ورود نامعتبر است',
    USER_NOT_FOUND: 'کاربری با این شماره تلفن یافت نشد',
    INVALID_PASSWORD: 'رمز عبور اشتباه است',
    USER_INACTIVE: 'حساب کاربری شما غیرفعال است',
    OTP_SENT: 'کد تأیید به شماره تلفن شما ارسال شد',
    OTP_EXPIRED: 'کد تأیید منقضی شده است',
    INVALID_OTP: 'کد تأیید نامعتبر است',
    PASSWORD_RESET_SUCCESS: 'رمز عبور با موفقیت تغییر یافت',
    OTP_ALREADY_SENT: 'کد تأیید قبلاً ارسال شده است. لطفاً منتظر بمانید',
    PHONE_REQUIRED: 'شماره تلفن الزامی است',
    PASSWORD_REQUIRED: 'رمز عبور الزامی است',
    OTP_REQUIRED: 'کد تأیید الزامی است',
    NEW_PASSWORD_REQUIRED: 'رمز عبور جدید الزامی است',
  },
  VALIDATION: {
    PHONE_FORMAT: 'شماره تلفن باید در فرمت +98 به دنبال ۱۰ رقم باشد',
    PASSWORD_MIN_LENGTH: 'رمز عبور باید حداقل ۶ کاراکتر باشد',
    OTP_LENGTH: 'کد تأیید باید ۶ رقم باشد',
  },
  GENERAL: {
    INTERNAL_SERVER_ERROR: 'خطای داخلی سرور',
    UNAUTHORIZED: 'دسترسی غیرمجاز',
    NOT_FOUND: 'یافت نشد',
  },
} as const;

