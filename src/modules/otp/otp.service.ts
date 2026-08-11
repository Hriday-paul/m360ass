import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import moment from 'moment';
import config from '../../config';
import { generateOtp } from '../../utils/otpGenerator';
import fs from 'fs';
import path from 'path';
import { sendEmail } from '../../utils/mailSender';
import bcrypt from 'bcrypt'
import { emailQueue } from '../../queues/email.queue';
import db from '../../db/knex';
import { User } from '../user/user.interface';
import { OtpRequest } from './otp.interface';

export class OtpService {

  async verifyOtp(token: string, otp: string) {

    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
    }
    let decode;

    try {
      decode = jwt.verify(
        token,
        config.jwt_auth_secret as Secret,
      ) as JwtPayload;
    } catch (err) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Session has expired. Please try to submit OTP within 10 minutes',
      );
    }

    if (!decode?.requestId || !decode?.userId) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'Invalid request',
      );
    }

    const user = await db<User>('users').where({ id: decode?.userId }).select("*").first();

    const otpRequest = await db<OtpRequest>('otp_requests').where({ id: decode?.requestId }).first();

    if (!user) {
      throw new AppError(httpStatus.BAD_REQUEST, 'User does not exist');
    }

    if (!otpRequest) {
      throw new AppError(httpStatus.NOT_FOUND, 'Request does not exist');
    }
    
    if (otpRequest?.isVerified) {
      throw new AppError(httpStatus.NOT_FOUND, 'Otp already verified');
    }
    if (otpRequest?.type == "REGISTER" && user?.isVerified) {
      throw new AppError(httpStatus.NOT_FOUND, 'Account already verified');
    }

    if (new Date() > otpRequest?.expiredAt) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'OTP has expired. Please try to submit OTP within 10 minute',
      );
    }

    const otpMatched = await bcrypt.compare(otp, otpRequest?.code);

    if (!otpMatched) {
      throw new AppError(httpStatus.BAD_REQUEST, 'OTP did not match');
    }

    // mark the otp request as verified and also mark the user as verified
    await db.transaction(async (tx) => {

      await tx<OtpRequest>('otp_requests').where({ id: otpRequest?.id }).update({
        isVerified: true,
        verifiedAt: new Date(),
      });

      await tx<User>('users').where({ id: user?.id }).update({
        isVerified: true,
      });

    })

    const jwtPayload = {
      role: user?.role,
      userId: user?.id,
      requestId: otpRequest?.id
    };

    //generate a new access token for the user
    const accessToken = jwt.sign(jwtPayload, config.jwt_access_secret as Secret, {
      expiresIn: 60 * 30, //30 minutes
    });

    return { user: user, accessToken: accessToken };
  };

  async resendOtp(email: string) {
    const user = await db<User>('users').where({ email }).select("id", "email", "role").first();

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'Account with this email does not exist');
    }

    const otp = generateOtp();
    const expiresAt = moment().add(10, 'minute').toDate();

    const hashedOtp = await bcrypt.hash(otp, 10);

    //create a new otp request
    const requestedOtp = await db<OtpRequest>('otp_requests').insert({
      code: hashedOtp,
      expiredAt: expiresAt,
      createdAt: new Date(),
      isVerified: false,
      type: "REGISTER",
      userId: user?.id
    }).returning('id').then(rows => rows[0]);

    const jwtPayload = {
      userId: user?.id,
      role: user?.role,
      requestId: requestedOtp?.id
    };
  
    //generate a new token, for verify the otp request
  const token = jwt.sign(jwtPayload, config.jwt_auth_secret as Secret, {
    expiresIn: '10m',
  });

  const otpEmailPath = path.join(
    process.cwd(),
    'public',
    'view',
    'otp_mail.html'
  );

    // pass the email sending task to the email queue
    await emailQueue.add(
    "email",
    {
      to: user?.email,
      subject: "Your One Time OTP",
      html: fs
        .readFileSync(otpEmailPath, 'utf8')
        .replace('{{otp}}', otp)
        .replace('{{email}}', user?.email),
    },
  )

return token;
  };

}
