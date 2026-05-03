import api from './client.js';

export const AccountAPI = {
  bets: () => api.get('/bet/fetch-bets-by-user'),
  betsByGame: (gameId) => api.get('/bet/fetch-user-bet-by-game', { params: { gameId } }),
  betStats: () => api.get('/bet/get-user-totalwin-and-winningstreak'),
  betStatsByGame: (gameId) => api.get('/bet/get-user-totalwin-and-winningstreak-by-game', { params: { gameId } }),
  transactions: () => api.get('/transaction/get-all-transaction-by-user-id'),
  walletStats: () => api.get('/user/get-day-wise-wallet-stats'),
  createWithdrawTransaction: (payload) => api.post('/transaction/create-transaction', payload),
  requestRazorpayPayout: (transactionId) => api.post('/razorpay/withdraw-payout-razorpay', { transactionId }),
  agentDepositOptions: () => api.get('/transaction/agent-deposit-options'),
  agentWithdrawOptions: () => api.get('/transaction/agent-withdraw-options'),
  createAgentDepositRequest: (payload) => api.post('/transaction/agent-deposit-request', payload),
  createAgentWithdrawRequest: (payload) => api.post('/transaction/agent-withdraw-request', payload),
  createDepositOrder: (amount) => api.post('/razorpay/create-deposit-order', { amount }),
  verifyDepositPayment: (payload) => api.post('/razorpay/verify-deposit-payment', payload),
};
