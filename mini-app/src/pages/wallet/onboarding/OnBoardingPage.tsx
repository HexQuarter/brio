import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export function OnBoardingPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div>
            <Page back={true}>
                <div className='flex flex-col'>
                    <div className='flex flex-col gap-10'>
                        <div className="flex flex-col gap-10">
                            <h2 className='text-4xl'>{t('main.nowalletTitle')}</h2>
                        </div>
                        <div className="flex flex-col">
                                 <div className="flex flex-col gap-2">
                                     <p>{t('main.nowalletDescription_1')}</p>
                                     <p>{t('main.nowalletDescription_2')}</p>
                                     <p>{t('main.nowalletDescription_3')}</p>
                                 </div>
                             </div>
                        <div className="flex flex-col gap-5 justify-center">
                            <Button onClick={() => navigate('/app/nowallet/create-wallet')}>{t('walletSetup.createButton')}</Button>
                            <Button variant="secondary" onClick={() => navigate('/app/nowallet/restore-wallet')}>{t('walletSetup.restoreButton')}</Button>
                        </div>
                    </div>
                </div>
            </Page>
        </div>
        
    );
}
