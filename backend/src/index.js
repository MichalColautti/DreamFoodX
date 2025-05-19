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

// Endpoint do rejestracji
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

// Endpoint do logowania
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
    return res.status(500).json({ message: 'Błąd serwera' });
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

// Dodawanie przepisu
// app.post('/api/recipes', upload.single('image'), async (req, res) => {
//   try {
//     const { title, description, author } = req.body;
//     const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

//     if (!title || !description || !author || !imagePath) {
//       return res.status(400).json({ message: 'Brak wymaganych danych.' });
//     }

//     const query = `
//       INSERT INTO recipes (title, description, author, image)
//       VALUES (?, ?, ?, ?)
//     `;
//     await db.promise().execute(query, [title, description, author, imagePath]);

//     return res.status(201).json({ message: 'Przepis dodany pomyślnie.' });
//   } catch (err) {
//     console.error('Błąd przy dodawaniu przepisu:', err);
//     res.status(500).json({ message: 'Błąd serwera przy dodawaniu przepisu.' });
//   }
// });

// Pobieranie najwyżej ocenianych przepisów
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

// Pobieranie najnowszych przepisów
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

// Pobieranie przepisów użytkownika
app.get('/api/recipes/user', async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ message: 'Brakuje nazwy użytkownika.' });
  }

  try {
    const query = 'SELECT * FROM recipes WHERE author = ? ORDER BY created_at DESC';
    const [rows] = await db.promise().execute(query, [username]);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Błąd przy pobieraniu przepisów użytkownika:', err);
    res.status(500).json({ message: 'Błąd serwera przy pobieraniu przepisów użytkownika.' });
  }
});

// Pobieranie przepisów z po wyszukiwaniu
app.get('/api/recipes/search', async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: 'Brak nazwy przepisu w zapytaniu.' });
  }

  try {
    const query = `
      SELECT * FROM recipes
      WHERE title LIKE ?
      ORDER BY created_at DESC;
    `;
    const [rows] = await db.promise().execute(query, [`%${name}%`]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nie znaleziono przepisów.' });
    }

    res.status(200).json(rows);
  } catch (err) {
    console.error('Błąd przy wyszukiwanie przepisów:', err);
    res.status(500).json({ message: 'Błąd serwera przy wyszukiwaniu przepisów.' });
  }
});

// Pobieranie przepisu po ID
app.get('/api/recipes/:id', async (req, res) => {
  const recipeId = req.params.id;

  try {
    const [recipeResults] = await db.promise().execute(
      'SELECT id, title, description, author, image FROM recipes WHERE id = ?',
      [recipeId]
    );
    if (recipeResults.length === 0) {
      return res.status(404).json({ message: 'Przepis nie znaleziony.' });
    }
    const recipe = recipeResults[0];

    const [ingredientResults] = await db.promise().execute(
      'SELECT name, amount, unit FROM ingredients WHERE recipe_id = ?',
      [recipeId]
    );
    recipe.ingredients = ingredientResults.map((row) => ({
      name: row.name,
      amount: row.amount,
      unit: row.unit,
    }));

    const [stepResults] = await db.promise().execute(
      'SELECT step_order, action, description, temperature, blade_speed, duration FROM steps WHERE recipe_id = ? ORDER BY step_order',
      [recipeId]
    );
    recipe.steps = stepResults.map((row) => ({
      order: row.step_order,
      action: row.action,
      description: row.description,
      temperature: row.temperature,
      bladeSpeed: row.blade_speed,
      duration: row.duration,
    }));

    res.json(recipe);
  } catch (err) {
    console.error('Błąd serwera:', err);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

// Pobieranie czy juz oceniliśmy przepis
app.get('/api/recipes/:id/check-already-rated', async (req, res) => {
  const { id } = req.params;
  const { username } = req.query;  

  if (!username) {
    return res.status(400).json({ message: 'Brak nazwy użytkownika' });
  }

  try {
    const [ratingCheck] = await db.promise().execute(
      'SELECT * FROM ratings WHERE recipe_id = ? AND user_id = (SELECT id FROM users WHERE username = ?)',
      [id, username]
    );

    if (ratingCheck.length > 0) {
      return res.status(200).json({ alreadyRated: true });
    } else {
      return res.status(200).json({ alreadyRated: false });
    }
  } catch (err) {
    console.error('Błąd przy sprawdzaniu oceny:', err);
    return res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Pobieranie oceny użytkownika
app.get('/api/recipes/:id/user-rating', async (req, res) => {
  const { id } = req.params;
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ message: 'Brakuje nazwy użytkownika' });
  }

  try {
    const [userResult] = await db.promise().execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    const userId = userResult[0].id;

    const [ratingResult] = await db.promise().execute(
      'SELECT rating FROM ratings WHERE user_id = ? AND recipe_id = ?',
      [userId, id]
    );

    if (ratingResult.length > 0) {
      return res.status(200).json({ rating: ratingResult[0].rating });
    } else {
      return res.status(200).json({ rating: null });
    }
  } catch (err) {
    console.error('Błąd przy pobieraniu oceny użytkownika:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Dodawanie oceny
app.post('/api/recipes/:id/rate', async (req, res) => {
  const { id } = req.params;
  const { rating, username } = req.body;

  if (!rating || !username) {
    return res.status(400).json({ message: 'Brak wymaganych danych' });
  }

  try {
    const [existingRating] = await db.promise().execute(
      'SELECT * FROM ratings WHERE user_id = (SELECT id FROM users WHERE username = ?) AND recipe_id = ?',
      [username, id]
    );

    if (existingRating.length > 0) {
      return res.status(400).json({ message: 'Już oceniłeś ten przepis.' });
    }

    const [userResult] = await db.promise().execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    const userId = userResult[0].id;

    await db.promise().execute(
      'INSERT INTO ratings (user_id, recipe_id, rating) VALUES (?, ?, ?)',
      [userId, id, rating]
    );

    const [ratings] = await db.promise().execute(
      'SELECT rating FROM ratings WHERE recipe_id = ?',
      [id]
    );

    const totalRatings = ratings.length;
    const sumRatings = ratings.reduce((sum, row) => sum + row.rating, 0);
    const averageRating = (sumRatings / totalRatings).toFixed(1);

    await db.promise().execute(
      'UPDATE recipes SET rating = ? WHERE id = ?',
      [averageRating, id]
    );

    return res.status(200).json({ rating: averageRating, ratingCount: totalRatings });
  } catch (err) {
    console.error('Błąd przy ocenianiu przepisu:', err);
    return res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Dodawanie do ulubionych
app.post('/api/recipes/:id/favorite', async (req, res) => {
  const { username } = req.body;  
  const { id: recipeId } = req.params;

  if (!username || !recipeId) {
    return res.status(400).json({ message: 'Brak wymaganych danych (username lub recipeId)' });
  }

  try {
    const [user] = await db.promise().execute('SELECT id FROM users WHERE username = ?', [username]);
    if (!user.length) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });

    await db.promise().execute(
      'INSERT IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)',
      [user[0].id, recipeId]  
    );

    res.status(200).json({ message: 'Dodano do ulubionych' });
  } catch (err) {
    console.error('Błąd przy dodawaniu do ulubionych:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Usuwanie z ulubionych
app.delete('/api/recipes/:id/favorite', async (req, res) => {
  const { username } = req.body; 
  const { id: recipeId } = req.params;

  console.log('Otrzymane dane:', { username, recipeId });

  if (!username || !recipeId) {
    return res.status(400).json({ message: 'Brak wymaganych danych (username lub recipeId)' });
  }

  try {
    const [user] = await db.promise().execute('SELECT id FROM users WHERE username = ?', [username]);
    if (!user.length) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });

    const result = await db.promise().execute(
      'DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?',
      [user[0].id, recipeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Przepis nie jest w ulubionych' });
    }

    res.status(200).json({ message: 'Usunięto z ulubionych' });
  } catch (err) {
    console.error('Błąd przy usuwaniu z ulubionych:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Sprawdzanie czy przepis jest ulubiony
app.get('/api/recipes/:id/is-favorite', async (req, res) => {
  const { username } = req.query;
  const { id: recipeId } = req.params;

  try {
    const [user] = await db.promise().execute('SELECT id FROM users WHERE username = ?', [username]);
    if (!user.length) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });

    const [result] = await db.promise().execute(
      'SELECT 1 FROM favorites WHERE user_id = ? AND recipe_id = ?',
      [user[0].id, recipeId]
    );

    res.status(200).json({ isFavorite: result.length > 0 });
  } catch (err) {
    console.error('Błąd przy sprawdzaniu ulubionych:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Pobieranie ulubionych przepisów użytkownika
app.get('/api/favorites/get-favorites', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ message: 'Brak nazwy użytkownika' });
  }

  try {
    const [favorites] = await db.promise().execute(`
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
    console.error('Błąd przy pobieraniu ulubionych przepisów:', err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Dodawanie przepisu
app.post('/api/recipes', upload.single('image'), async (req, res) => {
  const { title, author, description } = req.body;

  try {
    const ingredients = JSON.parse(req.body.ingredients || '[]'); 
    const steps = JSON.parse(req.body.steps || '[]');
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !author || !description) {
      return res.status(400).json({ message: 'Brakuje wymaganych danych.' });
    }

    const [recipeResult] = await db.promise().execute(
      'INSERT INTO recipes (title, description, author, image) VALUES (?, ?, ?, ?)',
      [title, description, author, imagePath]
    );
    const recipeId = recipeResult.insertId;

    for (const ingredient of ingredients) {
      await db.promise().execute(
        'INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)',
        [recipeId, ingredient.name, ingredient.amount || null, ingredient.unit || null]
      );
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await db.promise().execute(
        `INSERT INTO steps
          (recipe_id, step_order, action, description, temperature, blade_speed, duration)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          recipeId,
          i + 1,
          step.action,
          step.description,
          step.temperature || null,
          step.bladeSpeed || null,
          step.duration || null,
        ]
      );
    }

    res.status(201).json({ message: 'Przepis dodany!', recipeId });
  } catch (err) {
    console.error('Błąd serwera:', err);
    res.status(500).json({ message: 'Błąd serwera.' });
  }
});

// Pobieranie kategorii i składników
app.get("/api/ingredients/categories", async (req, res) => {
  try {
    const [categories] = await db.promise().execute(
      "SELECT id, name FROM ingredient_categories ORDER BY name"
    );

    const categoriesWithItems = await Promise.all(
      categories.map(async (category) => {
        const [ingredients] = await db.promise().execute(
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
app.put("/api/recipes/:id", upload.single("image"), async (req, res) => {
  const recipeId = req.params.id;
  const { title, description, ingredients, steps } = req.body;

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

    await db.promise().execute("DELETE FROM ingredients WHERE recipe_id = ?", [
      recipeId,
    ]);
    await db.promise().execute("DELETE FROM steps WHERE recipe_id = ?", [
      recipeId,
    ]);

    const parsedIngredients = JSON.parse(ingredients);
    for (const ing of parsedIngredients) {
      await db.promise().execute(
        "INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)",
        [recipeId, ing.name, ing.amount, ing.unit]
      );
    }

    const parsedSteps = JSON.parse(steps);
    for (let i = 0; i < parsedSteps.length; i++) {
      const step = parsedSteps[i];
      await db.promise().execute(
        `INSERT INTO steps
           (recipe_id, step_order, action, description, temperature, blade_speed, duration)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          recipeId,
          i + 1,
          step.action,
          step.description,
          step.temperature,
          step.bladeSpeed,
          step.duration,
        ]
      );
    }

    res.json({ message: "Przepis zaktualizowany!" });
  } catch (err) {
    console.error("Błąd edycji:", err);
    res.status(500).json({ message: "Błąd serwera." });
  }
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Serwer backend działa na porcie 5000');
});