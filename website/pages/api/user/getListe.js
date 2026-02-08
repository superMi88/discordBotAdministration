import { CommandInteractionOptionResolver } from "discord.js";

import cookie from "js-cookie"


/*
{
    responseDiscord: {
      id: '216604763003813888',
      username: 'Lowa',
      avatar: '592120175ee4bcddfa9917a395da9604',
      avatar_decoration: null,
      discriminator: '0002',
      public_flags: 256,
      flags: 256,
      banner: null,
      banner_color: null,
      accent_color: null,
      locale: 'de',
      mfa_enabled: true,
      premium_type: 1,
      email: 'rainer.blechinger@web.de',
      verified: true
    },
    permissions: { 
        botCommands: true, 
        botPicture: true, 
        admin: true 
    }
  }

*/

export default async function handler(req, res) {

    if (req.method === 'POST') {
    
        const { getAllUser,  } = require('/lib/app.js');
        const data = await getAllUser(req.body.projectAlias, req.body);

        let response = [];
        
        for (let i = 0; i < data.length; i++) {
            const discordUserDatabbaseData = data[i];
            delete discordUserDatabbaseData['_id'];
            response.push(discordUserDatabbaseData)
        }

    
        res.status(200).json(response)
    
    } else {
        // Handle any other HTTP method
    }

}