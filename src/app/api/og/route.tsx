import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // ?title=<title>
        const hasTitle = searchParams.has('title');
        const title = hasTitle
            ? searchParams.get('title')?.slice(0, 100)
            : 'Kakebo AI';

        // ?description=<description>
        const hasDescription = searchParams.has('description');
        const description = hasDescription
            ? searchParams.get('description')?.slice(0, 200)
            : 'Gestión financiera minimalista con Inteligencia Artificial.';

        // Load fonts
        const fontData = await fetch(
            new URL('../../../assets/fonts/Inter-Bold.ttf', import.meta.url)
        ).then((res) => res.arrayBuffer()).catch(() => null);

        // Fallback if local font fetch fails (using standard fetch for Google Fonts in Edge)
        // We will use a standard system font approach or fetch from CDN if needed, 
        // but for simplicity and reliability in this environment, let's try to fetch a public font.
        // Actually, let's use a reliable CDN for the font to avoid local file issues in edge.
        const interSemiBold = await fetch(
            new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff')
        ).then((res) => res.arrayBuffer()).catch(() => null);

        const playfairDisplay = await fetch(
            new URL('https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff')
        ).then((res) => res.arrayBuffer()).catch(() => null);


        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#fafaf9',
                        fontFamily: '"Playfair Display", serif',
                        position: 'relative',
                    }}
                >
                    {/* Background Patterns (Subtle) */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '-10%',
                            left: '-10%',
                            width: '40%',
                            height: '40%',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #cf5c5c 0%, rgba(207, 92, 92, 0) 70%)',
                            opacity: 0.1,
                            filter: 'blur(80px)',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-10%',
                            right: '-10%',
                            width: '40%',
                            height: '40%',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1c1917 0%, rgba(28, 25, 23, 0) 70%)',
                            opacity: 0.05,
                            filter: 'blur(80px)',
                        }}
                    />

                    {/* Logo / Brand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#1c1917',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fafaf9',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            fontFamily: 'sans-serif'
                        }}>K</div>
                        <span style={{ fontSize: 24, letterSpacing: '0.1em', color: '#57534e', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>Kakebo</span>
                    </div>

                    {/* Title */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '0 60px',
                        }}
                    >
                        <h1
                            style={{
                                fontSize: 72,
                                fontWeight: 900,
                                color: '#1c1917',
                                lineHeight: 1.1,
                                margin: '0 0 20px 0',
                                letterSpacing: '-0.02em',
                                textWrap: 'balance',
                            }}
                        >
                            {title}
                        </h1>

                        <p
                            style={{
                                fontSize: 32,
                                color: '#57534e',
                                lineHeight: 1.4,
                                margin: 0,
                                maxWidth: '800px',
                                fontFamily: 'sans-serif',
                                fontWeight: 300,
                            }}
                        >
                            {description}
                        </p>
                    </div>

                    {/* Footer Decoration */}
                    <div style={{
                        position: 'absolute',
                        bottom: 40,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: 20,
                        color: '#a8a29e',
                        fontFamily: 'sans-serif',
                    }}>
                        <span>metodokakebo.com</span>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
