import { useTranslation } from "react-i18next"
import { AppsGrid } from "@/components/AppsGrid";
import { ComingSoon } from "@/components/ComingSoon";

export const AppsPage = () => {
    const { t } = useTranslation()

    return (
        <div className='flex flex-col justify-between h-screen pb-20'>
            <div className='flex flex-col items-center justify-between h-full'>
                <div className="flex flex-col gap-10">
                    <h1 className='text-3xl'>
                        <span className='font-normal'>{t('welcome.title')}</span>
                        <span className='ml-4 font-semibold'>Brio</span>
                    </h1>
                    <p className=''>{t('welcome.whattodo')}</p>
                    <AppsGrid />
                </div>
                <div className="w-full">
                    <ComingSoon />
                </div>
            </div>
        </div>
    )
}