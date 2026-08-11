import jwt, { JwtPayload } from 'jsonwebtoken';
import { Role } from '../user/user.interface';

export const createToken = (
  jwtPayload: { userId: number; role: Role },
  secret: string,
  expiresIn: number,
) => {
  return jwt.sign(jwtPayload, secret, {
    expiresIn : expiresIn,
  });
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
