# Gaming World Project
Admin accounts: Madiyar, Danel, Madi
Passwords: admin 
## Overview
Gaming World is a web-based platform designed to deliver the latest gaming news, reviews, and tools to gamers. The project utilizes modern web technologies to provide an engaging user experience and includes an admin panel for managing content.

## Features
1. **News Section**:  
   - Displays the latest gaming news articles.
   - News posts are shown as interactive cards featuring a Bootstrap carousel for images, along with titles and descriptions in two languages.
2. **Admin Panel (CRUD for Items)**:  
   Administrators can manage news posts (items) through the admin panel:
   - **Create**:  
     - Navigate to `/admin/items/new` to access a form for creating a new item.
     - The form collects 3 image URLs, two titles (e.g., English and Russian), and two descriptions.
     - Upon submission, a POST request is sent to `/admin/items` to create and save the new item.
   - **Read**:  
     - View a list of items at `/admin/items`. Only items that have not been soft-deleted (i.e., where `deletedAt` is null) are displayed.
   - **Update**:  
     - Each item in the list includes an "Edit" button. Clicking it navigates to `/admin/items/:id/edit`, where the form is pre-populated with the current item data.
     - After editing, a PUT request is sent to `/admin/items/:id` to update the item.
   - **Delete**:  
     - Each item also has a "Delete" button. When pressed, a DELETE request is sent to `/admin/items/:id`.
     - Instead of physically removing the item, a soft delete is performed by setting a `deletedAt` timestamp.

3. **Localization**:  
   - Users can switch the display language between English and Russian via the `/change-language` route. The front-end renders titles and descriptions based on the selected language.

4. **Additional Tools & APIs**:  
   - **BMI Calculator**: Calculate Body Mass Index (BMI) with history tracking.
   - **Weather API (Danel)**: Fetch current weather information for a specified city using the OpenWeather API.
   - **Platforms API (Madi)**: Retrieve a list of available gaming platforms.
   - **Games API (Madiyar)**: Retrieve a list of games.
5. **Responsive Design**:  
   - The site is optimized for various devices using Bootstrap 5.

## Technologies Used
- **Frontend**:
  - HTML, CSS, JavaScript
  - Bootstrap 5 for responsive design
  - EJS for templating
- **Backend**:
  - Node.js with Express.js
  - Mongoose for MongoDB integration
  - Axios for external API requests
  - express-session, method-override for middleware support
- **Database**:
  - MongoDB (via Mongoose)
- **Other Dependencies**:
  - bcryptjs for password hashing
  - i18n for localization (if used)
  - crypto for generating invite codes

## Project Structure
GamingHUB/
├── app.js                 # Главный файл приложения
├── package.json           # Зависимости и скрипты
├── .env                   # Файл переменных окружения
├── models/
│   ├── item.js            # Модель элемента (с полями: images, name_en, name_ru, description_en, description_ru, timestamps, deletedAt)
│   ├── invite.js          # Модель для invite-кодов (если используется)
│   ├── quiz.js            # Модель викторины
│   ├── User.js            # Модель пользователя (username, password, isAdmin, createdAt, updatedAt)
│   └── ...                # Другие модели (Inventory, History и т.д.)
├── routes/
│   ├── adminItems.js      # Маршруты админ-панели для элементов (CRUD)
│   ├── gameRoutes.js      # API маршруты для игр
│   ├── platfRoutes.js     # API маршруты для платформ
│   ├── History.js         # Маршрут для истории API запросов
│   └── ...                # Другие маршруты (quiz, auth, inventory, discounts, и т.д.)
├── utils/
│   └── i18n.js            # Файл для локализации (если используется)
├── views/
│   ├── index.ejs          # Главная страница с блоком новых постов (элементов) и каруселями
│   ├── login.ejs          # Страница логина
│   ├── register.ejs       # Страница регистрации
│   ├── admin/
│   │   ├── items.ejs      # Страница списка элементов (CRUD) для админов
│   │   ├── new-item.ejs   # Форма для создания нового элемента
│   │   └── edit-item.ejs  # Форма для редактирования элемента
│   └── bloks/
│       ├── header.ejs     # Общий header (включает подключение стилей, meta и т.д.)
│       ├── nav.ejs        # Навигационное меню
│       └── footer.ejs     # Футер
└── public/
    ├── css/
    │   ├── styles.css     # Общие стили
    │   ├── pink.css       # Дополнительная тема (pink)
    │   └── admin.css      # Стили для админ-панели
    └── img/               # Изображения для новостей и прочее

bash
Copy
Edit

## Installation
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd project-root
Install dependencies:
bash
Copy
Edit
npm install
Set up environment variables: Create a .env file in the project root and add:
env
Copy
Edit
PORT=3000
MONGO_CONNECT=<your-mongo-connection-string>
SECRET_KEY=your-secret-key
Start the server:
bash
Copy
Edit
npm start
Access the application: Open your browser and navigate to http://localhost:3000
API Endpoints
BMI Calculator
POST /bmicalculator

Description: Calculates BMI based on user input.
Request Body:
json
Copy
Edit
{
  "age": 25,
  "gender": "male",
  "height": 180,
  "weight": 75
}
Response:
json
Copy
Edit
{
  "bmi": 23.15,
  "message": "Normal weight"
}
GET /bmi-history

Description: Retrieves the history of BMI calculations.
Response:
json
Copy
Edit
[
  {
    "timestamp": "2024-12-28T10:30:00Z",
    "bmi": 23.15,
    "message": "Normal weight",
    "age": 25,
    "gender": "male"
  }
]
Weather API (Danel)
GET /api/weather

Description: Fetches the current weather information for a specified city using the OpenWeather API. If no city is provided, defaults to Astana.
Query Parameters:
city (optional): Name of the city.
Example Request:
bash
Copy
Edit
GET /api/weather?city=Astana
Example Response:
json
Copy
Edit
{
  "coord": { "lon": 71.4278, "lat": 51.1801 },
  "weather": [
    {
      "id": 800,
      "main": "Clear",
      "description": "clear sky",
      "icon": "01d"
    }
  ],
  "base": "stations",
  "main": {
    "temp": 22.5,
    "feels_like": 21.7,
    "temp_min": 22.5,
    "temp_max": 22.5,
    "pressure": 1012,
    "humidity": 45
  },
  "visibility": 10000,
  "wind": { "speed": 3.09, "deg": 220 },
  "clouds": { "all": 0 },
  "dt": 1618329600,
  "sys": {
    "type": 1,
    "id": 1234,
    "country": "KZ",
    "sunrise": 1618281600,
    "sunset": 1618333200
  },
  "timezone": 21600,
  "id": 1526273,
  "name": "Astana",
  "cod": 200
}
Platforms API (Madi)
GET /api/platforms

Description: Retrieves a list of available gaming platforms.
Example Response:
json
Copy
Edit
[
  { "id": 1, "name": "Platform 1" },
  { "id": 2, "name": "Platform 2" }
]
Games API (Madiyar)
GET /api/games

Description: Retrieves a list of games.
Example Response:
json
Copy
Edit
[
  { "id": 1, "name": "Game 1" },
  { "id": 2, "name": "Game 2" }
]
Admin Panel (CRUD for Items)
Administrators can manage news posts (items) via the admin panel. Each item includes:

Images: An array of exactly 3 image URLs (displayed as a carousel on the main page).
Titles: Two titles for localization (e.g., English and Russian).
Descriptions: Two descriptions for localization.
Timestamps: Automatically managed createdAt and updatedAt, and a deletedAt field for soft deletion.
CRUD Operations:
Create:
GET /admin/items/new – Displays a form for adding a new item.
POST /admin/items – Processes the form and creates the new item in the database.
Read:
GET /admin/items – Displays a list of all items (excluding those with a non-null deletedAt).
Update:
GET /admin/items/:id/edit – Displays a form pre-populated with the item's data.
PUT /admin/items/:id – Processes the update and saves changes.
Delete:
DELETE /admin/items/:id – Performs a soft delete by setting the deletedAt timestamp.
Contribution
Contributions are welcome! To contribute:

Fork the repository.
Create a new branch for your feature or bugfix.
Submit a pull request describing your changes.