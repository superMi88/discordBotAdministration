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

        const UserData = require('../../../../lib/UserData.js');
        const DatabaseManager = require('../../../../lib/DatabaseManager.js');

        await DatabaseManager.create(req.body.projectAlias);
        
        // Use UserData.find to get populated UserData objects
        // We need to build the search query manually as before
        const searchName = req.body.searchName;
        const selectedServer = req.body.selectedServer;
        let searchObj = {};
        if (searchName || selectedServer) {
            searchObj = { $and: [] };
        }

        if (searchName) {
            searchObj.$and.push({
                $or: [
                    { "username": new RegExp(searchName, 'i') },
                    { "discriminator": new RegExp(searchName, 'i') },
                    { "discordId": new RegExp(searchName, 'i') }
                ]
            });
        }

        if (selectedServer) {
            searchObj.$and.push({
                guilds: { $elemMatch: { guildId: selectedServer, onServer: true } }
            });
        }

        const users = await UserData.find(searchObj);
        const db = DatabaseManager.get();
        const collection = db.collection('userCollection');
        const rawDocs = await collection.find(searchObj).toArray();

        // Create a lookup map for raw docs to get username/avatar etc.
        const docMap = new Map();
        rawDocs.forEach(d => docMap.set(d.discordId, d));

        const response = users.map(user => {
            const rawDoc = docMap.get(user.discordId) || {};
            return {
                ...rawDoc,
                pluginData: user.pluginData,
                currency: user.currency,
                _id: undefined
            };
        });

        res.status(200).json(response)

    } else {
        // Handle any other HTTP method
    }

}