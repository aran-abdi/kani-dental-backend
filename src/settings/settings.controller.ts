import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { ClinicMemberDto, CreateClinicMemberDto, UpdateClinicMemberDto } from './dto/clinic-member.dto';
import { AccountInfoDto, DeleteAccountRequestDto, DeleteAccountResponseDto } from './dto/account-info.dto';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('members')
  @ApiOperation({ summary: 'Get all clinic members' })
  @ApiResponse({
    status: 200,
    description: 'Clinic members retrieved successfully',
    type: [ClinicMemberDto],
  })
  async getClinicMembers(@Request() req): Promise<ClinicMemberDto[]> {
    return this.settingsService.getClinicMembers(req.user.id);
  }

  @Post('members')
  @ApiOperation({ summary: 'Create a new clinic member' })
  @ApiResponse({
    status: 201,
    description: 'Clinic member created successfully',
    type: ClinicMemberDto,
  })
  async createClinicMember(
    @Request() req,
    @Body() createDto: CreateClinicMemberDto,
  ): Promise<ClinicMemberDto> {
    return this.settingsService.createClinicMember(req.user.id, createDto);
  }

  @Put('members/:id')
  @ApiOperation({ summary: 'Update a clinic member' })
  @ApiResponse({
    status: 200,
    description: 'Clinic member updated successfully',
    type: ClinicMemberDto,
  })
  async updateClinicMember(
    @Request() req,
    @Param('id') memberId: string,
    @Body() updateDto: UpdateClinicMemberDto,
  ): Promise<ClinicMemberDto> {
    return this.settingsService.updateClinicMember(req.user.id, memberId, updateDto);
  }

  @Delete('members/:id')
  @ApiOperation({ summary: 'Delete a clinic member' })
  @ApiResponse({
    status: 200,
    description: 'Clinic member deleted successfully',
  })
  async deleteClinicMember(
    @Request() req,
    @Param('id') memberId: string,
  ): Promise<{ message: string }> {
    await this.settingsService.deleteClinicMember(req.user.id, memberId);
    return { message: 'Member deleted successfully' };
  }

  @Get('account')
  @ApiOperation({ summary: 'Get account information' })
  @ApiResponse({
    status: 200,
    description: 'Account information retrieved successfully',
    type: AccountInfoDto,
  })
  async getAccountInfo(@Request() req): Promise<AccountInfoDto> {
    return this.settingsService.getAccountInfo(req.user.id);
  }

  @Post('account/delete-request')
  @ApiOperation({ summary: 'Request account deletion' })
  @ApiResponse({
    status: 200,
    description: 'Account deletion request submitted successfully',
    type: DeleteAccountResponseDto,
  })
  async requestAccountDeletion(
    @Request() req,
    @Body() deleteDto: DeleteAccountRequestDto,
  ): Promise<DeleteAccountResponseDto> {
    return this.settingsService.requestAccountDeletion(req.user.id, deleteDto.reason);
  }
}

