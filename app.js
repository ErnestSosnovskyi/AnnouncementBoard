import 'dotenv/config';
import express from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { errors as celebrateErrorsHandler } from 'celebrate';
import announcementsRouter from './src/routes/announcements.routes.js';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/auth.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/announcements', announcementsRouter);

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Announcement Board API',
            version: '1.0.0',
            description: 'RESTful API для Дошки оголошень',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
            }
        ],
        paths: {
            '/auth/register': {
                post: {
                    summary: 'Реєстрація нового користувача',
                    tags: ['Auth'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['username', 'password', 'name'],
                                    properties: {
                                        username: { type: 'string', example: 'ivan_petrenko' },
                                        password: { type: 'string', example: 'password123' },
                                        name: { type: 'string', example: 'Іван' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Користувача успішно створено, токени видано' },
                        409: { description: 'Користувач з таким username вже існує' }
                    }
                }
            },
            '/auth/login': {
                post: {
                    summary: 'Вхід користувача',
                    tags: ['Auth'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['username', 'password'],
                                    properties: {
                                        username: { type: 'string', example: 'ivan_petrenko' },
                                        password: { type: 'string', example: 'password123' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Успішний вхід, токени оновлено' },
                        401: { description: 'Invalid credentials' }
                    }
                }
            },
            '/auth/refresh': {
                post: {
                    summary: 'Оновлення access токена через refresh token',
                    tags: ['Auth'],
                    requestBody: {
                        required: false,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        refreshToken: { type: 'string', example: 'eyJhbGci...' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Токени успішно оновлено (Token Rotation)' },
                        401: { description: 'Невалідний або відсутній токен' }
                    }
                }
            },
            '/auth/logout': {
                post: {
                    summary: 'Вихід (інвалідація refresh токена)',
                    tags: ['Auth'],
                    responses: {
                        200: { description: 'Успішний вихід із системи' }
                    }
                }
            },
            '/auth/me': {
                get: {
                    summary: 'Отримання профілю поточного користувача',
                    tags: ['Auth'],
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: 'Дані поточного користувача' },
                        401: { description: 'Неавторизовано' }
                    }
                }
            },
            '/announcements': {
                get: {
                    summary: 'Отримати список оголошень (з пагінацією, фільтрацією та сортуванням)',
                    tags: ['Announcements'],
                    parameters: [
                        { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Пошук за назвою' },
                        { name: 'sort', in: 'query', schema: { type: 'string', enum: ['newest', 'oldest'] }, description: 'Сортування' },
                        { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Номер сторінки' }
                    ],
                    responses: {
                        200: { description: 'Успішне отримання списку оголошень' },
                    },
                },
                post: {
                    summary: 'Створити нове оголошення',
                    tags: ['Announcements'],
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['title', 'description', 'price', 'category', 'contactInfo'],
                                    properties: {
                                        title: { type: 'string', example: 'Продам ноутбук ASUS' },
                                        description: { type: 'string', example: 'Відмінний стан, 16GB RAM, SSD 512GB' },
                                        price: { type: 'number', example: 18000 },
                                        category: { type: 'string', enum: ['sale', 'service', 'job', 'other'], example: 'sale' },
                                        contactInfo: { type: 'string', example: '0991234567' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Оговорення успішно створено' },
                        401: { description: 'Неавторизовано' },
                        400: { description: 'Помилка валідації вхідних даних через celebrate' },
                    },
                },
            },
            '/announcements/{id}': {
                get: {
                    summary: 'Отримати одне оголошення за ID',
                    tags: ['Announcements'],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Числовий ID оголошення' }
                    ],
                    responses: {
                        200: { description: 'Оголошення успішно знайдено' },
                        404: { description: 'Оголошення з таким ID не існує' },
                    },
                },
                patch: {
                    summary: 'Частково оновити оголошення',
                    tags: ['Announcements'],
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Числовий ID оголошення' }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        title: { type: 'string', example: 'Оновлена назва' },
                                        description: { type: 'string', example: 'Оновлений опис для оголошення' },
                                        price: { type: 'number', example: 17500 },
                                        category: { type: 'string', enum: ['sale', 'service', 'job', 'other'], example: 'sale' },
                                        contactInfo: { type: 'string', example: '0997654321' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Оголошення успішно оновлено' },
                        400: { description: 'Помилка валідації або порожнє тіло запиту' },
                        403: { description: 'Доступ заборонено (не власник)' },
                        404: { description: 'Оголошення не знайдено' },
                    },
                },
                delete: {
                    summary: 'Видалити оголошення за ID',
                    tags: ['Announcements'],
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Числовий ID оголошення' }
                    ],
                    responses: {
                        204: { description: 'Успішно видалено (без тіла відповіді)' },
                        403: { description: 'Доступ заборонено (не власник)' },
                        404: { description: 'Оголошення не знайдено' },
                    },
                },
            },
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        }
    },
    apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(celebrateErrorsHandler());

app.use((req, res) => {
    res.status(404).json({ error: 'Ендпоінт не знайдено' });
});

app.use((err, req, res, next) => {
    if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Оголошення не знайдено' });
    }
    if (err.status || err.statusCode) {
        const statusCode = err.status || err.statusCode;
        return res.status(statusCode).json({ error: err.message });
    }
    console.log('КРИТИЧНА_ПОМИЛКА_СЕРВЕРА:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
    console.log(`Документація Swagger доступна за адресою: http://localhost:${PORT}/api-docs`);
});