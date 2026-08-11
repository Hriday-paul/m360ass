import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join((process.cwd(), '.env')) });

const db = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const stripe = {
  stripe_api_key: process.env.STRIPE_API_KEY,
  stripe_api_secret: process.env.STRIPE_API_SECRET,
};

const redis = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
}

const aws = {
  accessKeyId: process.env.S3_BUCKET_ACCESS_KEY,
  secretAccessKey: process.env.S3_BUCKET_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_BUCKET_NAME,
  spacesEndpoint: process.env.SPACES_ENDPOINT,
};

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  socket_port: process.env.SOCKET_PORT,
  ip: process.env.IP,
  SERVER_URL: process.env.SERVER_URL,
  BASE_URL: process.env.BASE_URL,

  password_pepper : process.env.PASSWORD_PEPPER,

  success_url: process.env.PAYMENT_SUCCESS_URL,
  cancel_url: process.env.PAYMENT_CANCEL_URL,
  database_url: process.env.DATABASE_URL,

  client_Url: process.env.CLIENT_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_auth_secret: process.env.JWT_AUTH_SECRET,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  nodemailer_host_email: process.env.NODEMAILER_HOST_EMAIL,
  nodemailer_host_pass: process.env.NODEMAILER_HOST_PASS,

  stripe_secret: process.env.STRIPE_API_SECRET,
  stripe_key: process.env.STRIPE_API_KEY,
  stripe,
  aws,

  redis,
  db,
};
