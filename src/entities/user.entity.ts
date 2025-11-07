import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Clinic } from './clinic.entity';
import { ClinicRole } from '../common/enums/clinic-role.enum';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  otpCode: string | null;

  @Column({ nullable: true })
  otpExpiresAt: Date | null;

  @ManyToOne(() => Clinic, (clinic) => clinic.users, { nullable: false })
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @Column({ name: 'clinicId' })
  clinicId: string;

  @Column({
    type: 'enum',
    enum: ClinicRole,
    default: ClinicRole.ASSISTANT,
  })
  role: ClinicRole;
}

