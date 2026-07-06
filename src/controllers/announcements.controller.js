import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../../prisma/client.js';
import logger from '../logger.js';
import createHttpError from 'http-errors';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getAnnouncements = async(req, res) => {
    const { search, sort, page } = req.query;
    const perPage = 10;
    const currentPage = page ? Number(page) : 1;
    const skip = (currentPage - 1) * perPage;

    let where = {};
    if (search && search.trim() !== '') {
      const searchString = search.trim();
      
      // Створюємо варіант з великої літери (наприклад, "Продам") та з маленької ("продам")
      const capitalized = searchString.charAt(0).toUpperCase() + searchString.slice(1);
      const lowercased = searchString.charAt(0).toLowerCase() + searchString.slice(1);

      where = {
        OR: [
          { title: { contains: searchString } },
          { title: { contains: capitalized } },
          { title: { contains: lowercased } }
        ]
      };
    }
    
    const orderBy = {
        createdAt: sort === 'oldest' ? 'asc' : 'desc',
    };

    const [data, total] = await Promise.all([
        prisma.announcement.findMany({
            where,
            orderBy,
            skip,
            take: perPage,
        }),
        prisma.announcement.count({ where }),
    ]);

    const totalPages = Math.ceil(total/perPage) || 1;

    res.json({
        data,
        pagination: {
            total,
            page: currentPage,
            totalPages,
            perPage,
        }
    });
};

export const getAnnouncementById = async (req, res) => {
  const id = Number(req.params.id);
  
  const announcement = await prisma.announcement.findUniqueOrThrow({
    where: { id },
  });

  res.json(announcement);
};

export const createAnnouncement = async (req, res, next) => {
  let tempFilePath = null;
  try {
    let imageUrl = null;

    if (req.file) {
      tempFilePath = req.file.path;
      logger.info({ filename: req.file.filename }, 'Завантаження фото на Cloudinary...');
      const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
        folder: 'announcements',
      });
      imageUrl = uploadResult.secure_url;
      logger.info({ imageUrl }, 'Фото успішно завантажено на Cloudinary');

      await fs.promises.unlink(tempFilePath);
      tempFilePath = null;
    }

    const { title, description, price, category, contactInfo } = req.body;

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        category,
        contactInfo,
        imageUrl,
        userId: req.user.id
      },
    });
    logger.info({ announcementId: newAnnouncement.id }, 'Оголошення успішно створено');
    res.status(201).json(newAnnouncement);
  } catch (error) {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch(e) {}
    }
    next(error);
  }
};

export const updateAnnouncement = async (req, res, next) => {
  let tempFilePath = null;
  try {
    const id = Number(req.params.id);

    if ((!req.body || Object.keys(req.body).length === 0) && !req.file) {
      return res.status(400).json({ 
        error: 'Тіло запиту не може бути порожнім. Передайте хоча б одне поле для оновлення.' 
      });
    }
    
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      return next(createHttpError(404, 'Announcement not found'));
    }
    if (announcement.userId !== req.user.id) {
      return next(createHttpError(403, 'Access denied'));
    }

    let updateData = { ...req.body };

    if (req.file) {
      tempFilePath = req.file.path;
      logger.info({ filename: req.file.filename }, 'Оновлення фото: завантаження на Cloudinary...');
      
      const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
        folder: 'announcements',
      });
      
      updateData.imageUrl = uploadResult.secure_url;
      logger.info({ imageUrl: updateData.imageUrl }, 'Нове фото завантажено на Cloudinary');

      await fs.promises.unlink(tempFilePath);
      tempFilePath = null;
    }

    if (updateData.price) updateData.price = parseFloat(updateData.price);

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    logger.info({ announcementId: id}, 'Оголошення успішно оновлено');
    res.json(updatedAnnouncement);
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) {
      return next(createHttpError(404, 'Announcement not found'));
    }
    if (announcement.userId !== req.user.id) {
      return next(createHttpError(403, 'Access denied'));
    }

    await prisma.announcement.delete({
      where: { id },
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};