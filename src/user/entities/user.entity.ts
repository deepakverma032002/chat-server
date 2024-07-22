import {} from 'sequelize';
import {
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ allowNull: true })
  phone: string;

  @Column({ allowNull: true })
  password: string;

  @Column({ allowNull: true })
  image: string;

  @Column({ defaultValue: false })
  isDeleted: boolean;

  @Column({ defaultValue: false })
  isVerified: boolean;

  @Column({ defaultValue: 'USER' })
  role: string;
}

export const userProviders = [
  {
    provide: 'USER_REPOSITORY',
    useValue: User,
  },
];
