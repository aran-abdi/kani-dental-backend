import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './services/users.service';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
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

  async requestPasswordReset(email: string) {
    return this.usersService.requestPasswordReset(email);
  }

  async resetPassword(email: string, otpCode: string, newPassword: string) {
    await this.usersService.resetPassword(email, otpCode, newPassword);
    return { message: 'Password reset successfully' };
  }
}

