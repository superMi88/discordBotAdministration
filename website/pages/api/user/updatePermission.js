import { updateUser } from "../../../lib/app";

import cookie from "js-cookie"

export default async function handler(req, res) {

    if (req.method === 'POST') {
    
        const { updateUser } = require('/lib/app.js');
        const data = await updateUser(req.body.projectAlias, req.body.discordId, "permissions."+req.body.permission, req.body.value);
        
        res.status(200).json(data)
    
    } else {
        // Handle any other HTTP method
    }

}

export function getInfo(){
}
