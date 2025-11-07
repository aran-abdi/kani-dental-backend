import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['clinic'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      clinicId: user.clinicId,
      clinic: user.clinic
        ? {
            id: user.clinic.id,
            name: user.clinic.name,
          }
        : null,
      avatarUrl: user.avatarUrl,
    };
  }

  async updateProfile(
    userId: string,
    updateDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['clinic'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateDto.firstName !== undefined) {
      user.firstName = updateDto.firstName;
    }
    if (updateDto.lastName !== undefined) {
      user.lastName = updateDto.lastName;
    }

    await this.usersRepository.save(user);

    return this.getProfile(userId);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<ProfileResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['clinic'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.avatarUrl = avatarUrl;
    await this.usersRepository.save(user);

    return this.getProfile(userId);
  }

  async removeAvatar(userId: string): Promise<ProfileResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['clinic'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.avatarUrl = null;
    await this.usersRepository.save(user);

    return this.getProfile(userId);
  }
}

