import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Clinic } from '../entities/clinic.entity';
import { ClinicMemberDto, CreateClinicMemberDto, UpdateClinicMemberDto } from './dto/clinic-member.dto';
import { AccountInfoDto } from './dto/account-info.dto';
import { ClinicRole } from '../common/enums/clinic-role.enum';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly INVITATION_EXPIRY_DAYS = 7;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
  ) {}

  async getClinicMembers(userId: string): Promise<ClinicMemberDto[]> {
    const currentUser = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['clinic'],
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Only clinic owners/admins can view members
    if (currentUser.role !== ClinicRole.OWNER) {
      throw new ForbiddenException('Only clinic owners can view members');
    }

    const members = await this.usersRepository.find({
      where: { clinicId: currentUser.clinicId },
      relations: ['clinic'],
      order: { createdAt: 'DESC' },
    });

    return members.map((member) => ({
      id: member.id,
      name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.phone,
      phone: member.phone,
      role: member.role,
      isActive: member.isActive,
      invitationToken: !member.isActive && member.invitationToken ? member.invitationToken : undefined,
    }));
  }

  async createClinicMember(userId: string, createDto: CreateClinicMemberDto): Promise<ClinicMemberDto> {
    const currentUser = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['clinic'],
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Only clinic owners can create members
    if (currentUser.role !== ClinicRole.OWNER) {
      throw new ForbiddenException('Only clinic owners can create members');
    }

    // Check if phone already exists
    const existingUser = await this.usersRepository.findOne({
      where: { phone: createDto.phone },
    });

    if (existingUser) {
      throw new BadRequestException('User with this phone number already exists');
    }

    // Parse name into firstName and lastName
    const nameParts = createDto.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpiresAt = new Date();
    invitationExpiresAt.setDate(invitationExpiresAt.getDate() + this.INVITATION_EXPIRY_DAYS);

    // Create user without password - password will be set via invitation
    // User is inactive by default and will be activated after setting password
    const newUser = this.usersRepository.create({
      phone: createDto.phone,
      password: '', // Empty password - will be set via invitation
      firstName,
      lastName,
      role: createDto.role,
      isActive: false, // Always inactive initially
      clinicId: currentUser.clinicId,
      invitationToken,
      invitationExpiresAt,
    });

    const savedUser = await this.usersRepository.save(newUser);

    // Send invitation (mock for now - in production, send SMS/Email with invitation link)
    await this.sendInvitation(savedUser, invitationToken);

    return {
      id: savedUser.id,
      name: createDto.name,
      phone: savedUser.phone,
      role: savedUser.role,
      isActive: savedUser.isActive,
    };
  }

  async updateClinicMember(
    userId: string,
    memberId: string,
    updateDto: UpdateClinicMemberDto,
  ): Promise<ClinicMemberDto> {
    const currentUser = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['clinic'],
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Only clinic owners can update members
    if (currentUser.role !== ClinicRole.OWNER) {
      throw new ForbiddenException('Only clinic owners can update members');
    }

    const member = await this.usersRepository.findOne({
      where: { id: memberId, clinicId: currentUser.clinicId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Prevent updating the owner's role
    if (member.role === ClinicRole.OWNER && updateDto.role && updateDto.role !== ClinicRole.OWNER) {
      throw new BadRequestException('Cannot change owner role');
    }

    // Check if phone is being changed
    if (updateDto.phone && updateDto.phone !== member.phone) {
      // Prevent changing phone number for active users
      if (member.isActive) {
        throw new BadRequestException('Cannot change phone number for active users');
      }

      // Check if new phone already exists
      const existingUser = await this.usersRepository.findOne({
        where: { phone: updateDto.phone },
      });

      if (existingUser) {
        throw new BadRequestException('User with this phone number already exists');
      }
      member.phone = updateDto.phone;
    }

    if (updateDto.name) {
      const nameParts = updateDto.name.trim().split(/\s+/);
      member.firstName = nameParts[0] || '';
      member.lastName = nameParts.slice(1).join(' ') || '';
    }

    if (updateDto.role !== undefined) {
      member.role = updateDto.role;
    }

    if (updateDto.isActive !== undefined) {
      member.isActive = updateDto.isActive;
    }

    await this.usersRepository.save(member);

    return {
      id: member.id,
      name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.phone,
      phone: member.phone,
      role: member.role,
      isActive: member.isActive,
    };
  }

  async deleteClinicMember(userId: string, memberId: string): Promise<void> {
    const currentUser = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['clinic'],
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Only clinic owners can delete members
    if (currentUser.role !== ClinicRole.OWNER) {
      throw new ForbiddenException('Only clinic owners can delete members');
    }

    // Prevent deleting yourself
    if (memberId === userId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    const member = await this.usersRepository.findOne({
      where: { id: memberId, clinicId: currentUser.clinicId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Prevent deleting the owner
    if (member.role === ClinicRole.OWNER) {
      throw new BadRequestException('Cannot delete clinic owner');
    }

    await this.usersRepository.remove(member);
  }

  async getAccountInfo(userId: string): Promise<AccountInfoDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['clinic'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.clinic) {
      throw new NotFoundException('Clinic not found');
    }

    // Get the clinic with expiry date
    const clinic = await this.clinicRepository.findOne({
      where: { id: user.clinicId },
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    // If no expiry date is set, return null/undefined
    if (!clinic.expiryDate) {
      return {
        expiryDate: undefined,
        daysUntilExpiry: undefined,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const expiryDate = new Date(clinic.expiryDate);
    expiryDate.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      expiryDate: clinic.expiryDate.toISOString().split('T')[0],
      daysUntilExpiry: diffDays,
    };
  }

  async requestAccountDeletion(userId: string, reason?: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['clinic'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // In production, this would create a deletion request record
    // and notify administrators
    // For now, we'll just return a success message

    return {
      message: 'Account deletion request submitted successfully. Support team will contact you soon.',
    };
  }

  /**
   * Send invitation to new member
   * In production, this would send SMS/Email with invitation link
   */
  private async sendInvitation(user: User, token: string): Promise<void> {
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/accept-invitation?token=${token}`;
    
    // Mock invitation sending - log it for development
    this.logger.log(`[MOCK INVITATION] Sending invitation to ${user.phone}`);
    this.logger.log(`[MOCK INVITATION] Invitation Link: ${invitationLink}`);
    this.logger.log(`[MOCK INVITATION] This invitation will expire in ${this.INVITATION_EXPIRY_DAYS} days`);

    // In production, you would integrate with SMS/Email provider here
    // Example: await this.smsProvider.send(user.phone, `You've been invited to join ${user.clinic.name}. Click here to accept: ${invitationLink}`);
  }

  /**
   * Verify invitation token and get user
   */
  async verifyInvitationToken(token: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { invitationToken: token },
      relations: ['clinic'],
    });

    if (!user) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (!user.invitationExpiresAt || new Date() > user.invitationExpiresAt) {
      throw new BadRequestException('Invitation token has expired');
    }

    return user;
  }

  /**
   * Accept invitation and set password
   */
  async acceptInvitation(token: string, password: string): Promise<{ message: string }> {
    const user = await this.verifyInvitationToken(token);

    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user: set password, activate account, clear invitation token
    user.password = hashedPassword;
    user.isActive = true;
    user.invitationToken = null;
    user.invitationExpiresAt = null;

    await this.usersRepository.save(user);

    return {
      message: 'Invitation accepted successfully. You can now login.',
    };
  }
}

