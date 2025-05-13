const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'dreamfoodx_db',
});

function connectWithRetry() {
  db.connect((err) => {
    if (err) {
      console.error('Błąd połączenia z bazą, ponawiam próbę...', err);
      setTimeout(connectWithRetry, 5000); 
    } else {
      console.log('Połączono z bazą danych.');
    }
  });
}

connectWithRetry();

app.post('/api/register', async (req, res) => {
  console.log('recived register req:',req);
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Brak danych' });
  }

  try {
    const [emailResult] = await db.promise().execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    const [usernameResult] = await db.promise().execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (emailResult.length > 0 || usernameResult.length > 0) {
      return res.status(400).json({ message: 'Login lub email już w użyciu.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, hashedPassword], (err) => {
      if (err) {
        console.error('Błąd przy zapisie:', err);
        return res.status(500).json({ message: 'Błąd serwera xd' });
      }
      return res.status(201).json({ message: 'Użytkownik zarejestrowany', username: username });
    });
  } catch (err) {
    console.error('Błąd przy rejestracji:', err);
    return res.status(500).json({ message: 'Błąd hashowania hasła '});
  }
});

app.post('/api/login', async (req, res) => {
  console.log('recived login req:',req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Brak danych' });
  }

  try {
    const [rows] = await db.promise().execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Nieprawidłowy login lub hasło' });
    }

    const user = rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nieprawidłowy login lub hasło' });
    }
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ message: 'Zalogowano pomyślnie', username: user.username });
  } catch (err) {
    console.error('Błąd przy logowaniu:', err);
    return res.status(500).json({ message: 'Błąd serwera xd' });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.post('/api/recipes', upload.single('image'), async (req, res) => {
  try {
    const { title, description, author } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !description || !author || !imagePath) {
      return res.status(400).json({ message: 'Brak wymaganych danych.' });
    }

    const query = `
      INSERT INTO recipes (title, description, author, image)
      VALUES (?, ?, ?, ?)
    `;
    await db.promise().execute(query, [title, description, author, imagePath]);

    return res.status(201).json({ message: 'Przepis dodany pomyślnie.' });
  } catch (err) {
    console.error('Błąd przy dodawaniu przepisu:', err);
    res.status(500).json({ message: 'Błąd serwera przy dodawaniu przepisu.' });
  }
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Serwer backend działa na porcie 5000');
});

app.get('/api/recipes/best', async (req, res) => {
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
    console.error('Błąd przy pobieraniu najlepszych przepisów:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.get('/api/recipes/latest', async (req, res) => {
  try {
    const query = `
      SELECT * FROM recipes
      ORDER BY created_at DESC
      LIMIT 5; 
    `;
    const [rows] = await db.promise().execute(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Błąd przy pobieraniu najnowszych przepisów:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});