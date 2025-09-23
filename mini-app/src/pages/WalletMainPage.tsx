import { useTranslation } from 'react-i18next';

import { GoDownload, GoHistory, GoUpload } from 'react-icons/go';
import { FiEye, FiSettings } from "react-icons/fi";

import { WalletBalance } from '@/components/WalletBalance';

export const WalletMainPage = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-5 h-full">
        <div className="flex gap-10 items-end justify-between">
            <WalletBalance />
            <div className='flex gap-4 mb-3'>
                <FiEye className='text-gray-400'/>
                <FiSettings className='text-gray-400'/>
            </div>
        </div>
        <div className="bg-gray-100 p-5 rounded-xl flex-1 flex flex-col">
            <div className="flex flex-col gap-20 items-center mt-5">
                <div className="flex flex-row gap-5 items-center">
                    <div className="flex flex-col gap-2 items-center text-slate-500 ">
                        <div className="w-12 h-12 border-1 border-slate-500 rounded-full flex items-center justify-center">
                            <GoDownload className="w-5 h-5"/>
                        </div>
                        <p>{t('wallet.menuReceiveBTC')}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-center text-slate-500 ">
                        <div className="w-12 h-12 border-1 border-slate-500 rounded-full flex items-center justify-center">
                            <GoUpload className="w-5 h-5"/>
                        </div>
                        <p>{t('wallet.menuSendBTC')}</p>
                    </div>
                        <div className="flex flex-col gap-2 items-center text-slate-500 ">
                        <div className="w-12 h-12 border-1 border-slate-500 rounded-full flex items-center justify-center">
                            <GoHistory className="w-5 h-5"/>
                        </div>
                        <p>{t('wallet.menuActivity')}</p>
                    </div>
                </div>
                <div className="flex flex-col gap-10 text-center">
                    <h3 className="text-2xl font-medium">{t('main.welcomeTitle')}</h3>
                    <p>{t('main.welcomeDescription')}</p>
                </div>
            </div>
        </div>
    </div>
    
  );
};
