import { useEffect, useState, type PropsWithChildren } from 'react';
import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { useWallet } from '@/lib/wallet/context';
import { WelcomePage } from '@/pages/WelcomePage';
import { MainPage } from '@/pages/MainPage';
import { OnBoardingPage } from '@/pages/wallet/onboarding/OnBoardingPage';
import { CreateWalletPage } from '@/pages/wallet/onboarding/CreateWalletPage';
import { RestoreWalletPage } from '@/pages/wallet/onboarding/RestoreWalletPage';
import { SecureWalletPage } from '@/pages/wallet/onboarding/SecureWalletPage';
import { WalletMainPage } from '@/pages/wallet/MainPage';
import { WalletWelcomePage } from '@/pages/wallet/WelcomePage';
import { WalletReceivePage } from '@/pages/wallet/ReceivePage';
import { WalletSendPage } from '@/pages/wallet/SendPage';
import { WalletActivityPage } from '@/pages/wallet/ActivityPage';
import { WalletActivityDetailsPage } from '@/pages/wallet/ActivityDetailsPage';
import { WalletSettingsPage } from '@/pages/wallet/SettingsPage';
import { BackupWalletPage } from '@/pages/wallet/BackupPage';
import { ComingSoonPage } from '@/pages/ComingSoonPage';
import { AppsPage } from '@/pages/AppsPage';
import { YourVoiceWelcomePage } from '@/pages/yourvoice/WelcomePage';
import { YourVoiceMainPage } from '@/pages/yourvoice/MainPage';
import { VotingPage } from '@/pages/yourvoice/VotingPage';
import { YourVoiceCreateOrgPage } from '@/pages/yourvoice/CreateOrgPage';
import { YourVoiceCreatePollPage } from '@/pages/yourvoice/CreatePollPage';
import { YourVoiceActivePollsPage } from '@/pages/yourvoice/ActivePolls';
import { YourVoicePastPollsPage } from '@/pages/yourvoice/PastPollsPage';

function WalletRoute({ children }: PropsWithChildren<{}>) {
  const wallet = useWallet()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const forceCheckWallet = async () => {
      await wallet.checkWallet()
      setChecked(true)
    }

    forceCheckWallet()
  }, [])

  return <>
    {checked && !wallet.walletExists &&
      <Navigate to="/app/nowallet" replace />
    }
    {checked && (wallet.walletExists) &&
      children
    }
  </>
}

export function App() {
  return (
    <AppRoot>
      <HashRouter>
        <Routes>
          <Route path="/" Component={WelcomePage} />
          <Route path="/apps" Component={AppsPage} />
          <Route path="/app" Component={MainPage}>
            <Route path="wallet" element={
              <WalletRoute>
                <WalletMainPage />
              </WalletRoute>
            }>
              <Route index Component={WalletWelcomePage} />
              <Route path="receive" Component={WalletReceivePage} />
              <Route path="send" Component={WalletSendPage} />
              <Route path="activity" Component={WalletActivityPage} />
              <Route path="activity/:id" Component={WalletActivityDetailsPage} />
              <Route path="settings" Component={WalletSettingsPage} />
              <Route path="backup" Component={BackupWalletPage} />
            </Route>
            <Route path="nowallet">
              <Route index Component={OnBoardingPage} />
              <Route path="create-wallet" Component={CreateWalletPage} />
              <Route path="restore-wallet" Component={RestoreWalletPage} />
              <Route path="secure-wallet" Component={SecureWalletPage} />
            </Route>
            <Route path="yourvoice" Component={YourVoiceMainPage}>
              <Route index element={<YourVoiceWelcomePage />} />
              <Route path="create-org" element={<YourVoiceCreateOrgPage />} />
              <Route path="create-poll" element={<YourVoiceCreatePollPage />} />
              <Route path="poll/:id" element={<VotingPage />} />
              <Route path="active-polls" element={<YourVoiceActivePollsPage />} />
              <Route path="past-polls" element={<YourVoicePastPollsPage />} />
            </Route>
            <Route path="upcoming" Component={ComingSoonPage} />
          </Route>
        </Routes>
      </HashRouter>
    </AppRoot>
  );
}
