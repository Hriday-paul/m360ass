import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import moment from 'moment';
import config from '../../config';
import { generateOtp } from '../../utils/otpGenerator';
import prisma from '../../shared/prisma';
import fs from 'fs';
import path from 'path';
import { sendEmail } from '../../utils/mailSender';
import bcrypt from 'bcrypt'
import { emailQueue } from '../../queues/email.queue';

const verifyOtp = async (token: string, otp: string) => {

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
      'Session has expired. Please try to submit OTP within 3 minute',
    );
  }

  if (!decode?.requestId || !decode?.userId) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Invalid request',
    );
  }

  const user = await prisma.user.findFirst({ where: { id: decode?.userId }, include: { auth: true } });

  const OtpRequest = await prisma.otpRequest.findFirst({ where: { id: decode?.requestId } });

  if (!user || !user?.auth) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }

  if (!OtpRequest) {
    throw new AppError(httpStatus.NOT_FOUND, 'Request does not exist');
  }
  if (OtpRequest?.isVerified) {
    throw new AppError(httpStatus.NOT_FOUND, 'Otp already verified');
  }
  if (OtpRequest?.type == "REGISTER" && user?.auth?.isverified) {
    throw new AppError(httpStatus.NOT_FOUND, 'Account already verified');
  }

  if (new Date() > OtpRequest?.expiredAt) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'OTP has expired. Please try to submit OTP within 10 minute',
    );
  }

  const otpMatched = await bcrypt.compare(otp, OtpRequest?.code);

  if (!otpMatched) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP did not match');
  }

  await prisma.$transaction(async (tx) => {
    await tx.otpRequest.update({
      where: { id: OtpRequest?.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    if (OtpRequest?.type === "REGISTER") {
      await tx.auth.update({
        where: { id: user?.auth?.id },
        data: {
          isverified: true,
        },
      });
    }
  });

  const jwtPayload = {
    role: user?.auth?.role,
    userId: user?.id,
    requestId: OtpRequest?.id
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt_access_secret as Secret, {
    expiresIn: 60 * 30, //30 minutes
  });

  return { user: user, accessToken: accessToken };
};

const resendOtp = async (email: string) => {
  const user = await prisma.user.findFirst({ where: { email }, include: { auth: true } })

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Account with this email does not exist');
  }

  const otp = generateOtp();
  const expiresAt = moment().add(10, 'minute').toDate();

  const hashedOtp = await bcrypt.hash(otp, 10);

  //create a new otp request
  const requestedOtp = await prisma.otpRequest.create({
    data: {
      code: hashedOtp,
      expiredAt: expiresAt,
      createdAt: new Date(),
      isVerified: false,
      type: "REGISTER",
      userId: user?.id
    }
  })

  const jwtPayload = {
    userId: user?.id,
    role: user?.auth?.role,
    requestId: requestedOtp?.id
  };

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

export const otpServices = {
  verifyOtp,
  resendOtp,
};
