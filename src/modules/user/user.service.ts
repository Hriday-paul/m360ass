import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
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
            const createdUser = await db<User>("users").insert({ password: hashedPassword, isVerified: false, ...morePayload }).returning(["name", "email", "id"]);
            user = createdUser[0];
        }


        return user;
    }

}

// update user profile
const updateProfile = async (payload: User, userId: string, image?: { url: string, key: string }) => {

    const { phone, fname, lname, fcmToken, address, countries, profession, company } = payload

    const updateFields: Partial<User> = { phone, fname, lname, fcmToken, address, countries, profession, company };

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

    const data: any = {
        ...updateFields,
    };

    if (image) {
        data.picture = {
            upsert: {
                update: image,   // update existing picture
                create: image    // create new picture if not exists
            }
        };
    }

    const result = await prisma.user.update({ where: { id: userId }, data })

    return result
}

// const addNewMyBusinessCard = async (paylod: { businessCard: BusinessCard }, userId: string) => {

//     const haveDefault = await prisma.personalCard.count({ where: { userId, isDefault: true } });

//     const res = await prisma.personalCard.create({
//         data: {
//             ...paylod.businessCard,
//             userId,
//             isDefault: haveDefault === 0 ? true : false, // set as default if no default card exist for user 
//         }
//     });

//     return res;
// }

//get all users

const allUsers = async (query: Record<string, unknown>, options: TPaginationOptions) => {

    const AndConditions: Prisma.UserWhereInput[] = [{ isDeleted: false, auth: { role: { not: Role.ADMIN } } }];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, role } = query;

    if (searchTerm) {
        AndConditions.push({
            OR: [
                {
                    fname: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                },
                {
                    email: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                },
                {
                    phone: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                }
            ],
        });
    }

    if (role) {
        AndConditions.push({
            auth: {
                role
            }
        });
    }

    const whereConditions: Prisma.UserWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            auth: { select: { status: true, last_loginAt: true } },
            picture: true,
            _count: {
                select: {
                    cards: true,
                },
            },
        },
    })

    const total = await prisma.user.count({
        where: whereConditions,
    });

    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
}

const getUserById = async (id: string) => {
    const result = await prisma.user.findFirst({ where: { id }, include: { picture: true, cards: { where: { isPersonalCard: true }, include: { frontPicture: true, backPicture: true, businessCard: true } } } });
    return result;
};

//user status update
const status_update_user = async (payload: { status: boolean }, id: string) => {

    const result = await prisma.user.update({
        where: {
            id,
            auth: { role: { not: Role.ADMIN } }
        },
        data: {
            auth: { update: { data: { status: payload?.status } } }
        }
    })

    return result
}

const deletemyAccount = async (userId: string) => {

    const exist = await prisma.user.findFirst({ where: { id: userId } });

    if (!exist) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'User not found',
        );
    }

    const res = await prisma.user.delete({
        where: { id: userId, auth: { role: { not: Role.ADMIN } } },
    });

    return res;
}

const userDetails = async (userId: string) => {
    const res = await prisma.user.findFirst({
        where: { id: userId },
        include: {
            picture: true,
            cards: {
                where: { isPersonalCard: true },
                orderBy: [
                    { isDefault: 'desc' }, // default card first
                    { createdAt: 'asc' },  // fallback to oldest/first card
                ],
                include: {
                    frontPicture: true,
                    backPicture: true,
                    businessCard: true,
                }
            }
        }
    });
    return res;
}

const UpdateNotification = async (payload: { status: boolean, fcmToken?: string }, userId: string) => {

    const res = await prisma.user.update({
        where: { id: userId },
        data: {
            notification: payload?.status,
            fcmToken: payload?.fcmToken
        }
    });
    return res;

}

type ProfileCompletionResult = {
    completion: number;      // 0-100
    missingFields: string[]; // list of incomplete fields
};

const getProfileCompletion = async (userId: string): Promise<ProfileCompletionResult> => {

    const user = await prisma.user.findFirst({ where: { id: userId }, include: { picture: true, cards: { where: { isPersonalCard: true } } } });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Account not found");
    }

    type FieldConfig = { weight: number; label?: string };
    const FIELD_CONFIG: Record<keyof any, FieldConfig> = {
        fname: { weight: 10, label: "First Name" },
        lname: { weight: 5, label: "Last Name" },
        email: { weight: 10, label: "Email" },
        phone: { weight: 10, label: "Phone" },
        countries: { weight: 5, label: "Countries" },
        address: { weight: 10, label: "Address" },
        profession: { weight: 10, label: "Profession" },
        picture: { weight: 15, label: "Profile Picture" },
        cards: { weight: 25, label: "Business Card" },
    };

    let filledWeight = 0;
    const missingFields: string[] = [];

    // total weight is sum of all field weights
    const totalWeight = Object.values(FIELD_CONFIG).reduce(
        (acc, field) => acc + field.weight,
        0
    );

    // iterate over FIELD_CONFIG
    for (const key in FIELD_CONFIG) {
        const fieldKey = key as keyof User;
        const { weight, label } = FIELD_CONFIG[fieldKey]!;
        const value = user[fieldKey];

        const isEmpty = value === null || value === undefined || (typeof value === "string" && value.trim() === "") ||
            (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
            missingFields.push(label!);
        } else {
            filledWeight += weight;
        }
    }

    const completion = Math.min(Math.round((filledWeight / totalWeight) * 100), 100);

    return { completion, missingFields };
};

//set a default peronal business card
const setDefaultPersonalBusinessCard = async (cardId: string, userId: string) => {
    const businessCardExist = await prisma.card.findFirst({ where: { id: cardId, isPersonalCard: true } });

    if (!businessCardExist) {
        throw new AppError(httpStatus.NOT_FOUND, "Business card do not exist for set default");
    }

    if (businessCardExist.userId !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to set this business card as default");
    }

    await prisma.$transaction(async (tx) => {
        // Set the specified business card as default
        await tx.card.update({
            where: { id: cardId },
            data: { isDefault: true }
        });
        await tx.card.updateMany({
            where: {
                userId,
                isPersonalCard: true,
                id: { not: cardId }
            },
            data: { isDefault: false }
        });
    })
}

export const userService = {
    updateProfile,
    getUserById,
    allUsers,
    status_update_user,
    deletemyAccount,
    userDetails,
    getProfileCompletion,
    UpdateNotification,
    setDefaultPersonalBusinessCard
}