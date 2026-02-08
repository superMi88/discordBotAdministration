export default async function handler(req, res) {

    if (req.method === 'POST') {

        const body = req.body

        const stuff = await getToken(body.code)   
        
        console.log(body.code)

        //die userdaten von discord mit token und refresh token
        const userinfo = await getUserinfos(stuff.token_type, stuff.access_token, stuff.refresh_token);

        //const imgsrc = `https://cdn.discordapp.com/avatars/${userinfo.id}/${userinfo.avatar}.webp`
        
        //wenn userdaten gesetzt sind in datenbank abspeichern
        let userExistBool = false
        let jwt = false

        //bedeutet sozusagen hier nur das der user exestiert 
        if(userinfo.verified){
            const { getWebsiteUser, createNewWebsiteUser } = require('/lib/app.js');


            /* setup wird erst in einer zukünftigen version angeboten
            if(body.setup){
                await createNewWebsiteUser(userinfo.id);  
            }
            */

            const websiteUser = await getWebsiteUser(userinfo.id);  
            
            const jsonwebtoken = require("jsonwebtoken");

            console.log(userinfo)

            const payload = {
                userId: userinfo.id,
                username: userinfo.username,
                admin: websiteUser.admin,
                projects: websiteUser.projects,
                access_token: stuff.access_token,
                refresh_token: stuff.refresh_token
            };

            const secret = process.env.JWT_SECRET; // Geheimnis, das zum Signieren des Tokens verwendet wird

            // Erstelle das JWT mit einer Ablaufzeit von 24 Stunden
            const token = jsonwebtoken.sign(payload, secret, { expiresIn: "24h" });

            console.log("JWT Token:", token);

            console.log(websiteUser)

            jwt = token
            userExistBool = true

        }



        res.status(200).json({
            login: true,
            jwt: jwt
        })
    } else {
        // Handle any other HTTP method
    }

}




//https://stackoverflow.com/questions/65237821/400-error-when-requesting-a-token-from-discord-api
//https://www.youtube.com/watch?v=gg40nfS0pTU
async function getToken(code) {

    const { clientId, clientSecret, url } = require('/../discordBot.config.json');
    
    const api_endpoint = 'https://discord.com/api/oauth2/token'

    const req = await fetch(api_endpoint, {
        method: "POST",
        header: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            'client_id': clientId,
            'client_secret': clientSecret,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': url+"admin/login/",
            'scope': 'identify'
        })
    })
    const response = await req.json();

    return response;
}

async function getUserinfos(token_type, access_token, refresh_token) {

    const req = await fetch("https://discord.com/api/users/@me", {
        headers: {
            'Authorization': `${token_type} ${access_token}`
        }
    })
    const response = await req.json();
    //dem response den access token anhängen damit er clientseitig gespeichert werden kann
    response['access_token'] = access_token
    response['refresh_token'] = refresh_token



    return response;
}
