const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const app = express();
const bcrypt = require("bcrypt");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DreamFoodX API',
      version: '1.0.0',
    },
  },
  apis: ['./src/index.js']
};

const swaggerSpec = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const db = mysql.createConnection({
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "dreamfoodx_db",
});

function connectWithRetry() {
  db.connect((err) => {
    if (err) {
      console.error("Błąd połączenia z bazą, ponawiam próbę...", err);
      setTimeout(connectWithRetry, 5000);
    } else {
      console.log("Połączono z bazą danych.");
    }
  });
}

connectWithRetry();

// Endpoint do rejestracji
/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Rejestracja nowego użytkownika
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: exampleUser
 *               email:
 *                 type: string
 *                 format: email
 *                 example: exampleUser@example.com
 *               password:
 *                 type: string
 *                 example: examplePassword
 *     responses:
 *       201:
 *         description: Użytkownik zarejestrowany pomyślnie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Użytkownik zarejestrowany
 *                 username:
 *                   type: string
 *                   example: exampleUser
 *       400:
 *         description: Brak danych lub login/email już w użyciu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login lub email już w użyciu.
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Błąd serwera 
 */
app.post("/api/register", async (req, res) => {
  console.log("recived register req:", req);
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Brak danych" });
  }

  try {
    const [emailResult] = await db
      .promise()
      .execute("SELECT id FROM users WHERE email = ?", [email]);

    const [usernameResult] = await db
      .promise()
      .execute("SELECT id FROM users WHERE username = ?", [username]);

    if (emailResult.length > 0 || usernameResult.length > 0) {
      return res.status(400).json({ message: "Login lub email już w użyciu." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query =
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    db.query(query, [username, email, hashedPassword], (err) => {
      if (err) {
        console.error("Błąd przy zapisie:", err);
        return res.status(500).json({ message: "Błąd serwera" });
      }
      return res
        .status(201)
        .json({ message: "Użytkownik zarejestrowany", username: username });
    });
  } catch (err) {
    console.error("Błąd przy rejestracji:", err);
    return res.status(500).json({ message: "Błąd hashowania hasła " });
  }
});

// Endpoint do logowania
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Logowanie użytkownika
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: exampleUser@example.com
 *               password:
 *                 type: string
 *                 example: examplePassword
 *     responses:
 *       200:
 *         description: Zalogowano pomyślnie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Zalogowano pomyślnie
 *                 username:
 *                   type: string
 *                   example: exampleUser
 *       400:
 *         description: Brak danych
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Brak danych
 *       401:
 *         description: Nieprawidłowy login lub hasło
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Nieprawidłowy login lub hasło
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Błąd serwera
 */
app.post("/api/login", async (req, res) => {
  console.log("recived login req:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Brak danych" });
  }

  try {
    const [rows] = await db
      .promise()
      .execute("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Nieprawidłowy login lub hasło" });
    }

    const user = rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Nieprawidłowy login lub hasło" });
    }
    res.setHeader("Content-Type", "application/json");
    return res
      .status(200)
      .json({ message: "Zalogowano pomyślnie", username: user.username });
  } catch (err) {
    console.error("Błąd przy logowaniu:", err);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Pobieranie najwyżej ocenianych przepisów
/**
 * @swagger
 * /api/recipes/best:
 *   get:
 *     summary: Pobierz 5 najwyżej ocenianych przepisów
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Lista najlepszych przepisów
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 12
 *                   title:
 *                     type: string
 *                     example: "Kurczak"
 *                   description:
 *                     type: string
 *                     example: "Dobry przepis na kurczaka"
 *                   author:
 *                     type: string
 *                     example: "exampleUser"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-06-17T10:45:00Z"
 *                   rating:
 *                     type: number
 *                     format: float
 *                     example: 4.7
 *                   image:
 *                     type: string
 *                     example: "uploads/example.jpg"
 *       500:
 *         description: Błąd serwera
 */
app.get("/api/recipes/best", async (req, res) => {
  try {
    const query = `
    SELECT * FROM recipes
    WHERE rating IS NOT NULL
    ORDER BY rating DESC
    LIMIT 5; 
    `;
    const [rows] = await db.promise().execute(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Błąd przy pobieraniu najlepszych przepisów:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Pobieranie najnowszych przepisów
/**
 * @swagger
 * /api/recipes/latest:
 *   get:
 *     summary: Pobierz 5 najnowszych przepisów
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Lista najnowszych przepisów
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 15
 *                   title:
 *                     type: string
 *                     example: "Kurczak"
 *                   description:
 *                     type: string
 *                     example: "Dobry przepis na kurczaka"
 *                   author:
 *                     type: string
 *                     example: "exampleUser"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-06-17T10:45:00Z"
 *                   rating:
 *                     type: number
 *                     format: float
 *                     example: 4.7
 *                   image:
 *                     type: string
 *                     example: "uploads/example.jpg"
 *       500:
 *         description: Błąd serwera
 */
app.get("/api/recipes/latest", async (req, res) => {
  try {
    const query = `
    SELECT * FROM recipes
    ORDER BY created_at DESC
    LIMIT 5; 
    `;
    const [rows] = await db.promise().execute(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Błąd przy pobieraniu najnowszych przepisów:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Pobieranie przepisów użytkownika
/**
 * @swagger
 * /api/recipes/user:
 *   get:
 *     summary: Pobierz przepisy konkretnego użytkownika
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Nazwa użytkownika, którego przepisy chcesz pobrać
 *         example: exampleUser
 *     responses:
 *       200:
 *         description: Lista przepisów użytkownika
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 12
 *                   title:
 *                     type: string
 *                     example: "Kurczak"
 *                   description:
 *                     type: string
 *                     example: "Dobry przepis na kurczaka"
 *                   author:
 *                     type: string
 *                     example: "exampleUser"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-06-17T10:45:00Z"
 *                   rating:
 *                     type: number
 *                     format: float
 *                     example: 4.7
 *                   image:
 *                     type: string
 *                     example: "uploads/example.jpg"
 *       400:
 *         description: Brak nazwy użytkownika w zapytaniu
 *       500:
 *         description: Błąd serwera
 */
app.get("/api/recipes/user", async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ message: "Brakuje nazwy użytkownika." });
  }

  try {
    const query =
      "SELECT * FROM recipes WHERE author = ? ORDER BY created_at DESC";
    const [rows] = await db.promise().execute(query, [username]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Błąd przy pobieraniu przepisów użytkownika:", err);
    res
      .status(500)
      .json({ message: "Błąd serwera przy pobieraniu przepisów użytkownika." });
  }
});

// Pobieranie przepisów z po wyszukiwaniu
/**
 * @swagger
 * /api/recipes/search:
 *   get:
 *     summary: Wyszukaj przepisy po nazwie
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Część nazwy przepisu do wyszukania
 *         example: "kurcz"
 *     responses:
 *       200:
 *         description: Lista przepisów pasujących do zapytania
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 12
 *                   title:
 *                     type: string
 *                     example: "Kurczak"
 *                   description:
 *                     type: string
 *                     example: "Dobry przepis na kurczaka"
 *                   author:
 *                     type: string
 *                     example: "exampleUser"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-06-17T10:45:00Z"
 *                   rating:
 *                     type: number
 *                     format: float
 *                     example: 4.7
 *                   image:
 *                     type: string
 *                     example: "uploads/example.jpg"
 *       400:
 *         description: Brak nazwy przepisu w zapytaniu
 *       404:
 *         description: Nie znaleziono przepisów
 *       500:
 *         description: Błąd serwera
 */
app.get("/api/recipes/search", async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res
      .status(400)
      .json({ message: "Brak nazwy przepisu w zapytaniu." });
  }

  try {
    const query = `
    SELECT * FROM recipes
    WHERE title LIKE ?
    ORDER BY created_at DESC;
    `;
    const [rows] = await db.promise().execute(query, [`%${name}%`]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Nie znaleziono przepisów." });
    }

    res.status(200).json(rows);
  } catch (err) {
    console.error("Błąd przy wyszukiwanie przepisów:", err);
    res
      .status(500)
      .json({ message: "Błąd serwera przy wyszukiwaniu przepisów." });
  }
});

// Pobieranie przepisu po ID
/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Pobierz szczegóły przepisu wraz z krokami i składnikami
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID przepisu do pobrania
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Szczegóły przepisu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 title:
 *                   type: string
 *                   example: "Kurczak"
 *                 description:
 *                   type: string
 *                   example: "Dobry przepis na kurczaka"
 *                 author:
 *                   type: string
 *                   example: "exampleUser"
 *                 image:
 *                   type: string
 *                   example: "uploads/example.jpg"
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 5
 *                       order:
 *                         type: integer
 *                         example: 1
 *                       type:
 *                         type: string
 *                         example: "action"
 *                       action:
 *                         type: string
 *                         example: "siekanie"
 *                       description:
 *                         type: string
 *                         example: "Posiekaj kurczaka"
 *                       temperature:
 *                         type: integer
 *                         nullable: true
 *                         example: 60
 *                       bladeSpeed:
 *                         type: integer
 *                         nullable: true
 *                         example: 3
 *                       duration:
 *                         type: integer
 *                         nullable: true
 *                         example: 5
 *                       ingredients:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "kurczak"
 *                             amount:
 *                               type: number
 *                               nullable: true
 *                               example: 200
 *                             unit:
 *                               type: string
 *                               nullable: true
 *                               example: "g"
 *       404:
 *         description: Przepis nie znaleziony
 *       500:
 *         description: Błąd serwera
 */
app.get("/api/recipes/:id", async (req, res) => {
  const recipeId = req.params.id;

  try {
    const [recipeResults] = await db
      .promise()
      .execute(
        "SELECT id, title, description, author, image FROM recipes WHERE id = ?",
        [recipeId]
      );
    if (recipeResults.length === 0) {
      return res.status(404).json({ message: "Przepis nie znaleziony." });
    }
    const recipe = recipeResults[0];

    const [stepResults] = await db.promise().execute(
      "SELECT id, step_order, type, action, description, temperature, blade_speed, duration FROM steps WHERE recipe_id = ? ORDER BY step_order",
      [recipeId]
    );

    for (let step of stepResults) {
      const [ingredientResults] = await db
        .promise()
        .execute(
          "SELECT name, amount, unit FROM step_ingredients WHERE step_id = ?",
          [step.id]
        );
      step.ingredients = ingredientResults.map(row => ({
        name: row.name,
        amount: row.amount,
        unit: row.unit
      }));
    }

    recipe.steps = stepResults.map(row => ({
      id: row.id,
      order: row.step_order,
      type: row.type,
      action: row.action,
      description: row.description,
      temperature: row.temperature,
      bladeSpeed: row.blade_speed,
      duration: row.duration,
      ingredients: row.ingredients
    }));

    res.json(recipe);
  } catch (err) {
    console.error("Błąd serwera:", err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

// Pobieranie czy juz oceniliśmy przepis
/**
 * @swagger
 * /api/recipes/{id}/check-already-rated:
 *   get:
 *     summary: Sprawdź, czy użytkownik ocenił już przepis
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID przepisu
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: username
 *         required: true
 *         description: Nazwa użytkownika
 *         schema:
 *           type: string
 *           example: "exampleUser"
 *     responses:
 *       200:
 *         description: Status oceny przepisu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alreadyRated:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Brak nazwy użytkownika
 *       500:
 *         description: Błąd serwera
 */
app.get("/api/recipes/:id/check-already-rated", async (req, res) => {
  const { id } = req.params;
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ message: "Brak nazwy użytkownika" });
  }

  try {
    const [ratingCheck] = await db
      .promise()
      .execute(
        "SELECT * FROM ratings WHERE recipe_id = ? AND user_id = (SELECT id FROM users WHERE username = ?)",
        [id, username]
      );

    if (ratingCheck.length > 0) {
      return res.status(200).json({ alreadyRated: true });
    } else {
      return res.status(200).json({ alreadyRated: false });
    }
  } catch (err) {
    console.error("Błąd przy sprawdzaniu oceny:", err);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

// Pobieranie oceny użytkownika
/**
 * @swagger
 * /api/recipes/{id}/user-rating:
 *   get:
 *     summary: Pobierz ocenę użytkownika dla przepisu
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID przepisu
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: username
 *         required: true
 *         description: Nazwa użytkownika
 *         schema:
 *           type: string
 *           example: "exampleUser"
 *     responses:
 *       200:
 *         description: Ocena użytkownika lub null jeśli brak oceny
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rating:
 *                   type: number
 *                   nullable: true
 *                   example: 4
 *       400:
 *         description: Brak nazwy użytkownika
 *       404:
 *         description: Użytkownik nie znaleziony
 *       500:
 *         description: Błąd serwera
 */
app.get("/api/recipes/:id/user-rating", async (req, res) => {
  const { id } = req.params;
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ message: "Brakuje nazwy użytkownika" });
  }

  try {
    const [userResult] = await db
      .promise()
      .execute("SELECT id FROM users WHERE username = ?", [username]);

    if (userResult.length === 0) {
      return res.status(404).json({ message: "Użytkownik nie znaleziony" });
    }

    const userId = userResult[0].id;

    const [ratingResult] = await db
      .promise()
      .execute(
        "SELECT rating FROM ratings WHERE user_id = ? AND recipe_id = ?",
        [userId, id]
      );

    if (ratingResult.length > 0) {
      return res.status(200).json({ rating: ratingResult[0].rating });
    } else {
      return res.status(200).json({ rating: null });
    }
  } catch (err) {
    console.error("Błąd przy pobieraniu oceny użytkownika:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Dodawanie oceny
/**
 * @swagger
 * /api/recipes/{id}/rate:
 *   post:
 *     summary: Dodaj ocenę dla przepisu
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID przepisu do oceny
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - username
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               username:
 *                 type: string
 *                 example: "exampleUser"
 *     responses:
 *       200:
 *         description: Nowa średnia ocena i liczba ocen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rating:
 *                   type: number
 *                   example: 4.5
 *                 ratingCount:
 *                   type: integer
 *                   example: 10
 *       400:
 *         description: Brak danych lub już oceniłeś ten przepis
 *       500:
 *         description: Błąd serwera
 */
app.post("/api/recipes/:id/rate", async (req, res) => {
  const { id } = req.params;
  const { rating, username } = req.body;

  if (!rating || !username) {
    return res.status(400).json({ message: "Brak wymaganych danych" });
  }

  try {
    const [existingRating] = await db
      .promise()
      .execute(
        "SELECT * FROM ratings WHERE user_id = (SELECT id FROM users WHERE username = ?) AND recipe_id = ?",
        [username, id]
      );

    if (existingRating.length > 0) {
      return res.status(400).json({ message: "Już oceniłeś ten przepis." });
    }

    const [userResult] = await db
      .promise()
      .execute("SELECT id FROM users WHERE username = ?", [username]);

    const userId = userResult[0].id;

    await db
      .promise()
      .execute(
        "INSERT INTO ratings (user_id, recipe_id, rating) VALUES (?, ?, ?)",
        [userId, id, rating]
      );

    const [ratings] = await db
      .promise()
      .execute("SELECT rating FROM ratings WHERE recipe_id = ?", [id]);

    const totalRatings = ratings.length;
    const sumRatings = ratings.reduce((sum, row) => sum + row.rating, 0);
    const averageRating = (sumRatings / totalRatings).toFixed(1);

    await db
      .promise()
      .execute("UPDATE recipes SET rating = ? WHERE id = ?", [
        averageRating,
        id,
      ]);

    return res
      .status(200)
      .json({ rating: averageRating, ratingCount: totalRatings });
  } catch (err) {
    console.error("Błąd przy ocenianiu przepisu:", err);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

// Dodawanie do ulubionych
/**
 * @swagger
 * /api/recipes/{id}/favorite:
 *   post:
 *     summary: Dodaj przepis do ulubionych
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID przepisu, który ma zostać dodany do ulubionych
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 example: "exampleUser"
 *     responses:
 *       200:
 *         description: Przepis dodany do ulubionych
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Dodano do ulubionych
 *       400:
 *         description: Brak wymaganych danych
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Brak wymaganych danych (username lub recipeId)
 *       404:
 *         description: Użytkownik nie znaleziony
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Użytkownik nie znaleziony
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Błąd serwera
 */
app.post("/api/recipes/:id/favorite", async (req, res) => {
  const { username } = req.body;
  const { id: recipeId } = req.params;

  if (!username || !recipeId) {
    return res
      .status(400)
      .json({ message: "Brak wymaganych danych (username lub recipeId)" });
  }

  try {
    const [user] = await db
      .promise()
      .execute("SELECT id FROM users WHERE username = ?", [username]);
    if (!user.length)
      return res.status(404).json({ message: "Użytkownik nie znaleziony" });

    await db
      .promise()
      .execute(
        "INSERT IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)",
        [user[0].id, recipeId]
      );

    res.status(200).json({ message: "Dodano do ulubionych" });
  } catch (err) {
    console.error("Błąd przy dodawaniu do ulubionych:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Usuwanie z ulubionych
/**
 * @swagger
 * /api/recipes/{id}/favorite:
 *   delete:
 *     summary: Usuń przepis z ulubionych użytkownika
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID przepisu do usunięcia z ulubionych
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 example: "exampleUser"
 *     responses:
 *       200:
 *         description: Przepis usunięty z ulubionych
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usunięto z ulubionych
 *       400:
 *         description: Brak wymaganych danych (username lub recipeId)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Brak wymaganych danych (username lub recipeId)
 *       404:
 *         description: Użytkownik nie istnieje lub przepis nie był w ulubionych
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Użytkownik nie znaleziony
 *       500:
 *         description: Błąd serwera przy usuwaniu z ulubionych
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Błąd serwera
 */
app.delete("/api/recipes/:id/favorite", async (req, res) => {
  const { username } = req.body;
  const { id: recipeId } = req.params;

  console.log("Otrzymane dane:", { username, recipeId });

  if (!username || !recipeId) {
    return res
      .status(400)
      .json({ message: "Brak wymaganych danych (username lub recipeId)" });
  }

  try {
    const [user] = await db
      .promise()
      .execute("SELECT id FROM users WHERE username = ?", [username]);
    if (!user.length)
      return res.status(404).json({ message: "Użytkownik nie znaleziony" });

    const result = await db
      .promise()
      .execute("DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?", [
        user[0].id,
        recipeId,
      ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Przepis nie jest w ulubionych" });
    }

    res.status(200).json({ message: "Usunięto z ulubionych" });
  } catch (err) {
    console.error("Błąd przy usuwaniu z ulubionych:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Sprawdzanie czy przepis jest ulubiony
/**
 * @swagger
 * /api/recipes/{id}/is-favorite:
 *   get:
 *     summary: Sprawdź, czy przepis jest w ulubionych użytkownika
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID przepisu
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: username
 *         required: true
 *         description: Nazwa użytkownika
 *         schema:
 *           type: string
 *           example: "exampleUser"
 *     responses:
 *       200:
 *         description: Informacja, czy przepis jest w ulubionych
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorite:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Użytkownik nie znaleziony
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Użytkownik nie znaleziony
 *       500:
 *         description: Błąd serwera przy sprawdzaniu ulubionych
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Błąd serwera
 */
app.get("/api/recipes/:id/is-favorite", async (req, res) => {
  const { username } = req.query;
  const { id: recipeId } = req.params;

  try {
    const [user] = await db
      .promise()
      .execute("SELECT id FROM users WHERE username = ?", [username]);
    if (!user.length)
      return res.status(404).json({ message: "Użytkownik nie znaleziony" });

    const [result] = await db
      .promise()
      .execute("SELECT 1 FROM favorites WHERE user_id = ? AND recipe_id = ?", [
        user[0].id,
        recipeId,
      ]);

    res.status(200).json({ isFavorite: result.length > 0 });
  } catch (err) {
    console.error("Błąd przy sprawdzaniu ulubionych:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Pobieranie ulubionych przepisów użytkownika
/**
 * @swagger
 * /api/favorites/get-favorites:
 *   get:
 *     summary: Pobierz ulubione przepisy użytkownika
 *     tags: [Favorites]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         description: Nazwa użytkownika
 *         schema:
 *           type: string
 *           example: "exampleUser"
 *     responses:
 *       200:
 *         description: Lista ulubionych przepisów
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 12
 *                   title:
 *                     type: string
 *                     example: "Kurczak"
 *                   description:
 *                     type: string
 *                     example: "Dobry przepis na kurczaka"
 *                   image:
 *                     type: string
 *                     example: "uploads/example.jpg"
 *       204:
 *         description: Brak ulubionych przepisów
 *       400:
 *         description: Brak nazwy użytkownika
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Brak nazwy użytkownika
 *       500:
 *         description: Błąd serwera przy pobieraniu ulubionych przepisów
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Błąd serwera
 */
app.get("/api/favorites/get-favorites", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ message: "Brak nazwy użytkownika" });
  }

  try {
    const [favorites] = await db.promise().execute(
      `
      SELECT r.id, r.title, r.description, r.image
      FROM favorites f
      JOIN recipes r ON f.recipe_id = r.id
      JOIN users u ON f.user_id = u.id
      WHERE u.username = ?`,
      [username]
    );

    if (favorites.length === 0) {
      return res.status(204).json([]);
    }

    res.status(200).json(favorites);
  } catch (err) {
    console.error("Błąd przy pobieraniu ulubionych przepisów:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Dodawanie przepisu
/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Dodaj nowy przepis z obrazkiem i krokami
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - description
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Kurczak"
 *               author:
 *                 type: string
 *                 example: "exampleUser"
 *               description:
 *                 type: string
 *                 example: "Dobry przepis na kurczaka"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Obrazek przepisu
 *               steps:
 *                 type: string
 *                 description: JSON-owa lista kroków
 *                 example: '[{"type":"ingredient","description":"Dodaj kurczaka","ingredients":[{"name":"Kurczak","amount":200,"unit":"g"}]},{"type":"action","description":"Siekaj","action":"cook","temperature":100,"bladeSpeed":3,"duration":10}]'
 *     responses:
 *       201:
 *         description: Przepis został dodany
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Przepis dodany!
 *                 recipeId:
 *                   type: integer
 *                   example: 42
 *       400:
 *         description: Brakuje wymaganych danych lub obrazka
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Brakuje wymaganych danych.
 *       500:
 *         description: Błąd serwera przy dodawaniu przepisu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Błąd serwera.
 */
app.post("/api/recipes", upload.single("image"), async (req, res) => {
  const { title, author, description } = req.body;

  try {
    const steps = JSON.parse(req.body.steps || "[]");
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !author || !description) {
      return res.status(400).json({ message: "Brakuje wymaganych danych." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Obrazek jest wymagany." });
    }

    const [recipeResult] = await db
      .promise()
      .execute(
        "INSERT INTO recipes (title, description, author, image) VALUES (?, ?, ?, ?)",
        [title, description, author, imagePath]
      );
    const recipeId = recipeResult.insertId;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const [stepResult] = await db.promise().execute(
        `INSERT INTO steps
        (recipe_id, step_order, type, action, description, temperature, blade_speed, duration)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recipeId,
          i + 1,
          step.type,
          step.type === 'action' ? step.action : null,
          step.description,
          step.type === 'action' ? step.temperature : null,
          step.type === 'action' ? step.bladeSpeed : null,
          step.type === 'action' ? step.duration : null,
        ]
      );

      const stepId = stepResult.insertId;

      if (step.type === 'ingredient' && step.ingredients) {
        for (const ingredient of step.ingredients) {
          await db.promise().execute(
            `INSERT INTO step_ingredients (step_id, name, amount, unit)
            VALUES (?, ?, ?, ?)`,
            [
              stepId,
              ingredient.name,
              ingredient.amount || null,
              ingredient.unit || null,
            ]
          );
        }
      }
    }

    res.status(201).json({ message: "Przepis dodany!", recipeId });
  } catch (err) {
    console.error("Błąd serwera:", err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

// Usuwanie przepisu
/**
 * @swagger
 * /api/recipes/{id}:
 *   delete:
 *     summary: Usuń przepis (oraz jego oceny i ulubione)
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID przepisu do usunięcia
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Przepis został usunięty
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Przepis został usunięty.
 *       404:
 *         description: Przepis o podanym ID nie istnieje
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Nie znaleziono przepisu do usunięcia.
 *       500:
 *         description: Błąd serwera przy usuwaniu przepisu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Błąd serwera przy usuwaniu przepisu.
 */
app.delete('/api/recipes/:id', async (req, res) => {
  const recipeId = req.params.id;

  try {    
    await db.promise().execute('DELETE FROM ratings WHERE recipe_id = ?', [recipeId]);
    await db.promise().execute('DELETE FROM favorites WHERE recipe_id = ?', [recipeId]);

    const [result] = await db.promise().execute('DELETE FROM recipes WHERE id = ?', [recipeId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Nie znaleziono przepisu do usunięcia.' });
    }

    res.json({ message: 'Przepis został usunięty.' });
  } catch (err) {
    console.error('Błąd przy usuwaniu przepisu:', err);
    res.status(500).json({ message: 'Błąd serwera przy usuwaniu przepisu.' });
  }
});

// Pobieranie kategorii i składników
/**
 * @swagger
 * /api/ingredients/categories:
 *   get:
 *     summary: Pobierz listę kategorii składników wraz z przypisanymi składnikami
 *     tags: [Ingredients]
 *     responses:
 *       200:
 *         description: Lista kategorii składników z ich elementami
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Warzywa"
 *                   items:
 *                     type: array
 *                     description: Lista nazw składników w danej kategorii
 *                     items:
 *                       type: string
 *                       example: "Marchew"
 *       500:
 *         description: Błąd serwera
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Błąd serwera
 */
app.get("/api/ingredients/categories", async (req, res) => {
  try {
    const [categories] = await db
      .promise()
      .execute("SELECT id, name FROM ingredient_categories ORDER BY name");

    const categoriesWithItems = await Promise.all(
      categories.map(async (category) => {
        const [ingredients] = await db
          .promise()
          .execute(
            "SELECT name FROM catalog_ingredients WHERE category_id = ? ORDER BY name",
            [category.id]
          );
        return {
          id: category.id,
          name: category.name,
          items: ingredients.map((i) => i.name),
        };
      })
    );

    res.json(categoriesWithItems);
  } catch (error) {
    console.error("Błąd pobierania kategorii i składników:", error);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Edytowanie przepisu
/**
 * @swagger
 * /api/recipes/{id}:
 *   put:
 *     summary: Aktualizuj przepis o podanym ID
 *     tags: [Recipes]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID przepisu do aktualizacji
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: formData
 *         name: title
 *         required: true
 *         description: Tytuł przepisu
 *         schema:
 *           type: string
 *           example: "Nowa nazwa przepisu"
 *       - in: formData
 *         name: description
 *         required: true
 *         description: Opis przepisu
 *         schema:
 *           type: string
 *           example: "Nowy opis przepisu"
 *       - in: formData
 *         name: image
 *         required: false
 *         description: Nowy obrazek przepisu (plik)
 *         schema:
 *           type: string
 *           format: binary
 *       - in: formData
 *         name: steps
 *         required: true
 *         description: Krok po kroku w formacie JSON (string)
 *         schema:
 *           type: string
 *           example: '[{"type":"action","action":"siekanie","description":"Pokrój składniki","temperature":30,"bladeSpeed":5,"duration":5},{"type":"ingredient","description":"Dodaj składniki","ingredients":[{"name":"Kurczak","amount":200,"unit":"g"}]}]'
 *     responses:
 *       200:
 *         description: Przepis zaktualizowany pomyślnie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Przepis zaktualizowany!"
 *       500:
 *         description: Błąd serwera podczas aktualizacji przepisu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Błąd serwera."
 */
app.put("/api/recipes/:id", upload.single("image"), async (req, res) => {
  const recipeId = req.params.id;
  const { title, description, steps } = req.body;

  try {
    const updateQuery = `
      UPDATE recipes
      SET title = ?, description = ?${req.file ? ", image = ?" : ""}
      WHERE id = ?
    `;
    const updateParams = req.file
      ? [title, description, `/uploads/${req.file.filename}`, recipeId]
      : [title, description, recipeId];

    await db.promise().execute(updateQuery, updateParams);

    const [oldSteps] = await db.promise().execute(
      "SELECT id FROM steps WHERE recipe_id = ?", 
      [recipeId]
    );
    
    for (const step of oldSteps) {
      await db.promise().execute(
        "DELETE FROM step_ingredients WHERE step_id = ?", 
        [step.id]
      );
    }
    
    await db.promise().execute(
      "DELETE FROM steps WHERE recipe_id = ?", 
      [recipeId]
    );

    const parsedSteps = JSON.parse(steps);
    for (let i = 0; i < parsedSteps.length; i++) {
      const step = parsedSteps[i];
      
      const [stepResult] = await db.promise().execute(
        `INSERT INTO steps
        (recipe_id, step_order, type, action, description, temperature, blade_speed, duration)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recipeId,
          i + 1,
          step.type,
          step.type === 'action' ? step.action : null,
          step.description,
          step.type === 'action' ? step.temperature : null,
          step.type === 'action' ? step.bladeSpeed : null,
          step.type === 'action' ? step.duration : null,
        ]
      );

      const stepId = stepResult.insertId;

      if ((step.type === 'ingredient' || step.type === 'action') && step.ingredients) {
        for (const ing of step.ingredients) {
          await db.promise().execute(
            `INSERT INTO step_ingredients (step_id, name, amount, unit) 
            VALUES (?, ?, ?, ?)`,
            [stepId, ing.name, ing.amount, ing.unit]
          );
        }
      }
    }

    res.json({ message: "Przepis zaktualizowany!" });
  } catch (err) {
    console.error("Błąd edycji:", err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

// Endpoint do usuwania pojedynczego kroku
/**
 * @swagger
 * /api/recipes/{recipeId}/steps/{stepOrder}:
 *   delete:
 *     summary: Usuń krok z przepisu
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         description: ID przepisu
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: path
 *         name: stepOrder
 *         required: true
 *         description: Numer kroku do usunięcia
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       200:
 *         description: Krok usunięty pomyślnie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Krok usunięty pomyślnie."
 *       404:
 *         description: Nie znaleziono kroku do usunięcia
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Krok nie znaleziony."
 *       500:
 *         description: Błąd serwera podczas usuwania kroku
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Błąd serwera podczas usuwania kroku."
 */
app.delete("/api/recipes/:recipeId/steps/:stepOrder", async (req, res) => {
  const { recipeId, stepOrder } = req.params;

  try {
    const [result] = await db
      .promise()
      .execute("DELETE FROM steps WHERE recipe_id = ? AND step_order = ?", [
        recipeId,
        stepOrder,
      ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Krok nie znaleziony." });
    }

    await db
      .promise()
      .execute(
        "UPDATE steps SET step_order = step_order - 1 WHERE recipe_id = ? AND step_order > ?",
        [recipeId, stepOrder]
      );

    res.status(200).json({ message: "Krok usunięty pomyślnie." });
  } catch (err) {
    console.error("Błąd podczas usuwania kroku:", err);
    res.status(500).json({ message: "Błąd serwera podczas usuwania kroku." });
  }
});

app.listen(5000, "0.0.0.0", () => {
  console.log("Serwer backend działa na porcie 5000");
});
