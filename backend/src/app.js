import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import userRoutes from './routes/userRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js'
import menuItemRoutes from './routes/menuItemRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import roleRoutes from './routes/roleRoutes.js'
import authRoutes from './routes/authRoutes.js'

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes)
app.use('/api/menu-items', menuItemRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
    res.send('Restaurant API running');
});

export default app;