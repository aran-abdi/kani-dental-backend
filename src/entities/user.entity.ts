import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Clinic } from './clinic.entity';
import { ClinicRole } from '../common/enums/clinic-role.enum';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  otpCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiresAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  invitationToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  invitationExpiresAt: Date | null;

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

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;
}

