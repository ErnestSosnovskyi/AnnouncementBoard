# 📜 Announcement Board REST API (Дошка оголошень)

Це сучасний RESTful API для повнофункціонального сервісу розміщення та перегляду оголошень. Проєкт повністю переведений з архітектури SSR (EJS) на чистий API, який спілкується з клієнтом виключно через формат JSON.

Проєкт реалізовано з використанням Express 5, Prisma ORM, celebrate (Joi) для серверної валідації та Swagger для автоматичної генерації інтерактивної документації.

## 📋 Функціональні можливості API

1. **GET /announcements** — Отримання списку оголошень.
   * **Пошук:** Нечутливий до регістру кирилиці пошук підрядка в полі `title`.
   * **Сортування:** Параметр `sort` (`newest` або `oldest`).
   * **Пагінація:** По 10 записів на сторінку (параметр `page`). Обчислення метаданих виконується паралельно через `Promise.all()`.
2. **GET /announcements/:id** — Отримання повної інформації про одне оголошення за його ID.
3. **POST /announcements** — Створення нового оголошення з повною серверною валідацією.
4. **PATCH /announcements/:id** — Часткове оновлення оголошення (можна змінювати будь-яку підмножину полів, порожній запит `{}` заборонений).
5. **DELETE /announcements/:id** — Видалення оголошення з поверненням правильного HTTP-статусу `204 No Content`.

---

## 🛠 Технологічний стек

* **Runtime:** Node.js (ES-Modules, `"type": "module"`)
* **Web Framework:** Express 5
* **Validation:** celebrate / Joi
* **API Documentation:** Swagger UI (`swagger-ui-express`, `swagger-jsdoc`)
* **ORM:** Prisma
* **Database:** SQLite

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

### 2. Налаштування бази даних та міграція

Проєкт використовує Prisma ORM з кастомним шляхом генерації клієнта. Для створення структури локальної бази даних SQLite виконайте міграцію:

```bash
npm run prisma:migrate
```

---

### 3. Запуск сервера

Запустіть сервер у режимі розробки (`nodemon` автоматично відстежуватиме зміни у файлах):

```bash
npm run dev
```

Після успішного запуску сервер працюватиме за адресою: http://localhost:3000.

---

## 📑 Тестування та документація API

### 🌐 Інтерактивна документація Swagger

Вся документація до ендпоінтів генерується автоматично. Після запуску сервера вона доступна прямо у браузері:

👉 http://localhost:3000/api-docs

Там ви можете переглянути схеми запитів та протестувати кожен маршрут (включаючи POST та PATCH) через кнопку "Try it out".

### ⚡ Файл запитів `requests.http`

У корені проєкту знаходиться файл `requests.http`. Якщо ви використовуєте розширення **REST Client** у *VS Code*, ви можете тестувати всі 5 маршрутів (включаючи валідні, невалідні та 404 кейси) безпосередньо з редактора коду, натискаючи кнопку Send Request.

## 📂 Структура проєкту

```Plaintext
announcement-board/
├── prisma/
│   ├── schema.prisma       # Схема БД (модель Announcement з полем updatedAt)
│   ├── client.js           # Експорт ініціалізованого Prisma Client
│   └── migrations/         # Історія міграцій бази даних
├── src/
│   ├── controllers/        # Бізнес-логіка (announcements.controller.js)
│   ├── routes/             # Маршрути ендпоінтів (announcements.routes.js)
│   └── validators/         # Celebrate/Joi схеми (announcements.validators.js)
├── app.js                  # Точка входу, конфігурація Swagger, Error Handlers
├── requests.http           # Приклади HTTP-запитів для швидкого тестування
├── .env                    # Шлях до бази даних (DATABASE_URL)
└── package.json            # Скрипти запуску та залежності
```

## 🛡 Валідація даних (celebrate / Joi)

* title — рядок, обов'язковий (для POST), від 5 до 100 символів.
* description — рядок, обов'язковий (для POST), мінімум 10 символів.
* price — число, обов'язкове (для POST), строго більше нуля.
* category — рядок, обов'язковий (для POST), одне зі значень: sale, service, job, other.
* contactInfo — рядок, обов'язковий (для POST), мінімум 5 символів.

При помилках валідації `celebrate` автоматично перехоплює запит і повертає клієнту зрозумілий JSON-об'єкт помилки зі статусом `400 Bad Request`. При відсутності ID у базі даних глобальний Error Handler повертає `404 Not Found`.