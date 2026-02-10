export default async function handler(req, res) {

    if (req.method === 'POST') {

        const body = req.body

        const stuff = await getToken(req, body.projectAlias, body.code)

        console.log(body.code)

        //die userdaten von discord mit token und refresh token
        const userinfo = await getUserinfos(stuff.token_type, stuff.access_token, stuff.refresh_token);

        //const imgsrc = `https://cdn.discordapp.com/avatars/${userinfo.id}/${userinfo.avatar}.webp`

        //wenn userdaten gesetzt sind in datenbank abspeichern
        let userExistBool = false
        let jwt = false

        //bedeutet sozusagen hier nur das der user exestiert 
        if (userinfo.verified) {
            const { getWebsiteUser, createNewWebsiteUser } = require('../../lib/app');


            /* setup wird erst in einer zukünftigen version angeboten
            if(body.setup){
                await createNewWebsiteUser(body.projectAlias, userinfo.id);  
            }
            */

            let websiteUser = await getWebsiteUser(body.projectAlias, userinfo.id);

            // Prüfen ob User nicht existiert (potenzieller First-Joiner)
            if (!websiteUser) {
                const { createNewWebsiteUser } = require('../../lib/app');
                const result = await createNewWebsiteUser(body.projectAlias, userinfo.id);
                if (result.login) {
                    websiteUser = await getWebsiteUser(body.projectAlias, userinfo.id);
                    console.log(`[Login] First User for ${body.projectAlias}! Created new Admin User (${userinfo.username}).`);
                }
            }

            const jsonwebtoken = require("jsonwebtoken");

            console.log(userinfo)

            if (websiteUser) {
                let isAdmin = websiteUser.admin;

                const payload = {
                    userId: userinfo.id,
                    username: userinfo.username,
                    admin: isAdmin,
                    project: body.projectAlias, // Jetzt projektbezogen
                    access_token: stuff.access_token,
                    refresh_token: stuff.refresh_token
                };

                const secret = process.env.JWT_SECRET; // Geheimnis, das zum Signieren des Tokens verwendet wird

                // Erstelle das JWT mit einer Ablaufzeit von 24 Stunden
                const token = jsonwebtoken.sign(payload, secret, { expiresIn: "24h" });

                console.log("JWT Token:", token);

                jwt = token
                userExistBool = true
            } else {
                console.log(`[Login] Access denied for user ${userinfo.username} on project ${body.projectAlias}. User not found in DB.`);
                userExistBool = false
                jwt = false
            }

        }


        res.status(200).json({
            login: userExistBool,
            jwt: jwt
        })
    } else {
        // Handle any other HTTP method
    }

}




//https://stackoverflow.com/questions/65237821/400-error-when-requesting-a-token-from-discord-api
//https://www.youtube.com/watch?v=gg40nfS0pTU
async function getToken(req, projectAlias, code) {

    const { clientId, clientSecret } = require('../../../discordBot.config.json');

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const url = `${protocol}://${host}/admin/callback/`;

    const api_endpoint = 'https://discord.com/api/oauth2/token'

    const response = await fetch(api_endpoint, {
        method: "POST",
        header: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            'client_id': clientId,
            'client_secret': clientSecret,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': url,
            'scope': 'identify'
        })
    })
    const data = await response.json();

    return data;
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
