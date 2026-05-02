import { Navigate, Route, Routes } from 'react-router-dom';

import AdminRoute from './components/AdminRoute.jsx';
import AuthRoute from './components/AuthRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import AppLayout from './layouts/AppLayout.jsx';

import HomePage from './pages/HomePage.jsx';
import GamesPage from './pages/GamesPage.jsx';
import SportsPage from './pages/SportsPage.jsx';
import EsportsPage from './pages/EsportsPage.jsx';
import BetSlipPage from './pages/BetSlipPage.jsx';
import CrashPage from './pages/CrashPage.jsx';
import LiveCasinoPage from './pages/LiveCasinoPage.jsx';
import SlotsPage from './pages/SlotsPage.jsx';
import BonusesPage from './pages/BonusesPage.jsx';
import WelcomeBonusPage from './pages/WelcomeBonusPage.jsx';
import CashbackPage from './pages/CashbackPage.jsx';
import VipRewardsPage from './pages/VipRewardsPage.jsx';
import TournamentsPage from './pages/TournamentsPage.jsx';
import OtherPage from './pages/OtherPage.jsx';
import PromotionsPage from './pages/PromotionsPage.jsx';
import FaqPage from './pages/FaqPage.jsx';
import RulesPage from './pages/RulesPage.jsx';
import CustomerSupportPage from './pages/CustomerSupportPage.jsx';
import StaticInfoPage from './pages/StaticInfoPage.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import VerifyResetPasswordPage from './pages/VerifyResetPasswordPage.jsx';
import SetNewPasswordPage from './pages/SetNewPasswordPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';

import AgentLoginPage from './pages/AgentLoginPage.jsx';
import AgentDashboardPage from './pages/AgentDashboardPage.jsx';
import AgentPaymentMethodsPage from './pages/agent/AgentPaymentMethodsPage.jsx';
import AgentRequestsPage from './pages/agent/AgentRequestsPage.jsx';

import DicePage from './pages/DicePage.jsx';
import MinesPage from './pages/MinesPage.jsx';
import SourceGamePage from './pages/SourceGamePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import WalletPage from './pages/WalletPage.jsx';
import DepositPage from './pages/DepositPage.jsx';
import WithdrawPage from './pages/WithdrawPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';

import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminUserDetailsPage from './pages/admin/AdminUserDetailsPage.jsx';
import AdminDepositsPage from './pages/admin/AdminDepositsPage.jsx';
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage.jsx';
import AdminAgentsPage from './pages/admin/AdminAgentsPage.jsx';
import AdminAgentPaymentMethodsPage from './pages/admin/AdminAgentPaymentMethodsPage.jsx';
import AdminAgentRequestsPage from './pages/admin/AdminAgentRequestsPage.jsx';

import NotFoundPage from './pages/NotFoundPage.jsx';
import OneClickCredentialModal from './components/OneClickCredentialModal.jsx';

export default function App() {
  return (
    <>
      <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="sports" element={<SportsPage />} />
        <Route path="esports" element={<EsportsPage />} />
        <Route path="bet-slip" element={<BetSlipPage />} />
        <Route path="crash" element={<CrashPage />} />
        <Route path="live-casino" element={<LiveCasinoPage />} />
        <Route path="slots" element={<SlotsPage />} />
        <Route path="bonuses" element={<BonusesPage />} />
        <Route path="bonuses/welcome-bonus" element={<WelcomeBonusPage />} />
        <Route path="bonuses/cashback" element={<CashbackPage />} />
        <Route path="bonuses/vip" element={<VipRewardsPage />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="other" element={<OtherPage />} />
        <Route path="other/promotions" element={<PromotionsPage />} />
        <Route path="other/faq" element={<FaqPage />} />
        <Route path="other/rules" element={<RulesPage />} />
        <Route path="customer-support" element={<CustomerSupportPage />} />
        <Route path="about-us" element={<StaticInfoPage pageKey="about" />} />
        <Route path="terms-and-conditions" element={<StaticInfoPage pageKey="terms" />} />
        <Route path="contacts" element={<StaticInfoPage pageKey="contacts" />} />
        <Route path="affiliate-program" element={<StaticInfoPage pageKey="affiliate" />} />
        <Route path="privacy-policy" element={<StaticInfoPage pageKey="privacy" />} />
        <Route path="responsible-gambling" element={<StaticInfoPage pageKey="responsible" />} />
        <Route path="kyc-policies" element={<StaticInfoPage pageKey="kyc" />} />
      </Route>

      <Route element={<AuthRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-reset-password-otp" element={<VerifyResetPasswordPage />} />
        <Route path="/set-new-password" element={<SetNewPasswordPage />} />
      </Route>

      <Route path="/verify-user" element={<VerifyEmailPage />} />
      <Route path="/agent/login" element={<AgentLoginPage />} />
      <Route path="/agent/dashboard" element={<AgentDashboardPage />} />
      <Route path="/agent/payment-methods" element={<AgentPaymentMethodsPage />} />
      <Route path="/agent/requests/:type" element={<AgentRequestsPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="games/dice" element={<DicePage />} />
          <Route path="games/mines" element={<MinesPage />} />
          <Route path="source-games/:gameCode" element={<SourceGamePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="deposit" element={<DepositPage />} />
          <Route path="withdraw" element={<WithdrawPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/verification" element={<VerificationPage />} />

          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/users/:userId" element={<AdminUserDetailsPage />} />
            <Route path="admin/deposits" element={<AdminDepositsPage />} />
            <Route path="admin/withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="admin/agents" element={<AdminAgentsPage />} />
            <Route path="admin/agent-payments" element={<AdminAgentPaymentMethodsPage />} />
            <Route path="admin/agent-requests" element={<AdminAgentRequestsPage />} />
          </Route>
        </Route>
      </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <OneClickCredentialModal />
    </>
  );
}
