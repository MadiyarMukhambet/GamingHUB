# Gaming World Project

## Overview
Gaming World is a web-based platform designed to deliver the latest gaming news, reviews, and tools such as a BMI calculator. The project utilizes a combination of modern web technologies to create an engaging user experience.

## Features
1. **News Section**: Display of the latest gaming news articles with interactive comments.
2. **BMI Calculator**: A tool to calculate BMI with a history feature for tracking past calculations.
3. **Upcoming Games and Popular Titles**: Sections showcasing anticipated games and top titles.
4. **Responsive Design**: Optimized for various devices using Bootstrap.

## Technologies Used
- **Frontend**:
  - HTML, CSS, JavaScript
  - Bootstrap 5 for responsive design
- **Backend**:
  - Node.js with Express.js
- **Database**:
  - JSON-based storage for BMI history (extendable to database solutions like MongoDB or PostgreSQL)

## Project Structure
```
project-root/
|-- public/
|   |-- css/
|   |   |-- styles.css
|   |-- img/
|   |   |-- steam.jpg
|   |   |-- nier.png
|   |   |-- dreadout.jpg
|-- routes/
|   |-- bmiRoutes.js
|-- views/
|-- app.js
|-- package.json
```

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd project-root
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## API Endpoints
### POST `/bmicalculator`
- **Description**: Calculate BMI based on user input.
- **Request Body**:
  ```json
  {
    "age": 25,
    "gender": "male",
    "height": 180,
    "weight": 75
  }
  ```
- **Response**:
  ```json
  {
    "bmi": 23.15,
    "message": "Normal weight"
  }
  ```

### GET `/bmi-history`
- **Description**: Retrieve the history of BMI calculations.
- **Response**:
  ```json
  [
    {
      "timestamp": "2024-12-28T10:30:00Z",
      "bmi": 23.15,
      "message": "Normal weight",
      "age": 25,
      "gender": "male"
    }
  ]
  ```

## Contribution
Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request describing your changes.

## License
This project is licensed under the MIT License. See `LICENSE` for details.

## Acknowledgments
- Bootstrap for responsive design components.
- Node.js and Express.js for backend development.
- All contributors who provided feedback and inspiration for this project.

## Danel
Weather API

Endpoint

GET /api/weather

Description

This API fetches the current weather information for a specified city using the OpenWeather API.

Query Parameters

city (optional): The name of the city to get the weather for. If not provided, it defaults to Astana.

Example Request

GET /api/weather?city=Astana

Example Response

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

Notes

Ensure you have a valid OpenWeather API key configured in the server.

The response includes detailed weather information, such as temperature, humidity, wind speed, and weather description.

## Madi
Platforms API

Endpoint

GET /api/platforms

Description

This API retrieves a list of available platforms.

Example Response

[
  { "id": 1, "name": "Platform 1" },
  { "id": 2, "name": "Platform 2" }
]

## Madiyar
Games API

Endpoint

GET /api/games

Description

This API retrieves a list of games.

Example Response

