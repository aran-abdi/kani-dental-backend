import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { OtpResponseDto } from './dto/otp-response.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto.email, loginDto.password);
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
      requestOtpDto.email,
    );
    return {
      otpCode,
      message: 'OTP sent successfully',
      expiresIn,
    };
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
      resetPasswordDto.email,
      resetPasswordDto.otpCode,
      resetPasswordDto.newPassword,
    );
  }
}

