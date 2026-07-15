import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
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
import addressRoutes from './routes/addressRoutes.js'
import discountAdvertisementRoutes from './routes/discountAdvertisementRoutes.js'
import compositeRoutes from './routes/compositeRoutes.js'

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

const allowedOrigins = [
  "http://localhost:2000",
  "http://127.0.0.1:2000",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_PROD
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true
}));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/receipt-settings', receiptSettingsRoutes)
app.use('/api/discount-advertisements', discountAdvertisementRoutes)
app.use('/api/composites', compositeRoutes)

app.get('/', (req, res) => {
    res.send('Restaurant API running');
});

export default app;