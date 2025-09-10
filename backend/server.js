const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(express.json());

// -------------------- AUTH DB CONNECTION --------------------
mongoose.connect('mongodb://localhost:27017/authDb')
  .then(() => console.log('✅ Connected to authDb'))
  .catch((error) => {
    console.error('❌ Error connecting to authDb:', error);
    process.exit(1);
  });

// -------------------- USER SCHEMA & MODEL --------------------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// -------------------- AUTH ROUTES --------------------

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('❌ Error during registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: { username: user.username, email: user.email },
    });
  } catch (error) {
    console.error('❌ Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users (no passwords)
app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// -------------------- TOURIST ATTRACTIONS DB CONNECTION --------------------
const touristDB = mongoose.createConnection('mongodb://localhost:27017/touristattractions');

touristDB.on('connected', () => {
  console.log('✅ Connected to Tourist Attractions DB');
});
touristDB.on('error', (err) => {
  console.error('❌ Error connecting to Tourist Attractions DB:', err);
});

// -------------------- ATTRACTION SCHEMA & MODELS --------------------
const attractionSchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  latitude: Number,
  longitude: Number,
  address: String,
  opening_hours: Object,
  entry_fee: Object,
  avg_visit_duration: Number,
  indoor_outdoor: String,
  images: [String],
  tags: [String],
  last_updated: Date
});

// Lowercase collection names explicitly set here
const Jaipur = touristDB.model('Jaipur', attractionSchema, 'jaipur');
const Udaipur = touristDB.model('Udaipur', attractionSchema, 'udaipur');
const Jaisalmer = touristDB.model('Jaisalmer', attractionSchema, 'jaisalmer');

// -------------------- AI SCORE CALCULATION (Simple heuristic) --------------------
function calculateAIScore(attraction) {
  let score = 0;
  if (attraction.tags?.includes("history")) score += 3;
  if (attraction.tags?.includes("photography")) score += 2;
  if (attraction.indoor_outdoor === "indoor") score += 1;
  return score;
}

// -------------------- DEBUG TEST ROUTE --------------------
app.get('/api/attractions/test', (req, res) => {
  res.json({ message: 'Attractions API is reachable' });
});

// -------------------- TOURIST ATTRACTIONS ROUTES --------------------
app.get('/api/attractions/:city', async (req, res) => {
  try {
    const city = req.params.city.toLowerCase();

    let data = [];

    if (city === 'jaipur') data = await Jaipur.find();
    else if (city === 'udaipur') data = await Udaipur.find();
    else if (city === 'jaisalmer') data = await Jaisalmer.find();
    else return res.status(404).json({ message: 'City not found' });

    data = data.map(a => ({ ...a._doc, ai_score: calculateAIScore(a) }));
    data.sort((a, b) => b.ai_score - a.ai_score);

    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching attractions:', error);
    res.status(500).json({ message: 'Error fetching attractions' });
  }
});

// -------------------- FILTER ATTRACTIONS ROUTE --------------------
app.post('/api/attractions/filter', async (req, res) => {
  try {
    const { city, filters } = req.body;
    const cityLower = city.toLowerCase();

    let query = { address: { $regex: cityLower, $options: 'i' } };
    if (filters) {
      if (filters.indoor_only) query.indoor_outdoor = 'indoor';
      if (filters.photography_spots_only) query.tags = { $in: ['photography'] };
      if (filters.avoid_crowded_places) query.crowded = { $ne: true }; // assuming you have a 'crowded' boolean field
    }

    let data;
    if (cityLower === 'jaipur') data = await Jaipur.find(query);
    else if (cityLower === 'udaipur') data = await Udaipur.find(query);
    else if (cityLower === 'jaisalmer') data = await Jaisalmer.find(query);
    else return res.status(404).json({ message: 'City not found' });

    data = data.map(a => ({ ...a._doc, ai_score: calculateAIScore(a) }));
    data.sort((a, b) => b.ai_score - a.ai_score);

    res.json(data);
  } catch (error) {
    console.error('❌ Error filtering attractions:', error);
    res.status(500).json({ message: 'Error filtering attractions' });
  }
});

// -------------------- ITINERARY GENERATION ROUTE --------------------
app.post('/api/attractions/itinerary', async (req, res) => {
  try {
    const { city, days, selected_attractions } = req.body;
    if (!city || !days || !selected_attractions?.length) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const cityLower = city.toLowerCase();

    let attractions = [];
    // Fetch selected attractions by _id
    if (cityLower === 'jaipur') {
      attractions = await Jaipur.find({ _id: { $in: selected_attractions } });
    } else if (cityLower === 'udaipur') {
      attractions = await Udaipur.find({ _id: { $in: selected_attractions } });
    } else if (cityLower === 'jaisalmer') {
      attractions = await Jaisalmer.find({ _id: { $in: selected_attractions } });
    } else {
      return res.status(404).json({ message: 'City not found' });
    }

    attractions = attractions.map(a => ({ ...a._doc, ai_score: calculateAIScore(a) }));

    // Sort attractions by AI score descending
    attractions.sort((a, b) => b.ai_score - a.ai_score);

    // Distribute attractions evenly across days
    const itinerary = {};
    for (let i = 0; i < days; i++) {
      itinerary[`Day ${i + 1}`] = [];
    }
    attractions.forEach((attr, idx) => {
      itinerary[`Day ${(idx % days) + 1}`].push(attr);
    });

    res.json(itinerary);
  } catch (error) {
    console.error('❌ Error generating itinerary:', error);
    res.status(500).json({ message: 'Error generating itinerary' });
  }
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
