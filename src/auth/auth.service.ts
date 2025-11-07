import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './services/users.service';
import { JwtPayload } from './strategies/jwt.strategy';
import { Messages } from '../common/messages/messages';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(phone: string, password: string) {
    const user = await this.usersService.validateUser(phone, password);
    if (!user) {
      throw new UnauthorizedException(Messages.AUTH.INVALID_CREDENTIALS);
    }

    const payload: JwtPayload = { sub: user.id, phone: user.phone };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        clinicId: user.clinicId,
        role: user.role,
        clinic: user.clinic
          ? {
              id: user.clinic.id,
              name: user.clinic.name,
            }
          : null,
      },
    };
  }

  async requestPasswordReset(phone: string) {
    return this.usersService.requestPasswordReset(phone);
  }

  async verifyOtp(phone: string, otpCode: string): Promise<{ valid: boolean; message?: string }> {
    const isValid = await this.usersService.verifyOtp(phone, otpCode);
    if (!isValid) {
      throw new UnauthorizedException(Messages.AUTH.INVALID_OTP);
    }
    return { valid: true };
  }

  async resetPassword(phone: string, otpCode: string, newPassword: string) {
    await this.usersService.resetPassword(phone, otpCode, newPassword);
    return { message: Messages.AUTH.PASSWORD_RESET_SUCCESS };
  }
}

