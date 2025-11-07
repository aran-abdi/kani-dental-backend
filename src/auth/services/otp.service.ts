import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_EXPIRY_MINUTES = 5;

  /**
   * Generate a 6-digit OTP code
   */
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Mock OTP provider - logs the OTP and returns it
   * In production, this would send OTP via SMS/Email
   */
  async sendOtp(email: string, otpCode: string): Promise<void> {
    // Mock OTP provider - log it for development
    this.logger.log(`[MOCK OTP] Sending OTP to ${email}`);
    this.logger.log(`[MOCK OTP] OTP Code: ${otpCode}`);
    this.logger.log(`[MOCK OTP] This OTP will expire in ${this.OTP_EXPIRY_MINUTES} minutes`);

    // In production, you would integrate with an SMS/Email provider here
    // Example: await this.smsProvider.send(email, `Your OTP code is: ${otpCode}`);
  }

  /**
   * Get OTP expiration time
   */
  getOtpExpiry(): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + this.OTP_EXPIRY_MINUTES);
    return expiry;
  }

  /**
   * Check if OTP is expired
   */
  isOtpExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Get OTP expiry time in seconds
   */
  getOtpExpirySeconds(): number {
    return this.OTP_EXPIRY_MINUTES * 60;
  }
}

