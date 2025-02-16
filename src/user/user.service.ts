import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  EmailVerificationDto,
  LoginUserDto,
  VerifyEmailDto,
} from './dto/login-user.dto';
import { RequestWithUser } from './interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import sendMail from 'src/utils/sendMail';
import { htmlContent } from 'src/utils/emailTemplate';
import { responseResult } from 'src/utils/response-result';
import { User } from './entities/user.entity';
import { GoogleAuthDto } from './dto/social-auth.dto';
import axios from 'axios';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private user: typeof User,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const isEmailExist = await this.user.findOne({
      where: { email: createUserDto.email },
    });
    if (isEmailExist) {
      throw new BadRequestException('Email already exist');
    }
    const hash = await argon2.hash(createUserDto.password);
    delete createUserDto.confirmPassword;
    const savedData = { ...createUserDto, password: hash };
    const user = await this.user.create(savedData);
    return responseResult(user, true, 'User created successfully.');
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.user.findOne({
      where: { email: loginUserDto.email },
    });

    if (!user) {
      throw new NotFoundException('Credentials are wrong.');
    }

    if (user.isDeleted) {
      throw new NotFoundException('User does not exist with this email.');
    }

    if (!user.isVerified) {
      throw new BadRequestException(
        'Please verified your email first.',
        'NOT_VERIFIED',
      );
    }

    if (!user.password) {
      throw new BadRequestException('Login with google please.', 'NOT_SET');
    }

    const isMatch = await argon2.verify(user.password, loginUserDto.password);
    if (!isMatch) {
      throw new NotFoundException('Credentials are wrong.');
    }

    const payload = { sub: user.id, role: user.role };
    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1d',
    });

    return responseResult(
      {
        token: access_token,
      },
      true,
      'User logged in successfully.',
    );
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.user.findOne({
      where: { email: verifyEmailDto.email },
    });

    if (user?.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const storedOtp = await this.cacheManager.get<string>(verifyEmailDto.email);

    if (verifyEmailDto.otp !== storedOtp) {
      throw new BadRequestException('Invalid OTP');
    }

    user.isVerified = true;
    const userUpdatePromise = user.save();

    const promises = [
      this.cacheManager.del(verifyEmailDto.email),
      userUpdatePromise,
    ];

    await Promise.all(promises);

    return responseResult(null, true, 'Email verified successfully.');
  }

  async getEmailVerificationOtp(emailVerificationDto: EmailVerificationDto) {
    const user = await this.user.findOne({
      where: { email: emailVerificationDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

    await this.cacheManager.set(
      emailVerificationDto.email,
      otp,
      1000 * 60 * 10,
    );

    const msgwait = await sendMail(
      emailVerificationDto.email,
      'Email Verification',
      htmlContent.replace('{{OTP_VALUE}}', otp),
    );

    if (msgwait.accepted) {
      return responseResult(null, true, 'Otp sent successfully.');
    }
  }

  async me(req: RequestWithUser) {
    const user = await this.user.findOne({
      where: { id: req.user.sub },
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'createdAt',
        'updatedAt',
        'role',
        'image',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return responseResult(user, true, 'User found successfully.');
  }

  async findOne(id: string) {
    const user = await this.user.findOne({
      where: { id, isDeleted: false },
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'createdAt',
        'updatedAt',
        'role',
        'image',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return responseResult(user, true, 'User found successfully.');
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return updateUserDto;
  }

  async remove(id: string) {
    const user = await this.user.findByPk(id);

    user.isDeleted = true;
    await user.save();

    return responseResult(null, true, 'User deleted successfully.');
  }

  async googleAuthService(data: GoogleAuthDto) {
    const client = new OAuth2Client(
      process.env.AUTH_GOOGLE_ID,
      process.env.AUTH_GOOGLE_SECRET,
      'postmessage',
    );

    const token = await client.getToken(data.authCode);

    client.setCredentials(token.tokens);

    if (!token) {
      throw new BadRequestException('Invalid Google Auth Code');
    }
    const { access_token } = token.tokens;
    const userData = await axios.get<any>(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
    );

    const isEmailExist = await this.user.findOne({
      where: { email: userData.data.email },
    });

    if (isEmailExist && data.type === 'signup') {
      return responseResult(isEmailExist, true, 'User already registered.');
    }

    if (data.type === 'signup') {
      const user = await this.user.create({
        firstName: userData.data.given_name,
        lastName: userData.data.family_name,
        email: userData.data.email,
        image: userData.data.picture,
        isVerified: true,
      });

      return responseResult(user, true, 'User created successfully.');
    } else {
      const payload = { sub: isEmailExist.id, role: isEmailExist.role };
      const access_token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1d',
      });

      return responseResult(
        {
          token: access_token,
        },
        true,
        'User logged in successfully.',
      );
    }
  }
}
