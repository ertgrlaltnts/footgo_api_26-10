import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, isValidObjectId } from 'mongoose';
import moment from 'moment';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { LoginWithPasswordDto } from './dto/login-with-password.dto';
import { RegisterWithPasswordDto } from './dto/register-with-password.dto';
import { User, UserDocument } from './schemas/user.schema';
import { PaymentsService } from '../payments/payments.service';

interface JwtPayload {
  _id: string;
  email: string;
  name: string;
  profilePhoto: string;
  coin: number;
  premium: {
    isPremium: boolean;
    premiumStartDate: string;
    premiumEndDate: string;
  };
  coupons: object[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private paymentsService: PaymentsService,
  ) {}

  async findAll(paginationQuery: PaginationQueryDto): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 40 } = paginationQuery;
      const skip = (page - 1) * limit;

      const data = await this.userModel
        .find()
        .sort({ createdAt: -1 }) // En son eklenenler önce
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await this.userModel.countDocuments().exec();
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch {
      throw new BadRequestException(
        'Kullanıcılar getirilirken bir hata oluştu',
      );
    }
  }

  async searchByEmail(searchUserDto: SearchUserDto): Promise<User[]> {
    try {
      const { email } = searchUserDto;

      // Email'de case-insensitive arama yapar
      const users = await this.userModel
        .find({
          email: { $regex: email, $options: 'i' },
        })
        .sort({ createdAt: -1 })
        .exec();

      return users;
    } catch {
      throw new BadRequestException(
        'Kullanıcı arama sırasında bir hata oluştu',
      );
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      if (!isValidObjectId(id)) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`Kullanıcı bulunamadı`);
      }
      return user;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Kullanıcı bulunamadı');
    }
  }

  async loginWithGoogle(
    createUserDto: CreateUserDto,
  ): Promise<{ token: string }> {
    try {
      // Email'e göre kullanıcıyı ara
      let user = await this.userModel
        .findOne({ email: createUserDto.email })
        .exec();

      // Eğer kullanıcı yoksa, yeni kullanıcı oluştur
      if (!user) {
        const createdUser = new this.userModel({
          ...createUserDto,
          authProvider: 'google',
        });
        user = await createdUser.save();
      } else if (user.authProvider === 'local') {
        throw new BadRequestException(
          'Bu email ile şifreli giriş hesabı mevcut. Lütfen şifre ile giriş yapın.',
        );
      }

      // lastLoginDate'i güncelle
      user = await this.userModel
        .findByIdAndUpdate(
          user._id,
          { lastLoginDate: new Date() },
          { new: true },
        )
        .exec();

      if (!user) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      if (user.premium.isPremium && user.premium.premiumEndDate) {
        const endDate = moment(user.premium.premiumEndDate, 'DD.MM.YYYY');

        if (endDate.isBefore(moment(), 'day')) {
          await this.deletePremium({
            id: (user._id as { toString(): string }).toString(),
          });
        }
      }

      // JWT token oluştur
      const payload = {
        _id: (user._id as { toString(): string }).toString(),
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        coin: user.coin,
        premium: user.premium,
        coupons: user.coupons,
      };

      const access_token = this.jwtService.sign(payload);

      return {
        token: access_token,
      };
    } catch (error: unknown) {
      // MongoDB duplicate key hatası (11000)
      if (this.isMongoError(error) && error.code === 11000) {
        throw new ConflictException('Bir hata oluştu');
      }

      // Validasyon hataları
      if (this.isValidationError(error)) {
        const messages = Object.values(error.errors)
          .map((err) => err.message)
          .join(', ');
        throw new BadRequestException(`Validasyon hatası: ${messages}`);
      }

      // Diğer hatalar
      throw new BadRequestException(
        'Giriş yapılırken bir hata oluştu: ' +
          (error instanceof Error ? error.message : 'Bilinmeyen hata'),
      );
    }
  }

  async loginWithPassword(
    loginWithPasswordDto: LoginWithPasswordDto,
  ): Promise<{ token: string }> {
    try {
      const { email, password } = loginWithPasswordDto;
      let user = await this.userModel.findOne({ email }).exec();

      if (!user) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      if (user.authProvider === 'google') {
        throw new BadRequestException(
          'Bu email Google ile kayıtlı. Lütfen Google ile giriş yapın.',
        );
      }

      if (!user.password || user.password !== password) {
        throw new UnauthorizedException('Email veya şifre hatalı');
      }

      user = await this.userModel
        .findByIdAndUpdate(user._id, { lastLoginDate: new Date() }, { new: true })
        .exec();

      if (!user) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      if (user.premium.isPremium && user.premium.premiumEndDate) {
        const endDate = moment(user.premium.premiumEndDate, 'DD.MM.YYYY');

        if (endDate.isBefore(moment(), 'day')) {
          await this.deletePremium({
            id: (user._id as { toString(): string }).toString(),
          });
        }
      }

      const payload = {
        _id: (user._id as { toString(): string }).toString(),
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        coin: user.coin,
        premium: user.premium,
        coupons: user.coupons,
      };

      const access_token = this.jwtService.sign(payload);

      return {
        token: access_token,
      };
    } catch (error: unknown) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (this.isMongoError(error) && error.code === 11000) {
        throw new ConflictException('Bir hata oluştu');
      }

      if (this.isValidationError(error)) {
        const messages = Object.values(error.errors)
          .map((err) => err.message)
          .join(', ');
        throw new BadRequestException(`Validasyon hatası: ${messages}`);
      }

      throw new BadRequestException(
        'Şifreli giriş sırasında bir hata oluştu: ' +
          (error instanceof Error ? error.message : 'Bilinmeyen hata'),
      );
    }
  }

  async registerWithPassword(
    registerWithPasswordDto: RegisterWithPasswordDto,
  ): Promise<{ token: string }> {
    try {
      const { email, password, name, profilePhoto } = registerWithPasswordDto;
      const existingUser = await this.userModel.findOne({ email }).exec();

      if (existingUser) {
        if (existingUser.authProvider === 'google') {
          throw new BadRequestException(
            'Bu email Google ile kayıtlı. Lütfen Google ile giriş yapın.',
          );
        }

        throw new ConflictException('Bu email ile kayıtlı bir kullanıcı mevcut.');
      }

      const createdUser = new this.userModel({
        email,
        password,
        name,
        profilePhoto,
        authProvider: 'local',
      });

      const user = await createdUser.save();

      const payload = {
        _id: (user._id as { toString(): string }).toString(),
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        coin: user.coin,
        premium: user.premium,
        coupons: user.coupons,
      };

      const access_token = this.jwtService.sign(payload);

      return {
        token: access_token,
      };
    } catch (error: unknown) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      if (this.isMongoError(error) && error.code === 11000) {
        throw new ConflictException('Bu email ile kayıtlı bir kullanıcı mevcut.');
      }

      if (this.isValidationError(error)) {
        const messages = Object.values(error.errors)
          .map((err) => err.message)
          .join(', ');
        throw new BadRequestException(`Validasyon hatası: ${messages}`);
      }

      throw new BadRequestException(
        'Kayıt sırasında bir hata oluştu: ' +
          (error instanceof Error ? error.message : 'Bilinmeyen hata'),
      );
    }
  }

  async getUserByToken(token: string): Promise<User> {
    try {
      // Token'ı decode et ve verify et
      const decoded = this.jwtService.verify<JwtPayload>(token);

      // Payload'tan _id'yi al
      const userId = decoded._id;

      if (!userId) {
        throw new BadRequestException('Token geçersiz: _id bulunamadı');
      }

      // _id ile kullanıcıyı bul
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      return user;
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // JWT verify hatası (token geçersiz, süresi dolmuş vb.)
      if (error instanceof Error && error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Geçersiz token');
      }

      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token süresi dolmuş');
      }

      throw new BadRequestException(
        'Token ile kullanıcı bulunurken bir hata oluştu: ' +
          (error instanceof Error ? error.message : 'Bilinmeyen hata'),
      );
    }
  }

  async updateCoin({
    id,
    coin,
    price,
    product,
  }: {
    id: string;
    coin: number;
    price: string;
    product: string;
  }): Promise<User> {
    try {
      // Önce kullanıcıyı bul (payment için bilgileri almak için)
      const userBeforeUpdate = await this.userModel.findById(id).exec();
      if (!userBeforeUpdate) {
        throw new NotFoundException(`ID ${id} ile kullanıcı bulunamadı`);
      }

      const user = await this.userModel
        .findByIdAndUpdate(id, { $inc: { coin: coin } }, { new: true })
        .exec();
      if (!user) {
        throw new NotFoundException(`ID ${id} ile kullanıcı bulunamadı`);
      }

      try {
        await this.paymentsService.create({
          userId: (user._id as { toString(): string }).toString(),
          userPhoto: user.profilePhoto,
          userEmail: user.email,
          userName: user.name,
          product: product,
          price: price,
        });
      } catch (paymentError) {
        // Payment oluşturma hatası kritik değil, log'lanabilir ama işlemi durdurmaz
        console.error('Payment kaydı oluşturulurken hata:', paymentError);
      }

      return user;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Kullanıcı coin güncellenirken bir hata oluştu',
      );
    }
  }

  async deletePremium({ id }: { id: string }): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(
        id,
        {
          'premium.isPremium': false,
          'premium.premiumStartDate': '',
          'premium.premiumEndDate': '',
        },
        { new: true },
      )
      .exec();
  }

  async updatePremium({
    id,
    day,
    price,
    product,
  }: {
    id: string;
    day: number;
    price: string;
    product: string;
  }): Promise<User> {
    try {
      // Kullanıcıyı bul
      const user = await this.userModel.findById(id).exec();

      // Kullanıcı bulunamazsa hata fırlat
      if (!user) {
        throw new NotFoundException(`ID ${id} ile kullanıcı bulunamadı`);
      }

      const today = moment().format('DD.MM.YYYY');
      const endDate = moment().add(day, 'days').format('DD.MM.YYYY');

      // Eğer isPremium true ve premiumStartDate boş değilse
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

        // Payment kaydı oluştur (premium süre uzatma)
        try {
          await this.paymentsService.create({
            userId: (updatedUser._id as { toString(): string }).toString(),
            userPhoto: updatedUser.profilePhoto,
            userEmail: updatedUser.email,
            userName: updatedUser.name,
            product: product,
            price: price,
          });
        } catch (paymentError) {
          // Payment oluşturma hatası kritik değil, log'lanabilir ama işlemi durdurmaz
          console.error('Payment kaydı oluşturulurken hata:', paymentError);
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

        // Payment kaydı oluştur
        try {
          await this.paymentsService.create({
            userId: (updatedUser._id as { toString(): string }).toString(),
            userPhoto: updatedUser.profilePhoto,
            userEmail: updatedUser.email,
            userName: updatedUser.name,
            product: product,
            price: price,
          });
        } catch (paymentError) {
          // Payment oluşturma hatası kritik değil, log'lanabilir ama işlemi durdurmaz
          console.error('Payment kaydı oluşturulurken hata:', paymentError);
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

  async buyCoupon({
    id,
    couponId,
    couponPay,
  }: {
    id: string;
    couponId: string;
    couponPay: number;
  }): Promise<User> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    try {
      const userById = await this.userModel.findById(id).exec();

      if (!userById) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      if (userById.coin < couponPay) {
        throw new BadRequestException('Coin yetersiz');
      }

      const user = await this.userModel
        .findByIdAndUpdate(
          id,
          {
            $push: { coupons: couponId },
            $inc: { coin: -couponPay },
          },
          { new: true },
        )
        .exec();

      if (!user) {
        throw new NotFoundException(`Kullanıcı bulunamadı`);
      }

      return user;
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Kullanıcı coupon satın alamadı');
    }
  }

  async remove(id: string): Promise<User> {
    try {
      if (!isValidObjectId(id)) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }
      const user = await this.userModel.findByIdAndDelete(id).exec();
      if (!user) {
        throw new NotFoundException(`Kullanıcı bulunamadı`);
      }
      return user;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Kullanıcı silinemedi');
    }
  }

  // Helper metodlar - Tip güvenliği için
  private isMongoError(
    error: unknown,
  ): error is { code: number; keyPattern: Record<string, unknown> } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'keyPattern' in error
    );
  }

  private isValidationError(
    error: unknown,
  ): error is { name: string; errors: Record<string, { message: string }> } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name: string }).name === 'ValidationError' &&
      'errors' in error
    );
  }
}

