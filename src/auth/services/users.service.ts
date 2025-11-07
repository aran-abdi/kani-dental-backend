import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { OtpService } from './otp.service';
import { Messages } from '../../common/messages/messages';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private otpService: OtpService,
  ) {}

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { phone },
      relations: ['clinic'],
    });
  }

  async validateUser(phone: string, password: string): Promise<User | null> {
    const user = await this.findByPhone(phone);
    if (!user) {
      return null;
    }

    // Check if user has a password set
    if (!user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException(Messages.AUTH.USER_INACTIVE);
    }

    return user;
  }

  async requestPasswordReset(phone: string): Promise<{ otpCode: string; expiresIn: number }> {
    const user = await this.findByPhone(phone);
    if (!user) {
      // Don't reveal if user exists or not for security
      // Still generate and log OTP for mock purposes
      const otpCode = this.otpService.generateOtp();
      await this.otpService.sendOtp(phone, otpCode);
      return {
        otpCode,
        expiresIn: this.otpService.getOtpExpirySeconds(),
      };
    }

    const otpCode = this.otpService.generateOtp();
    const otpExpiresAt = this.otpService.getOtpExpiry();

    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    await this.usersRepository.save(user);

    await this.otpService.sendOtp(phone, otpCode);

    return {
      otpCode,
      expiresIn: this.otpService.getOtpExpirySeconds(),
    };
  }

  async verifyOtp(phone: string, otpCode: string): Promise<boolean> {
    const user = await this.findByPhone(phone);
    if (!user) {
      // Don't reveal if user exists or not for security
      return false;
    }

    if (!user.otpCode || user.otpCode !== otpCode) {
      return false;
    }

    if (!user.otpExpiresAt || this.otpService.isOtpExpired(user.otpExpiresAt)) {
      return false;
    }

    return true;
  }

  async resetPassword(phone: string, otpCode: string, newPassword: string): Promise<void> {
    const user = await this.findByPhone(phone);
    if (!user) {
      throw new NotFoundException(Messages.AUTH.USER_NOT_FOUND);
    }

    if (!user.otpCode || user.otpCode !== otpCode) {
      throw new UnauthorizedException(Messages.AUTH.INVALID_OTP);
    }

    if (!user.otpExpiresAt || this.otpService.isOtpExpired(user.otpExpiresAt)) {
      throw new UnauthorizedException(Messages.AUTH.OTP_EXPIRED);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await this.usersRepository.save(user);
  }
}

