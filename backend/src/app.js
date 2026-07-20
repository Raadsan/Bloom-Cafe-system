import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import userRoutes from './modules/user/user.routes.js';
import tableRoutes from './modules/table/table.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import menuItemRoutes from './modules/menuItem/menuItem.routes.js';
import orderRoutes from './modules/order/order.routes.js';
import roleRoutes from './modules/role/role.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';
import auditLogRoutes from './modules/auditLog/auditLog.routes.js';
import reportRoutes from './modules/report/report.routes.js';
import ingredientRoutes from './modules/ingredient/ingredient.routes.js';
import bomRoutes from './modules/bom/bom.routes.js';
import stockMovementRoutes from './modules/stockMovement/stockMovement.routes.js';
import trackingRoutes from './modules/tracking/tracking.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import menuRoutes from './modules/menu/menu.routes.js';
import customerRoutes from './modules/customer/customer.routes.js';
import expenseRoutes from './modules/expense/expense.routes.js';
import receiptSettingsRoutes from './modules/receiptSettings/receiptSettings.routes.js';
import addressRoutes from './modules/address/address.routes.js';
import discountAdvertisementRoutes from './modules/discountAdvertisement/discountAdvertisement.routes.js';
import compositeRoutes from './modules/composite/composite.routes.js';
import accountingRoutes from './modules/accounting/accounting.routes.js';

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
app.use('/api/accounting', accountingRoutes)

app.get('/', (req, res) => {
    res.send('Restaurant API running');
});

export default app;