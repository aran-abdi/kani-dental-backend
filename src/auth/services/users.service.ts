import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { OtpService } from './otp.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private otpService: OtpService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['clinic'],
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }

  async requestPasswordReset(email: string): Promise<{ otpCode: string; expiresIn: number }> {
    const user = await this.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      // Still generate and log OTP for mock purposes
      const otpCode = this.otpService.generateOtp();
      await this.otpService.sendOtp(email, otpCode);
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

    await this.otpService.sendOtp(email, otpCode);

    return {
      otpCode,
      expiresIn: this.otpService.getOtpExpirySeconds(),
    };
  }

  async resetPassword(email: string, otpCode: string, newPassword: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.otpCode || user.otpCode !== otpCode) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    if (!user.otpExpiresAt || this.otpService.isOtpExpired(user.otpExpiresAt)) {
      throw new UnauthorizedException('OTP code has expired');
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

