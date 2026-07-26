import { companyApi } from "./configuration/companyApi";
import { accountingReportApi } from "./accountingReportApi";

export interface AccountingDashboardData {
  totalRevenue: number;
  expenses: number;
  netProfit: number;
  cashBalance: number;
  bankBalance: number;
}

export const accountingDashboardApi = {
  getSummary: async (): Promise<AccountingDashboardData> => {
    const companies = await companyApi.getAll();
    const company = companies.find((item) => item.is_active !== false) ?? companies[0];
    if (!company) {
      return { totalRevenue: 0, expenses: 0, netProfit: 0, cashBalance: 0, bankBalance: 0 };
    }

    const companyId = Number(company.id);
    const [profitAndLoss, cashFlow] = await Promise.all([
      accountingReportApi.getProfitAndLoss({ companyId }),
      accountingReportApi.getCashFlow({ companyId }),
    ]);

    const totalRevenue = Number(profitAndLoss?.income?.total || 0);
    const expenses = Number(profitAndLoss?.expense?.total || 0);
    const cashBalance = Number(cashFlow?.closing_balance || 0);
    const bankBalance = Array.isArray(cashFlow?.accounts)
      ? cashFlow.accounts.reduce((sum: number, account: { closing_balance?: number | string }) => sum + Number(account.closing_balance || 0), 0)
      : cashBalance;

    return {
      totalRevenue,
      expenses,
      netProfit: Number(profitAndLoss?.net_income ?? totalRevenue - expenses),
      cashBalance,
      bankBalance,
    };
  },
};
