import { celebrate, Joi, Segments } from 'celebrate';

export const idParamValidator = celebrate({
    [Segments.PARAMS]: Joi.object().keys({
        id: Joi.number().integer().positive().required(),
    }),
});

export const getAnnouncementsValidator = celebrate({
    [Segments.QUERY]: Joi.object().keys({
        search: Joi.string().allow('').optional(),
        sort: Joi.string().valid('newest', 'oldest').optional(),
        page: Joi.number().integer().positive().optional(),
    }),
});

const announcementBodySchema = {
  title: Joi.string().min(5).max(100),
  description: Joi.string().min(10),
  price: Joi.number().positive(),
  category: Joi.string().valid('sale', 'service', 'job', 'other'),
  contactInfo: Joi.string().min(5),
};

export const createAnnouncementValidator = celebrate({
  [Segments.BODY]: Joi.object().keys({
    title: announcementBodySchema.title.required(),
    description: announcementBodySchema.description.required(),
    price: announcementBodySchema.price.required(),
    category: announcementBodySchema.category.required(),
    contactInfo: announcementBodySchema.contactInfo.required(),
  }),
});

export const updateAnnouncementValidator = celebrate({
  [Segments.BODY]: Joi.object().keys(announcementBodySchema).min(1),
});