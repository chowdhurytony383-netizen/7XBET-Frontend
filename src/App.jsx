export default function App() {
  return (
    <>
      <Routes>
        {/* Public pages: these open before login */}
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="sports" element={<SportsPage />} />
          <Route path="esports" element={<EsportsPage />} />
          <Route path="bet-slip" element={<BetSlipPage />} />
          <Route path="crash" element={<CrashPage />} />
          <Route path="live-casino" element={<LiveCasinoPage />} />
          <Route path="slots" element={<SlotsPage />} />
          <Route path="betongames" element={<BetOnGamesPage />} />
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
        </Route>

        {/* Auth pages */}
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

        {/* Login required pages */}
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

      <FooterSection />
    </>
  );
}