import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, isValidObjectId } from 'mongoose';
import moment from 'moment';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { Admin, AdminDocument } from './schemas/admin.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name)
    private adminModel: Model<AdminDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    // Mevcut admin sayısını kontrol et
    const adminCount = await this.adminModel.countDocuments().exec();

    if (adminCount >= 1) {
      throw new ConflictException('Buna yetkiniz yok');
    }

    const createdAdmin = new this.adminModel(createAdminDto);
    return createdAdmin.save();
  }

  async remove(id: string): Promise<Admin> {
    const admin = await this.adminModel.findByIdAndDelete(id).exec();
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    return admin;
  }

  async login(loginAdminDto: LoginAdminDto): Promise<{ token: string }> {
    const { username, password } = loginAdminDto;

    // Kullanıcıyı username'e göre bul
    const admin = await this.adminModel.findOne({ username }).exec();

    if (!admin) {
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');
    }

    // Şifre kontrolü
    if (admin.password !== password) {
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');
    }

    // JWT token oluştur
    const payload = {
      _id: (admin._id as { toString(): string }).toString(),
      username: admin.username,
      id: admin._id,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      token: access_token,
    };
  }

  async getAdminByUsername(username: string, id: string): Promise<Admin> {
    const admin = await this.adminModel.findOne({ username, _id: id }).exec();
    if (!admin) {
      throw new NotFoundException(`Admin with username ${username} not found`);
    }
    return admin;
  }

  async sendCoin({ id, coin }: { id: string; coin: number }): Promise<User> {
    try {
      if (!isValidObjectId(id)) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      // Kullanıcıyı bul
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`ID ${id} ile kullanıcı bulunamadı`);
      }

      // Coin güncelle (payments oluşturmadan)
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, { $inc: { coin: coin } }, { new: true })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`ID ${id} ile kullanıcı bulunamadı`);
      }

      return updatedUser;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Kullanıcı coin güncellenirken bir hata oluştu',
      );
    }
  }

  async sendPremium({ id, day }: { id: string; day: number }): Promise<User> {
    try {
      if (!isValidObjectId(id)) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      // Kullanıcıyı bul
      const user = await this.userModel.findById(id).exec();

      if (!user) {
        throw new NotFoundException(`ID ${id} ile kullanıcı bulunamadı`);
      }

      const today = moment().format('DD.MM.YYYY');
      const endDate = moment().add(day, 'days').format('DD.MM.YYYY');

      // Eğer isPremium true ve premiumEndDate boş değilse
      if (user.premium.isPremium && user.premium.premiumEndDate) {
        // Sadece premiumEndDate'i güncelle
        const newEndDate = moment(user.premium.premiumEndDate, 'DD.MM.YYYY')
          .add(day, 'days')
          .format('DD.MM.YYYY');

        const updatedUser = await this.userModel
          .findByIdAndUpdate(
            id,
            {
              'premium.premiumEndDate': newEndDate,
            },
            { new: true },
          )
          .exec();

        if (!updatedUser) {
          throw new NotFoundException(`ID ${id} ile kullanıcı bulunamadı`);
        }

        return updatedUser;
      }

      // Eğer isPremium false ve premiumStartDate boş ise
      if (!user.premium.isPremium && !user.premium.premiumStartDate) {
        // Premium'u aktif et ve tarihleri ayarla
        const updatedUser = await this.userModel
          .findByIdAndUpdate(
            id,
            {
              'premium.isPremium': true,
              'premium.premiumStartDate': today,
              'premium.premiumEndDate': endDate,
            },
            { new: true },
          )
          .exec();

        if (!updatedUser) {
          throw new NotFoundException(`ID ${id} ile kullanıcı bulunamadı`);
        }

        return updatedUser;
      }

      // Diğer durumlar için hata mesajı
      throw new BadRequestException('Premium durumu güncellenemiyor');
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException(
        error instanceof Error ? error.message : 'Bilinmeyen hata',
      );
    }
  }
}
