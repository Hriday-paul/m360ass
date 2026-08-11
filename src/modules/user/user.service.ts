import AppError from "../../error/AppError";
import httpStatus from 'http-status'
import { User } from "./user.interface";
import db from "../../db/knex";
import config from "../../config";
import bcrypt from 'bcrypt'

export class UserService {

    async createNewUser(payload: User): Promise<Pick<User, 'id' | 'name' | 'email'>> {
        const { email, password, isVerified, ...morePayload } = payload;

        // Check if the email already exists & account is verified
        const existingUser = await db<User>("users").where({ email }).first();

        if (existingUser && existingUser.isVerified) {
            throw new AppError(
                httpStatus.CONFLICT,
                'Account already exists with this email',
            );
        }

        // creat encrypted password
        const PEPPER = config.password_pepper;
        const hashedPassword = await bcrypt.hash(password + PEPPER, 15);

        let user: Pick<User, 'id' | 'name' | 'email'> = {} as User;

        // just update the existing account if found not verified account
        if (existingUser) {
            const updatedUser = await db<User>("users")
                .where({ email })
                .update({ password: hashedPassword, isVerified: false, ...morePayload }).returning(["name", "email", "id"]);
            user = updatedUser[0];
        } else {
            const createdUser = await db<User>("users").insert({ email, password: hashedPassword, isVerified: false, ...morePayload }).returning(["name", "email", "id"]);
            user = createdUser[0];
        }


        return user;
    }

    // update user profile
    async updateProfile(payload: User, current_userId: number) {

        const { name } = payload;

        const updateFields: Partial<User> = { name };

        // Remove undefined or null fields to prevent overwriting existing values with null
        Object.keys(updateFields).forEach((key) => {
            if (updateFields[key as keyof User] === undefined || updateFields[key as keyof User] === null) {
                delete updateFields[key as keyof User];
            }
        });

        // check updated field found or not
        if (Object.keys(updateFields).length === 0) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                'No valid field found',
            );
        }

        const result = await db<User>('users').where({ id: current_userId }).update(updateFields);

        return result;
    }

    async getUserById(userId: number) {
        const result = await db<User>('users').where({ id: userId }).select('id', 'name', 'email', "role").first();
        return result;
    };

    async deleteAccountById(userId: number) {

        // check if user exist or not
        const exist = await db<User>('users').where({ id: userId }).select('id').first();

        if (!exist) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                'User does not exist',
            );
        }

        // delete user account
        const res = await db<User>('users').where({ id: userId }).del();

        return res;
    }

}
