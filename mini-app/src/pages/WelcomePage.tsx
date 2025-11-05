import type { FC } from 'react';

import { ComingSoon } from '@/components/ComingSoon';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

import { useNavigate } from "react-router-dom";
import { useWallet } from '@/lib/wallet/context';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

export const WelcomePage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const wallet = useWallet()

  const tgData = retrieveLaunchParams()
  if (tgData) {
    const startParam = tgData.tgWebAppData?.start_param
    if (startParam) {
      const params = new URLSearchParams(startParam)
      const paymentHash = params.get('payment')
      if (paymentHash) {
        const fetchPaymentId = async (hash: string) => {
          if (!wallet.breezSdk) {
            return
          }
          const { payments } = await wallet.breezSdk.listPayments({})
          const payment = payments.find(p => p.paymentType == 'receive' && p.details?.type == 'lightning' && p.details.paymentHash == hash)
          console.log(payment)
          if (payment) {
            navigate(`/app/wallet/activity/${payment.id}`)
          } else {
            console.error("Could not find payment", payment, payments)
          }
        }

        fetchPaymentId(paymentHash)
      }

      const route = params.get('route')
      if (route) {
        window.location.replace(`#${route}`)
        return
      }
    }
  }

  if (wallet.walletExists) {
    window.location.replace('#/apps')
    return
  }

  return (
    <div className='flex flex-col justify-between h-screen pb-20'>
      <div className='flex flex-col gap-10 items-center'>
        <h1 className='text-6xl'><span className='font-normal'>{t('welcome.title')}</span><span className='ml-4 font-semibold'>Brio</span></h1>
        <p className=''>{t('welcome.description')}</p>
        <div>
          <Button className="" onClick={() => navigate('/apps')}>{t('welcome.button')}</Button>
        </div>
      </div>
      <div><ComingSoon /></div>
    </div>
  );
};
