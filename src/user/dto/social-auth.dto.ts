import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  authCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: 'signup' | 'login';
}
