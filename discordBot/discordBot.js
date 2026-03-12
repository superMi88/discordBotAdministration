// Force canvas to load before sharp to prevent DLL conflicts on Windows (ERR_DLOPEN_FAILED)
try { require('canvas'); } catch (ignore) { }

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { Message, User, Partials } = require('discord.js');

const fs = require('fs');
const { Client, Collection, IntentsBitField, CommandInteractionOptionResolver } = require('discord.js');
const helper = require("./lib/helper.js");
const log = require("./lib/log.js");


//erstelle Plugin Manager for this Bot
let PluginManager = require("./lib/PluginManager.js");
let dataManager = require("./lib/dataManager.js");


//MaxListenersExceededWarning > 10
require('events').EventEmitter.prototype._maxListeners = 17;
require('events').defaultMaxListeners = 17;

//get clientId and token from fork
let botStruct = {
    client: null,
    status: 'offline',//starting //online //offline
    clientId: process.argv[2],
    token: process.argv[3],
    ownerId: process.argv[4],
    projectAlias: process.argv[5],
};

//daten überall erreichbar machen
dataManager.status = botStruct.status
dataManager.clientId = botStruct.clientId
dataManager.token = botStruct.token
dataManager.ownerId = botStruct.ownerId
dataManager.projectAlias = botStruct.projectAlias


var CronJob = require('cron').CronJob;
const ipc = require('node-ipc').default;


let allPlugins = []

let objCommand = {
    commands: new Map()
}


// Use connect method to connect to the server
discordBot()
async function discordBot() {

    let DatabaseManager = require("./lib/DatabaseManager.js");
    await DatabaseManager.create(botStruct.projectAlias)

    let db = DatabaseManager.get()


    ipc.config.id = 'discordBot' + botStruct.clientId;
    ipc.config.retry = 1500;
    ipc.config.silent = true;

    ipc.serve(() => ipc.server.on('WebserverRequest', async (data, socket) => {

        try {
            var request = require('./request/' + data.command);

            await request.execute(ipc, botStruct, data, socket, createClient, db, allPlugins)
        } catch (e) {
            console.log("[Bot] " + data.command + " -> request konnte nicht verarbeitet werden, command für den bot exestiert nicht")
            console.log(e)
        }

    }));
    ipc.server.start();

    // Kill this bot process if the parent process (index.js) dies/disconnects
    process.on('disconnect', () => {
        console.log(`[Bot ${botStruct.clientId}] Parent disconnected! Exiting process...`);
        process.exit(0);
    });

    process.on('message', async (data) => {
        //console.log('Message from parent:', data.command);
        try {
            var request = require('./requestNode/' + data.command);
            let returndata = await request.execute(botStruct, data)
            process.send(returndata);
        } catch (e) {
            console.log("[Bot] " + data.command + " -> request konnte nicht verarbeitet werden, command für den bot exestiert nicht")
            console.log(e)
        }
    });

    const rest = new REST({ version: '9' }).setToken(botStruct.token);

    botStruct.client = await createClient(db);

    //daten überall erreichbar machen
    dataManager.client = botStruct.client


    botStruct.client.login(botStruct.token).then(async () => {

        botStruct.status = 'online'
        var path = require('path');
        process.send("READY");

    }).catch((error) => {
        console.log(error.code)
        if (error.code === "TOKEN_INVALID") {
            process.send("TOKEN_INVALID");
            //bot wird nicht erstellt token invalid
        }
        else if (error.code === "DISALLOWED_INTENTS") {
            process.send("DISALLOWED_INTENTS");
            //bot wird nicht erstellt token invalid
        } else {
            process.send("UNKNOWN_ERROR");
        }
    })

    //only for debug ende*/
    return ("ferig erstellt");
}

async function createClient(db) {


    //add all Intents
    const myIntents = new IntentsBitField()
    myIntents.add(
        IntentsBitField.Flags.AutoModerationConfiguration,
        IntentsBitField.Flags.AutoModerationExecution,
        IntentsBitField.Flags.DirectMessageReactions,
        IntentsBitField.Flags.DirectMessageTyping,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.GuildBans,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildScheduledEvents,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildWebhooks,
        IntentsBitField.Flags.GuildEmojisAndStickers,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.MessageContent
    );

    let client = new Client(
        { intents: myIntents, partials: [Partials.Message, Partials.Channel, Partials.Reaction] }
    );

    client.setMaxListeners(50);

    client.commands = new Collection();

    require("./error_handler.js")(client, db)





    client.on('ready', async () => {

        const collection = db.collection('userCollection');
        var ObjectId = require('mongodb').ObjectId;


        // save/update Name, Image, Nickname for guild for bot offline time
        const OAuth2GuildArray = await client.guilds.fetch();

        let allUserInDatabase = await collection.find({}).toArray()




        OAuth2GuildArray.forEach(async (OAuth2Guild) => {
            let guild = await OAuth2Guild.fetch()
            let memberArray = await guild.members.fetch()

            let isOnServer = async function () {

                for (const databaseUser of allUserInDatabase) {


                    let x = false
                    for (const member of memberArray) {

                        if (member[1].user.id === databaseUser.discordId) {
                            x = true
                        }
                    }

                    if (!x) {
                        const collection = db.collection('userCollection');
                        var ObjectId = require('mongodb').ObjectId;

                        let result = await collection.findOneAndUpdate(
                            { discordId: databaseUser.discordId, ["guilds.guildId"]: guild.id },
                            { $set: { ["guilds.$.onServer"]: false } }
                        );

                        if (result.value === null) {
                            let result = await collection.findOneAndUpdate(
                                { discordId: databaseUser.discordId },
                                {
                                    $push: {
                                        ["guilds"]: {
                                            guildId: guild.id,
                                            onServer: false
                                        }
                                    }
                                }
                            );
                        }
                    }
                }//)


            }

            let boolIsOnServer = await isOnServer()

            memberArray.forEach(async (member) => {
                if (!member.user.bot) {

                    //console.log(member)

                    if (member.user) {

                        let newUser = await member.user.fetch()
                        await userUpdate(newUser, db)
                    }

                    await guildMemberUpdate(member, db, true)
                }
            });
        });

        log.write("Client ready")
        await saveLiaDaten(client.user.id, client.user.username, client.user.discriminator, client.user.avatar, botStruct.token, botStruct.ownerId, db);
        const clientFromDatabase = await getBotFromDatabase(client.user.id, db)

        //PluginManager.allPlugins = allPlugins
        await PluginManager.createPluginManager(client.user.id, db, client)

        //PluginManager muss bereits erstellt sein
        await PluginManager.reloadSlashCommands()
        await PluginManager.reloadEvents()

    });

    client.on('userUpdate', async (oldUser, newUser) => {

        //force fetch to get banner
        if (newUser.user) {

            newUser = await newUser.user.fetch()
            await userUpdate(newUser, db)
        }

    });

    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        await guildMemberUpdate(newMember, db, true)
    });

    client.on('guildMemberRemove', async (member) => {
        await guildMemberUpdate(member, db, false)
    });

    client.on('guildMemberAdd', async (member) => {
        await userUpdate(member.user, db)
        await guildMemberUpdate(member, db, true)
    });




    return client;
}

async function guildMemberUpdate(newMember, db, onServer) {

    const collection = db.collection('userCollection');
    var ObjectId = require('mongodb').ObjectId;

    let result = await collection.findOneAndUpdate(
        { discordId: newMember.user.id, ["guilds.guildId"]: newMember.guild.id },
        { $set: { ["guilds.$.nickname"]: newMember.nickname, ["guilds.$.onServer"]: onServer } },
    );

    if (result.value === null) {

        let result = await collection.findOneAndUpdate(
            { discordId: newMember.user.id },
            {
                $push: {
                    ["guilds"]: {
                        guildId: newMember.guild.id,
                        nickname: newMember.nickname,
                        onServer: onServer
                    }
                }
            }
        );

    }

    return null;
}

async function userUpdate(newUser, db) {

    const collection = db.collection('userCollection');

    let result = await collection.updateOne(
        { discordId: newUser.id },
        {
            $set: {
                username: newUser.username,
                globalName: newUser.globalName,
                discriminator: newUser.discriminator,
                avatar: newUser.avatar,
                banner: newUser.banner,
                accentColor: newUser.accentColor
            }
        },
        { upsert: true }
    );

    return result;
}

async function getBotFromDatabase(id, db) {

    const collection = db.collection('botCollection');
    const filteredDocs = await collection.findOne({ id: id });
    return filteredDocs;
}


async function saveLiaDaten(id, username, discriminator, avatar, token, ownerId, db) {

    const botCollection = db.collection('botCollection');

    /*add User to Database if he doesnt exist yet*/
    const filteredDocs = await botCollection.find({ id: id }).toArray();

    if (filteredDocs.length <= 0) {

        const insertResult = await botCollection.insertOne(
            {
                id: id,
                ownerId: ownerId,
                username: username,
                discriminator: discriminator,
                avatar: avatar,
                token: token
            }
        )

        log.write("Bot Information added")

    } else {

        const updatedDocs = await botCollection.findOneAndUpdate(
            {
                id: id
            },
            {
                $set: {
                    ownerId: ownerId,
                    username: username,
                    discriminator: discriminator,
                    avatar: avatar,
                    token: token
                }
            }
        )
        log.write("Bot Information updated")
    }

    return 'done.';
}



//------------------------------------------------------------------------------------------
//unused for test and stuff
function deleteAllGlobalCommands() {
    const rest = new REST({ version: '9' }).setToken(botStruct.token);
    rest.get(Routes.applicationCommands(botStruct.clientId))
        .then(data => {

            const promises = [];
            for (const command of data) {
                const deleteUrl = `${Routes.applicationCommands(botStruct.clientId)}/${command.id}`;
                promises.push(rest.delete(deleteUrl));
            }
            return Promise.all(promises);
        });
}

