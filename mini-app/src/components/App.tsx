import { type PropsWithChildren } from 'react';
import { Navigate, Route, Routes, HashRouter, useLocation } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { useWallet } from '@/lib/walletContext';
import { WelcomePage } from '@/pages/WelcomePage';
import { MainPage } from '@/pages/MainPage';
import { OnBoardingPage } from '@/pages/onboarding/OnBoardingPage';
import { CreateWalletPage } from '@/pages/onboarding/CreateWalletPage';
import { RestoreWalletPage } from '@/pages/onboarding/RestoreWalletPage';
import { SecureWalletPage } from '@/pages/onboarding/SecureWalletPage';
import { WalletMainPage } from '@/pages/wallet/MainPage';
import { WalletWelcomePage } from '@/pages/wallet/WelcomePage';
import { WalletReceivePage } from '@/pages/wallet/ReceivePage';
import { WalletSendPage } from '@/pages/wallet/SendPage';
import { WalletActivityPage } from '@/pages/wallet/ActivityPage';
import { WalletActivityDetailsPage } from '@/pages/wallet/ActivityDetailsPage';
import { WalletSettingsPage } from '@/pages/wallet/SettingsPage';
import { BackupWalletPage } from '@/pages/wallet/BackupPage';
import { ComingSoonPage } from '@/pages/ComingSoonPage';

function AppRoute({ children } : PropsWithChildren<{}>) {
  const wallet = useWallet()
  const location = useLocation()
  if (!wallet.walletExists && location.search != '?visit') {
      return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <AppRoot>
      <HashRouter>
        <Routes>
          <Route path="/" element={
            <AppRoute>
              <MainPage />
            </AppRoute>
          }>
            <Route index element={<Navigate to="/wallet" replace />} />
            <Route path="/wallet" element={<WalletMainPage />}>
              <Route index element={<WalletWelcomePage />} />
              <Route path="receive" element={<WalletReceivePage />} />
              <Route path="send" element={<WalletSendPage />} />
              <Route path="activity" element={<WalletActivityPage />} />
              <Route path="activity/:id" element={<WalletActivityDetailsPage />} />
              <Route path="settings" element={<WalletSettingsPage />} />
              <Route path="backup" element={<BackupWalletPage />} />
            </Route>
            <Route path="/upcoming" element={<ComingSoonPage />} />
          </Route>
          <Route path="/welcome" Component={WelcomePage} />
          <Route path="/onboarding" Component={OnBoardingPage} />
          <Route path="/onboarding/create-wallet" Component={CreateWalletPage} />
          <Route path="/onboarding/restore-wallet" Component={RestoreWalletPage} />
          <Route path="/onboarding/secure-wallet" Component={SecureWalletPage} />
        </Routes>
      </HashRouter>
    </AppRoot>
  );
}
