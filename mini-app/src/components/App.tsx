import { type PropsWithChildren } from 'react';
import { Navigate, Route, Routes, HashRouter, useLocation } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { useWallet } from '@/lib/useWallet';
import { MainPage } from '@/pages/MainPage';
import { WelcomePage } from '@/pages/WelcomePage';
import { OnBoardingPage } from '@/pages/onboarding/OnBoardingPage';
import { CreateWalletPage } from '@/pages/onboarding/CreateWalletPage';
import { RestoreWalletPage } from '@/pages/onboarding/RestoreWalletPage';
import { SecureWalletPage } from '@/pages/onboarding/SecureWalletPage';
import { WalletMainPage } from '@/pages/wallet/WalletMainPage';
import { WelcomeWallet } from './wallet/Welcome';
import { WalletReceive } from './wallet/WalletReceive';
import { WalletSend } from './wallet/WalletSend';
import { WalletActivity } from './wallet/WalletActivity';

function AppRoute({ children } : PropsWithChildren<{}>) {
  console.log('App routing')
  const location = useLocation()
  const wallet = useWallet()
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
              <Route index element={<WelcomeWallet />} />
              <Route path="receive" element={<WalletReceive />} />
              <Route path="send" element={<WalletSend />} />
              <Route path="activity" element={<WalletActivity />} />
            </Route>
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
