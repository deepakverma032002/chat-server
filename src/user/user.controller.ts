import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  EmailVerificationDto,
  LoginUserDto,
  VerifyEmailDto,
} from './dto/login-user.dto';
import { AuthGuard } from 'src/Decorators/guards/auth.guard';
import { RequestWithUser } from './interface';
import { Response } from 'express';
import { responseResult } from 'src/utils/response-result';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/sign-up')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('/login')
  @HttpCode(200)
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  @Post('/verify-email')
  @HttpCode(200)
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.userService.verifyEmail(verifyEmailDto);
  }

  @Post('/get-email-verification-otp')
  @HttpCode(200)
  getEmailVerificationOtp(@Body() emailVerificationDto: EmailVerificationDto) {
    return this.userService.getEmailVerificationOtp(emailVerificationDto);
  }

  @UseGuards(AuthGuard)
  @Get('/me')
  me(@Req() req: RequestWithUser) {
    return this.userService.me(req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Post('google/callback')
  googleCallback(@Req() req: RequestWithUser, @Res() res: Response) {
    console.log(req);
    res.status(200).send(responseResult(null, true, 'Login successfully.'));
  }
}
