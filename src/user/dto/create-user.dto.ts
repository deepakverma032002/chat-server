import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsMobilePhone,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { MatchProperties } from 'src/Decorators/pipes/matchProperties.pipe';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsMobilePhone('en-IN')
  @IsOptional()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsStrongPassword()
  password: string;

  @ApiProperty()
  @IsString()
  @MatchProperties('password', { message: 'Passwords should be matches.' })
  confirmPassword?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  image: string;
}
