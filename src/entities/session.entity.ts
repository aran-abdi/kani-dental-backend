import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Patient } from './patient.entity';
import { User } from './user.entity';
import { Clinic } from './clinic.entity';

@Entity('sessions')
export class Session extends BaseEntity {
  @ManyToOne(() => Patient, { nullable: false })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ name: 'patientId' })
  patientId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'userId' })
  userId: string;

  @ManyToOne(() => Clinic, { nullable: false })
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @Column({ name: 'clinicId' })
  clinicId: string;

  @Column({ type: 'varchar' })
  audioUrl: string;

  @Column({ type: 'varchar' })
  filename: string;

  @Column({ type: 'integer', nullable: true })
  duration: number | null; // Duration in seconds

  @Column({ type: 'text', nullable: true })
  transcript: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', nullable: true })
  status: string | null; // e.g., 'processing', 'completed', 'failed'
}

