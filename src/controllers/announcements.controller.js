import prisma from '../../prisma/client.js';

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

export const createAnnouncement = async (req, res) => {
  const newAnnouncement = await prisma.announcement.create({
    data: req.body,
  });

  res.status(201).json(newAnnouncement);
};

export const updateAnnouncement = async (req, res) => {
  const id = Number(req.params.id);

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ 
      error: 'Тіло запиту не може бути порожнім. Передайте хоча б одне поле для оновлення.' 
    });
  }

  const updatedAnnouncement = await prisma.announcement.update({
    where: { id },
    data: req.body,
  });

  res.json(updatedAnnouncement);
};

export const deleteAnnouncement = async (req, res) => {
  const id = Number(req.params.id);

  await prisma.announcement.delete({
    where: { id },
  });

  res.status(204).end();
};