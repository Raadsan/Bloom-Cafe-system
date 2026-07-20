import express from 'express';
import {
  getGeneralLedger,
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet
} from './accountingReport.controller.js';
import { protect } from '../../../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/general-ledger', getGeneralLedger);
router.get('/trial-balance', getTrialBalance);
router.get('/profit-and-loss', getProfitAndLoss);
router.get('/balance-sheet', getBalanceSheet);

export default router;
