import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('clinics')
export class Clinic extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate: Date | null;

  @OneToMany(() => User, (user) => user.clinic)
  users: User[];
}

