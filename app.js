import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

const categoryMap = {
    sale: '📦 Продаж',
    service: '🔧 Послуги',
    job: '💼 Праця',
    other: '📌 Інше'
};

app.get('/', async(req, res, next) => {
    try {
        const { search, sort = 'newest', page = 1 } = req.query;
        const perPage = 10;
        const pageNum = Number(page) || 1;
        const skip = (pageNum - 1) * perPage;

        const where = {};
        if (search && search.trim() !== '') {
            const searchString = search.trim();
            where.title = {
                contains: searchString
            };
        }

        let orderBy = { createdAt: 'desc' };
        if (sort === 'oldest') {
            orderBy = { createdAt: 'asc' };
        }

        const [announcements, total] = await Promise.all([
            prisma.announcement.findMany({
                where,
                orderBy,
                skip,
                take: perPage
            }),
            prisma.announcement.count({ where })
        ]);

        const totalPages = Math.ceil(total / perPage) || 1;

        res.render('index', {
            announcements,
            categoryMap,
            search: search || '',
            sort,
            currentPage: pageNum,
            totalPages
        });
    } catch (error) {
        next(error);
    }
});

app.get('/announcements', (req, res) => {
    res.render('new', { errors: {}, data: null });
});

app.post('/announcements', async (req, res, next) => {
    try {
        const { title, description, price, category, contactInfo } = req.body;
        const errors = {};

        if (!title || title.trim().length < 5) {
            errors.title = 'Назва має бути не менше 5 символів';
        } else if (title.trim().length > 100) {
            errors.title = 'Назва не повинна перевищувати 100 символів';
        }

        if (!description || description.trim().length < 10) {
            errors.description = 'Опис має бути не менше 10 символів';
        }

        const validCategories = ['sale', 'service', 'job', 'other'];
        if (!category || !validCategories.includes(category)) {
            errors.category = 'Оберіть коректну категорію зі списку';
        }

        if (!price || isNaN(price) || Number(price) <= 0) {
            errors.price = 'Ціна має бути позитивним числом';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const info = contactInfo ? contactInfo.trim() : '';

        if (info.length < 5) {
            errors.contactInfo = 'Контактна інформація має бути не менше 5 символів';
        } else if (info.includes('@')) {
            if (!emailRegex.test(info)) {
                errors.contactInfo = 'Введіть коректний email (наприклад: name@example.com)';
            }
        } else {
            if (info.length < 9) {
                errors.contactInfo = 'Введіть коректний номер телефону (мін. 9 символів)';
            }
        }

        if (Object.keys(errors).length > 0) {
            return res.render('new', { errors, data: req.body });
        }

        if (Object.keys(errors).length > 0) {
            return res.render('new', { errors, data: req.body });
        }

        const newAnnouncement = await prisma.announcement.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                price: parseFloat(price),
                category,
                contactInfo: contactInfo.trim()
            }
        });

        res.redirect(`/announcements/${newAnnouncement.id}`);
    } catch (error) {
        next(error);
    }
});

app.get('/announcements/:id', async (req, res, next) => {
    try {
        const idNum = Number(req.params.id);
        if (isNaN(idNum)) {
            return res.status(404).render('404', { message: 'Некоректний ID оголошення'});
        }

        const announcement = await prisma.announcement.findUnique({
            where: { id: idNum }
        });

        if (!announcement) {
            return res.status(404).render('404', { message: 'Оголошення не знайдено' });
        }

        res.render('announcement', { announcement, categoryMap });
    } catch (error) {
        next(error);
    }
});

app.delete('/announcements/:id', async (req, res, next) => {
    try {
        const idNum = Number(req.params.id);
        if (isNaN(idNum)) {
            return res.status(400).end();
        }

        await prisma.announcement.delete({
            where: { id: idNum }
        });

        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

app.use((req, res) => {
    res.status(404).render('404', { message: 'Сторінка не знайдена' });
});

app.use((err, req, res, next) => {
    console.error('КРИТИЧНА_ПОМИЛКА_СЕРВЕРА:', err);
    res.status(500).render('error');
});

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
});