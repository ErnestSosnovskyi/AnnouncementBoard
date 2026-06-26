import 'dotenv/config';
import express from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { errors as celebrateErrorsHandler } from 'celebrate';
import announcementsRouter from './src/routes/announcements.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
            '/announcements': {
                get: {
                    summary: 'Отримати список оголошень (з пагінацією, фільтрацією та сортуванням)',
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
                        201: { description: 'Оголошення успішно створено' },
                        400: { description: 'Помилка валідації вхідних даних через celebrate' },
                    },
                },
            },
            '/announcements/{id}': {
                get: {
                    summary: 'Отримати одне оголошення за ID',
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
                        404: { description: 'Оголошення не знайдено' },
                    },
                },
                delete: {
                    summary: 'Видалити оголошення за ID',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Числовий ID оголошення' }
                    ],
                    responses: {
                        204: { description: 'Успішно видалено (без тіла відповіді)' },
                        404: { description: 'Оголошення не знайдено' },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/announcements', announcementsRouter);

app.use(celebrateErrorsHandler());

app.use((req, res) => {
    res.status(404).json({ error: 'Ендпоінт не знайдено' });
});

app.use((err, req, res, next) => {
    if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Оголошення не знайдено' });
    }
    console.log('КРИТИЧНА_ПОМИЛКА_СЕРВЕРА:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
    console.log(`Документація Swagger доступна за адресою: http://localhost:${PORT}/api-docs`);
});