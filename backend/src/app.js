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
import notificationRoutes from './routes/notificationRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import auditLogRoutes from './routes/auditLogRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import ingredientRoutes from './routes/ingredientRoutes.js'
import bomRoutes from './routes/bomRoutes.js'
import stockMovementRoutes from './routes/stockMovementRoutes.js'
import cartRoutes from './routes/cartRoutes.js'

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors());

app.use('/api/users', userRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes)
app.use('/api/menu-items', menuItemRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/audit-logs', auditLogRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/ingredients', ingredientRoutes)
app.use('/api/bom', bomRoutes)
app.use('/api/stock-movements', stockMovementRoutes)

app.use('/api/cart', cartRoutes)

app.get('/', (req, res) => {
    res.send('Restaurant API running');
});

export default app;