import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { OtpResponseDto } from './dto/otp-response.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { Messages } from '../common/messages/messages';
import { SettingsService } from '../settings/settings.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with phone and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto.phone, loginDto.password);
  }

  @Post('request-otp')
  @ApiOperation({ summary: 'Request OTP for password reset' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully (mocked - OTP returned in response)',
    type: OtpResponseDto,
  })
  async requestOtp(@Body() requestOtpDto: RequestOtpDto): Promise<OtpResponseDto> {
    const { otpCode, expiresIn } = await this.authService.requestPasswordReset(
      requestOtpDto.phone,
    );
    return {
      otpCode,
      message: Messages.AUTH.OTP_SENT,
      expiresIn,
    };
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.otpCode);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using OTP code' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.phone,
      resetPasswordDto.otpCode,
      resetPasswordDto.newPassword,
    );
  }

  @Get('invitation/:token')
  @ApiOperation({ summary: 'Verify invitation token' })
  @ApiResponse({
    status: 200,
    description: 'Invitation token is valid',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            clinic: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Invalid or expired invitation token' })
  async verifyInvitation(@Param('token') token: string) {
    const user = await this.settingsService.verifyInvitationToken(token);
    return {
      valid: true,
      user: {
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phone,
        clinic: user.clinic?.name,
      },
    };
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Accept invitation and set password' })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Invitation accepted successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid password or expired token' })
  @ApiResponse({ status: 404, description: 'Invalid invitation token' })
  async acceptInvitation(@Body() acceptDto: AcceptInvitationDto) {
    return this.settingsService.acceptInvitation(acceptDto.token, acceptDto.password);
  }
}

