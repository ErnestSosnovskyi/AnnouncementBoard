# 📜 Announcement Board REST API (Дошка оголошень з JWT-автентифікацією)

Це сучасний RESTful API для повнофункціонального сервісу розміщення та перегляду оголошень. Проєкт повністю переведений на архітектуру чистого API, який спілкується з клієнтом виключно через формат JSON.

У цій версії застосунок отримав серйозні інфраструктурні покращення: інтегровано захист від типових веб-атак, обмеження інтенсивності запитів, професійне логування подій та можливість прикріплювати фотографії до оголошень із хмарним збереженням.

## 📋 Функціональні можливості API

### 🔐 Маршрути Автентифікації (`/auth`)
1. **POST /auth/register** — Реєстрація нового користувача. Хешує пароль за допомогою `bcrypt`, автоматично видає пару токенів (`access` + `refresh`), записує `refresh` токен у базу, встановлює його в безпечну `HttpOnly` cookie та логує подію через `pino`.
2. **POST /auth/login** — Вхід у систему. Перевіряє логін/пароль, генерує нову пару токенів, замінює старий refresh-токен у базі. Подія успішного входу фіксується в логах.
3. **POST /auth/refresh** — Оновлення `access` токена. Приймає `refresh` токен з cookie або тіла запиту, реалізує **Token Rotation** (старий токен видаляється, новий записується).
4. **POST /auth/logout** — Вихід із системи. Видаляє `refresh` токен із бази даних та очищує клієнтські cookies.
5. **GET /auth/me** — Отримання профілю поточного авторизованого користувача (повертає дані без пароля).

---

### 📢 Маршрути Оголошень (`/announcements`)
1. **GET /announcements** — Отримання списку оголошень (*Публічний*).
   * **Пошук:** Нечутливий до регістру кирилиці пошук підрядка в полі `title`.
   * **Сортування:** Параметр `sort` (`newest` або `oldest`).
   * **Пагінація:** По 10 записів на сторінку (`page`). Обчислення метаданих виконується паралельно через `Promise.all()`.
2. **GET /announcements/:id** — Отримання повної інформації про одне оголошення за його ID (*Публічний*).
3. **POST /announcements** — Створення нового оголошення (*Захищений*). Приймає дані у форматі `multipart/form-data`. Якщо передано файл зображення, він завантажується на Cloudinary, а локальний файл з `uploads/` автоматично видаляється. Поле `imageUrl` є опціональним.
4. **PATCH /announcements/:id** — Часткове оновлення оголошення (*Захищений, Ownership*). Редагувати можна **лише власні** оголошення. Підтримує заміну або додавання фотографії. Порожній запит `{}` заборонений.
5. **DELETE /announcements/:id** — Видалення оголошення (*Захищений, Ownership*). Видалити можна **лише власні** оголошення. Повертає статус `204 No Content`.

---

## 🛡️ Безпека, Логування та Інфраструктура

* **Helmet:** Автоматично встановлює безпечні HTTP-заголовки для захисту від вразливостей (XSS, Clickjacking тощо) на рівні всього застосунку.
* **CORS:** Налаштований за допомогою пакета `cors`, обмежує доступ до API та дозволяє звернення лише з доменів, зазначених у змінній оточення `ALLOWED_ORIGINS` (а також локального Swagger UI).
* **Rate Limiting:** Обмежує кількість запитів до маршрутів автентифікації (`/auth/*`) — не більше 10 запитів з однієї IP-адреси за 15 хвилин. При перевищенні ліміту повертає HTTP статус `429`.
* **Логування (Pino):** Централізоване структуроване логування реалізовано через пакети `pino` та `pino-http`. Усі HTTP-запити логуються автоматично, а ключові події (реєстрація, вхід, створення оголошень, завантаження медіа) фіксуються в контролерах.

---

## 🛠 Технологічний стек

* **Runtime:** Node.js (ES-Modules, `"type": "module"`)
* **Web Framework:** Express 5
* **ORM & Database:** SQLite + Prisma ORM
* **Security & Infrastructure:** `helmet`, `cors`, `express-rate-limit`
* **Logging:** `pino`, `pino-http`, `pino-pretty`
* **File Uploads:** `multer` (локальний буфер) + `cloudinary` SDK (хмарне сховище)
* **Validation:** celebrate / Joi
* **API Documentation:** Swagger UI (`swagger-ui-express`, `swagger-jsdoc`)

---

## ⚙️ Інструкція зі встановлення та запуску

### 1. Встановлення залежностей
Клонуйте репозиторій та встановіть усі необхідні пакети:

```bash
git clone [https://github.com/ErnestSosnovskyi/AnnouncementBoard.git](https://github.com/ErnestSosnovskyi/AnnouncementBoard.git)
cd AnnouncementBoard
npm install
```

---

### 2. Налаштування змінних оточення

Створіть або оновіть файл .env у корені проєкту:

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_super_secret_access_key_2026"
JWT_REFRESH_SECRET="your_even_more_secure_refresh_key_2026"

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

---

### 3. Налаштування бази даних та міграція

Для додавання опціонального поля `imageUrl` до моделі оголошень та синхронізації БД виконайте міграцію:

```bash
npm run prisma:migrate
```

---

### 4. Запуск сервера

Запустіть сервер у режимі розробки:

```bash
npm run dev
```

---

## 📑 Тестування та документація API
### 🌐 Інтерактивна документація Swagger

Вся документація до ендпоінтів адаптована під роботу з форматом multipart/form-data для завантаження медіафайлів.

👉 http://localhost:3000/api-docs

---

### ⚡ Файл запитів `requests.http`
За допомогою розширення REST Client для VS Code у файлі `requests.http` ви можете протестувати:

* Rate Limiting: Блок запитів, який симулює перевищення ліміту (повертає статус `429`).
* Multipart завантаження: Запити створення та оновлення оголошень з передачею файлу зображення (`< ./bike.jpg`).
* Ownership та валідацію: Спроби редагування чужих або невалідних оголошень.

---

## 📂 Структура проєкту

```Plaintext
announcement-board/
├── prisma/
│   ├── schema.prisma           # Схема БД з опціональним полем imageUrl в Announcement
│   ├── client.js               # Експорт ініціалізованого Prisma Client
│   └── migrations/             # Історія міграцій бази даних
├── src/
│   ├── controllers/
│   │   ├── announcements.controller.js  # Логіка оголошень з Cloudinary та fs.promises.unlink
│   │   └── auth.controller.js           # Логіка JWT, bcrypt та логування подій автентифікації
│   ├── routes/
│   │   ├── announcements.routes.js      # Маршрути оголошень з інтеграцією upload.single()
│   │   └── auth.routes.js               # Маршрути автентифікації
│   ├── validators/
│   │   ├── announcements.validators.js  # Схеми валідації оголошень
│   │   └── auth.validators.js           # Валідація Joi для реєстрації та входу
│   ├── middleware/
│   │   ├── auth.middleware.js           # Перевірка Bearer JWT токена
│   │   └── upload.middleware.js         # Конфігурація Multer для локального сховища uploads/
│   └── logger.js                        # Централізована ініціалізація логера pino
├── uploads/                     # Тимчасова папка для завантаження файлів (ігнорується git)
├── app.js                      # Точка входу, інтеграція helmet, cors, rate-limit та pinoHttp
├── requests.http               # Повний набір HTTP-запитів для тестування (включаючи multipart та rate-limit)
├── .env                        # Секрети та налаштування оточення
└── package.json                # Скрипти запуску та залежності
```