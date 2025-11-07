import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientResponseDto } from './dto/patient-response.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
  ) {}

  async create(
    clinicId: string,
    createDto: CreatePatientDto,
  ): Promise<PatientResponseDto> {
    // Check if patient with same phone already exists in this clinic
    const existingPatient = await this.patientsRepository.findOne({
      where: {
        phone: createDto.phone,
        clinicId,
      },
    });

    if (existingPatient) {
      throw new ConflictException('Patient with this phone number already exists in this clinic');
    }

    const patient = this.patientsRepository.create({
      ...createDto,
      clinicId,
      birthDate: createDto.birthDate || null,
    });

    const savedPatient = await this.patientsRepository.save(patient);
    return this.toResponseDto(savedPatient);
  }

  async findAll(clinicId: string): Promise<PatientResponseDto[]> {
    const patients = await this.patientsRepository.find({
      where: { clinicId },
      order: { createdAt: 'DESC' },
    });

    return patients.map((patient) => this.toResponseDto(patient));
  }

  async findOne(id: string, clinicId: string): Promise<PatientResponseDto> {
    const patient = await this.patientsRepository.findOne({
      where: { id, clinicId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.toResponseDto(patient);
  }

  async update(
    id: string,
    clinicId: string,
    updateDto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientsRepository.findOne({
      where: { id, clinicId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // If phone is being updated, check for duplicates
    if (updateDto.phone && updateDto.phone !== patient.phone) {
      const existingPatient = await this.patientsRepository.findOne({
        where: {
          phone: updateDto.phone,
          clinicId,
        },
      });

      if (existingPatient && existingPatient.id !== id) {
        throw new ConflictException('Patient with this phone number already exists in this clinic');
      }
    }

    // Update fields
    if (updateDto.name !== undefined) {
      patient.name = updateDto.name;
    }
    if (updateDto.phone !== undefined) {
      patient.phone = updateDto.phone;
    }
    if (updateDto.birthDate !== undefined) {
      patient.birthDate = updateDto.birthDate || null;
    }

    const savedPatient = await this.patientsRepository.save(patient);
    return this.toResponseDto(savedPatient);
  }

  async remove(id: string, clinicId: string): Promise<void> {
    const patient = await this.patientsRepository.findOne({
      where: { id, clinicId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    await this.patientsRepository.remove(patient);
  }

  async updateAvatar(
    id: string,
    clinicId: string,
    avatarUrl: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientsRepository.findOne({
      where: { id, clinicId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    patient.avatarUrl = avatarUrl;
    const savedPatient = await this.patientsRepository.save(patient);
    return this.toResponseDto(savedPatient);
  }

  async removeAvatar(
    id: string,
    clinicId: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientsRepository.findOne({
      where: { id, clinicId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    patient.avatarUrl = null;
    const savedPatient = await this.patientsRepository.save(patient);
    return this.toResponseDto(savedPatient);
  }

  private toResponseDto(patient: Patient): PatientResponseDto {
    return {
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      birthDate: patient.birthDate || null,
      avatarUrl: patient.avatarUrl,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      // TODO: Add lastVisit from sessions when session entity is created
      lastVisit: null,
    };
  }
}

