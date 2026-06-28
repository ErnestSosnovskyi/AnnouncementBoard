import prisma from '../../prisma/client.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7 days' }
    );
    return { accessToken, refreshToken };
};

const setRefreshCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

/**
 * @openapi
 * /auth/register:
 * post:
 * summary: Register a new user
 * tags: [Auth]
 */
const register = async (req, res, next) => {
    try {
        const { username, password, name } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return next(createHttpError(409, 'User with this username already exists'));
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { username, name, password: hashedPassword },
        });
        const { accessToken, refreshToken } = generateTokens(user);
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId: user.id },
        });

        setRefreshCookie(res, refreshToken);

        res.status(201).json({
            user: { id: user.id, username: user.username, name: user.name },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @openapi
 * /auth/login:
 * post:
 * summary: Log in user
 * tags: [Auth]
 */
const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return next(createHttpError(401, 'Invalid credentials'));
        }
        const { accessToken, refreshToken } = generateTokens(user);

        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId: user.id },
        });

        setRefreshCookie(res, refreshToken);

        res.json({
            user: { id: user.id, username: user.username, name: user.name },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @openapi
 * /auth/refresh:
 * post:
 * summary: Refresh access token
 * tags: [Auth]
 */
const refresh = async (req, res, next) => {
    try {
        const tokenFromCookie = req.cookies?.refreshToken;
        const tokenFromBody = req.body?.refreshToken;
        const currentToken = tokenFromCookie || tokenFromBody;

        if (!currentToken) {
            return next(createHttpError(401, 'Refresh token missing'));
        }

        let decoded;
        try {
            decoded = jwt.verify(currentToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return next(createHttpError(401, 'Invalid or expired refresh token'));
        }
        const dbToken = await prisma.refreshToken.findUnique({ where: { token: currentToken }, });
        if (!dbToken) {
            return next(createHttpError(401, 'Refresh token not found in database'));
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        await prisma.refreshToken.delete({ where: { token: currentToken } });
        await prisma.refreshToken.create({
            data: { token: newRefreshToken, userId: user.id },
        });

        setRefreshCookie(res, newRefreshToken);
        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
        next(error);
    }
};

/**
 * @openapi
 * /auth/logout:
 * post:
 * summary: Log out user
 * tags: [Auth]
 */
const logout = async (req, res, next) => {
    try {
        const tokenFromCookie = req.cookies?.refreshToken;
        const tokenFromBody = req.body?.refreshToken;
        const currentToken = tokenFromCookie || tokenFromBody;

        if (currentToken) {
            await prisma.refreshToken.deleteMany({ where: { token: currentToken } });
        }

        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @openapi
 * /auth/me:
 * get:
 * summary: Get current user profile
 * tags: [Auth]
 */
const me = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, username: true, name: true, createdAt: true },
        });
        res.json(user);
    } catch (error) {
        next(error);
    }
};

export { register, login, refresh, logout, me };