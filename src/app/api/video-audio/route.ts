import { NextResponse } from "next/server";

export const POST = async (req: Request, res : NextResponse) => {

    const { url } = await req.json();

    try {
        const response = await fetch('https://api.apyhub.com/extract/video/audio/url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apy-token': 'APY0irhMenVnhQRwduzPs2r0I2Zvea7XIn049N3dy6vQk0Iks2gRG4sxeSDwvb3w6TTtExXgyQb',

            },
            body: JSON.stringify({
                "video_url": url,
            })
        });

        const responsedata = await response.json();
        console.log(responsedata)
        
        return NextResponse.json(responsedata);

        
    } catch (error: any) {
        return NextResponse.json(error.message, { status: 500 });
    }
    
    

}