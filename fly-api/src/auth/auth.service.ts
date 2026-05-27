import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user._id, 
      role: user.role,
      residencyId: user.residencyId 
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(userDto: any) {
    const hashedPassword = await bcrypt.hash(userDto.password, 10);
    return this.usersService.create({
      ...userDto,
      password: hashedPassword,
    });
  }
}