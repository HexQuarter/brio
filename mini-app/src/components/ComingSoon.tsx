import React from 'react';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from './ui/carousel';
import { useTranslation } from 'react-i18next';

export const ComingSoon: React.FC = () => {
    const { t } = useTranslation();
    const data = [
        {
            description: t('comingSoon.feature1.description'),
            title: t('comingSoon.feature1.title'),
            background: 'conic-gradient(from 0.25turn at 50% 50%, rgb(229, 90, 35), rgb(255, 148, 44))'
        },
        {
            description: t('comingSoon.feature2.description'),
            title: t('comingSoon.feature2.title'),
            background: '#FFD964'
        },
        {
            description: t('comingSoon.feature3.description'),
            title: t('comingSoon.feature3.title'),
            background: 'radial-gradient(#BE3FF4, #C0A0E7)'
        }
    ]

    const [api, setApi] = React.useState<CarouselApi>()
    const [current, setCurrent] = React.useState(0)

    React.useEffect(() => {
        if (!api) {
            return
        }
    
        setCurrent(api.selectedScrollSnap() + 1)
    
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1)
        })
    }, [api])

    return (
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p>Upcoming features</p>
            <Carousel setApi={setApi}>
                <CarouselContent>
                    {data.map((item) => (
                        <CarouselItem key={item.title} style={{ 
                            background: item.background,
                            borderTopLeftRadius: 40, 
                            borderTopRightRadius: 0, 
                            borderBottomRightRadius: 40, 
                            borderBottomLeftRadius: 0,
                            color: 'white',
                            minHeight: 170,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: 0
                        }}>
                            <p style={{ padding: '20px' }}>{item.description}</p>
                            <p style={{
                                background: '#444444',
                                borderBottomRightRadius: 40,
                                margin: 0,
                                height: '40px',
                                lineHeight: '40px',
                                padding: '0 12px',
                                fontWeight: 600,
                            }}>{item.title}</p>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                {data.map((_, index) => (
                    <div 
                        key={index} 
                        style={{ width: 5, height: 5, background: current === index + 1? '#000000' : '#FF942C', borderRadius: 20 }}
                    ></div>
                ))}
            </div>
        </div>
    )
};