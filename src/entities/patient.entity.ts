import { Column, Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Clinic } from './clinic.entity';

@Entity('patients')
@Unique(['phone', 'clinicId'])
export class Patient extends BaseEntity {
  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  birthDate: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastVisit: Date | null;

  @ManyToOne(() => Clinic, { nullable: false })
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @Column({ name: 'clinicId' })
  clinicId: string;
}

