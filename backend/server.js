const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');


const authRoutes = require('./routes/auth');
const interviewRoutes = require('./routes/interview');




const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);

app.get('/', (req, res) => {
res.send('Welcome to the AI Interview Platform API');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {console.log(`Server is running on port ${PORT}`); });


