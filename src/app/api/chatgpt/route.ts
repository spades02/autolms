import { NextResponse } from "next/server";


export const POST = async ( req: Request, res: Response ) => {


    const { text } = await req.json();

    try {
        const response = await fetch( 'https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${ process.env.OPENAI_API_KEY }`
            },
            body: JSON.stringify( {
                model: "gpt-3.5-turbo",
                messages: [

                    {
                        "role":"system",
                        "content": text
                    }

                    
                ],
            } )
        } );

        const responsedata = await response.json();
        const reply = responsedata.choices[0].message.content;
        console.log("replyyyyyyy", reply)

        return Response.json(reply);


    } catch ( error: any ) {
        return NextResponse.json( { error: error.message } );
    }

}