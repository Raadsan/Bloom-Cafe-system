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
import trackingRoutes from './routes/trackingRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import menuRoutes from './routes/menuRoutes.js';
import customerRoutes from './routes/customerRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js';
import receiptSettingsRoutes from './routes/receiptSettingsRoutes.js'
import systemSettingsRoutes from './routes/systemSettingsRoutes.js'
import addressRoutes from './routes/addressRoutes.js'
import roomRoutes from './routes/roomRoutes.js'

const app = express();
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

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
app.use('/api/tracking', trackingRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/menus', menuRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/receipt-settings', receiptSettingsRoutes)
app.use('/api/system-settings', systemSettingsRoutes)

app.get('/', (req, res) => {
    res.send('Restaurant API running');
});

export default app;