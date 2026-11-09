const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

// Rutes noves de l'API
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const classScheduleRoutes = require('./routes/classSchedules');
const chargerRoutes = require('./routes/chargers');
const chargingScheduleRoutes = require('./routes/chargingSchedules');
const chargingHistoryRoutes = require('./routes/chargingHistory');
const holidayRoutes = require('./routes/holidays');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API nova
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/class-schedules', classScheduleRoutes);
app.use('/api/chargers', chargerRoutes);
app.use('/api/charging-schedules', chargingScheduleRoutes);
app.use('/api/charging-history', chargingHistoryRoutes);
app.use('/api/holidays', holidayRoutes);

// Alias per mantenir compatibilitat amb les pàgines actuals de login i registre
app.use('/auth', authRoutes);

// Ruta de prova
app.get('/', (req, res) => {
  res.json({ message: "API d'AulaCarrega funcionant" });
});

// Errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connectar a MongoDB abans d'acceptar peticions
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Servidor corrent al port ${PORT}`);
    });
  } catch (error) {
    console.error("No s'ha pogut iniciar el servidor: la base de dades no està disponible");
    process.exit(1);
  }
};

startServer();
