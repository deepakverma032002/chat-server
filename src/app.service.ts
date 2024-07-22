import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { responseResult } from './utils/response-result';
@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}
  getHello(): string {
    return 'Hello World!';
  }

  private generatePresignedUrl() {
    const timestamp = Date.now();
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, upload_preset: 'my-preset' },
      this.config.get('CLOUDINARY_SECRET_KEY'),
    );

    return `https://api.cloudinary.com/v1_1/${this.config.get(
      'CLOUDINARY_CLOUD_NAME',
    )}/image/upload?api_key=${this.config.get(
      'CLOUDINARY_API_KEY',
    )}&timestamp=${timestamp}&upload_preset=my-preset&signature=${signature}`;
  }

  async uploadImage() {
    try {
      const url = this.generatePresignedUrl();

      return responseResult(
        { url },
        true,
        'successfully generated presigned url',
      );
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Something went wrong');
    }
  }
}
