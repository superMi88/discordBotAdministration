const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const PluginManager = require('../../discordBot/lib/PluginManager.js');
const dataManager = require('../../discordBot/lib/dataManager.js');
const { Events } = require('discord.js');

module.exports = {

    app: null,
    server: null,
    activeUsers: {},
    loginBridge: {},

    /**
     * @param {import('discord.js').Client} client 
     * @param {any} plugin 
     * @param {string} projectAlias 
     */
    async execute(client, plugin, projectAlias) {
        console.log(`[BongoApp] Plugin initialized for project: ${projectAlias}`);
        
        // Configuration from the database (UI fields)
        const pluginVar = plugin.var || {};
        
        // Use provided secret or fallback to process.env.JWT_SECRET
        const jwtSecret = pluginVar.jwtSecret || process.env.JWT_SECRET || "SUPER_SECRET_BONGO_KEY";
        
        // Use provided client ID or fallback to the current bot's ID
        const clientId = pluginVar.discordClientId || client.user.id;
        
        const clientSecret = pluginVar.discordClientSecret;
        
        // Construct redirect URI or use provided one
        const redirectUri = pluginVar.redirectUri || `http://localhost:3001/api/auth/discord/callback`;

        if (!clientSecret) {
            console.warn(`[BongoApp] WARNING: Discord Client Secret is missing! Auth will fail. Please set it in the plugin settings.`);
        }

        // Initialize state
        plugin.activeUsers = {};
        plugin.loginBridge = {};

        // Create HTTP server for both Express and Socket.io
        const app = express();
        const server = http.createServer(app);
        const io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        plugin.io = io;
        const port = 3001;

        /**
         * Helper: Signal an update for a user by their discord ID
         * @param {string} discordUserId 
         */
        const signalUserUpdate = (discordUserId) => {
            const bongoUsername = Object.keys(plugin.activeUsers).find(name => plugin.activeUsers[name].id === discordUserId);
            if (bongoUsername) {
                const now = new Date();
                plugin.activeUsers[bongoUsername].lastUpdated = now;
                io.emit('user_updated', { 
                    name: bongoUsername, 
                    ...plugin.activeUsers[bongoUsername] 
                });
                console.log(`[BongoApp] Auto-detected update for user: ${bongoUsername}`);
            }
        };

        // --- INTERACTION AUTO-DETECTION ---
        // Listen for waldspiel-related interactions that change the forest state
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.customId) return;

            const relevantPrefixes = [
                'selectedCustomization',
                'selectedAnimation',
                'setBackgroundCustomization',
                'changeName',
                'selectStorageDropdown',
                'sendToStorage',
                'selectedStorageDropdown'
            ];

            const isWaldspielUpdate = relevantPrefixes.some(prefix => 
                interaction.customId === prefix || interaction.customId.startsWith(prefix + '-')
            );

            if (isWaldspielUpdate) {
                // If it's a modal submit, we wait a bit for database consistency
                if (interaction.isModalSubmit()) {
                    setTimeout(() => signalUserUpdate(interaction.user.id), 2000);
                } else {
                    signalUserUpdate(interaction.user.id);
                }
            }
        });

        // Listen for general user updates (avatar, username etc)
        client.on(Events.UserUpdate, async (oldUser, newUser) => {
            signalUserUpdate(newUser.id);
        });

        app.use(cors());
        app.use(express.json());

        // Middleware to inject plugin context
        app.use((req, res, next) => {
            req.plugin = plugin;
            req.discordClient = client;
            req.projectAlias = projectAlias;
            req.jwtSecret = jwtSecret;
            next();
        });

        // JWT Middleware
        const verifyToken = (req, res, next) => {
            const token = req.headers['authorization']?.split(' ')[1];
            if (!token) return res.status(401).send({ error: 'No token provided' });

            jwt.verify(token, jwtSecret, (err, decoded) => {
                if (err) return res.status(403).send({ error: 'Failed to authenticate token' });
                req.user = decoded;
                next();
            });
        };

        // --- AUTH ENDPOINTS ---
        app.get('/api/auth/config', (req, res) => {
            res.json({ 
                clientId: clientId,
                projectAlias: projectAlias
            });
        });

        app.get('/api/auth/discord/callback', async (req, res) => {
            const { code, state } = req.query;
            if (!code) return res.status(400).send('No code provided');

            try {
                const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri
                }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

                const { access_token } = tokenResponse.data;
                const userResponse = await axios.get('https://discord.com/api/users/@me', {
                    headers: { Authorization: `Bearer ${access_token}` }
                });

                const userData = {
                    id: userResponse.data.id,
                    username: userResponse.data.username,
                    avatar: userResponse.data.avatar
                };

                const token = jwt.sign(userData, jwtSecret, { expiresIn: '7d' });

                if (state) {
                    plugin.loginBridge[state] = { token, user: userData };
                    setTimeout(() => delete plugin.loginBridge[state], 300000);
                }

                res.send('<h1>Erfolgreich!</h1><p>Du kannst dieses Fenster jetzt schließen und zurück zur Bongo App gehen.</p>');
            } catch (error) {
                console.error('Discord Auth Error:', error.response?.data || error.message);
                res.status(500).send('Authentication failed');
            }
        });

        app.get('/api/auth/check', (req, res) => {
            const { state } = req.query;
            if (plugin.loginBridge[state]) {
                const data = plugin.loginBridge[state];
                delete plugin.loginBridge[state];
                res.json({ success: true, ...data });
            } else {
                res.json({ success: false });
            }
        });

        // --- BONGO ENDPOINTS ---
        app.get('/api/bongo/active', verifyToken, (req, res) => {
            const now = new Date();
            const active = Object.keys(plugin.activeUsers)
                .filter(name => (now - plugin.activeUsers[name].lastSeen) < 120000)
                .map(name => ({
                    id: plugin.activeUsers[name].id,
                    name: name,
                    skin: plugin.activeUsers[name].skin,
                    isMe: name === req.user.username,
                    displayName: plugin.activeUsers[name].displayName,
                    lastUpdated: plugin.activeUsers[name].lastUpdated
                }));
            res.json(active);
        });

        app.post('/api/bongo/join', verifyToken, async (req, res) => {
            const { skin } = req.body;
            const name = req.user.username;
            const discordId = req.user.id;
            
            let displayName = name;
            try {
                const UserData = require('../../lib/UserData.js');
                const DatabaseManager = require('../../lib/DatabaseManager.js');
                const userData = await UserData.get(discordId);
                const waldspielData = userData.pluginData?.['waldspiel-643556763768cdbc42f8d899'];
                if (waldspielData && waldspielData.animalId2) {
                    const db = DatabaseManager.get();
                    const animal = await db.collection('animals').findOne({ _id: waldspielData.animalId2 });
                    if (animal && animal.name) {
                        displayName = animal.name;
                    }
                }
            } catch (e) {
                console.error(`[JOIN] Error fetching animal name: ${e.message}`);
            }

            const now = new Date();
            const userObj = { id: discordId, skin, lastSeen: now, lastUpdated: now, displayName };
            plugin.activeUsers[name] = userObj;
            
            io.emit('user_joined', { name, ...userObj });
            
            res.status(200).send({ status: 'joined', user: req.user, displayName });
        });

        app.post('/api/bongo/update', verifyToken, async (req, res) => {
            const name = req.user.username;
            const { skin } = req.body;
            
            if (plugin.activeUsers[name]) {
                const now = new Date();
                plugin.activeUsers[name].lastUpdated = now;
                if (skin) plugin.activeUsers[name].skin = skin;
                
                io.emit('user_updated', { name, ...plugin.activeUsers[name] });
                res.status(200).send({ status: 'updated', lastUpdated: now });
            } else {
                res.status(404).send({ error: 'User not joined' });
            }
        });

        app.post('/api/bongo/heartbeat', verifyToken, (req, res) => {
            const name = req.user.username;
            if (plugin.activeUsers[name]) {
                plugin.activeUsers[name].lastSeen = new Date();
            }
            res.status(200).send({ status: 'alive' });
        });

        app.post('/api/bongo/leave', verifyToken, (req, res) => {
            const name = req.user.username;
            delete plugin.activeUsers[name];
            io.emit('user_left', { name });
            res.status(200).send({ status: 'left' });
        });

        app.get('/api/bongo/render', async (req, res) => {
            const { userId, projectAlias: reqProjectAlias } = req.query;
            if (!userId) return res.status(400).json({ error: 'Missing userId' });

            try {
                const ImageCreator = require('../waldspiel/imageCreator.js');
                const UserData = require('../../lib/UserData.js');
                const DatabaseManager = require('../../lib/DatabaseManager.js');

                const currentProjectAlias = reqProjectAlias || projectAlias;
                await DatabaseManager.create(currentProjectAlias);

                const userData = await UserData.get(userId);
                if (!userData) return res.status(404).json({ error: 'User not found' });

                const waldspielData = userData.pluginData?.['waldspiel-643556763768cdbc42f8d899'];
                if (!waldspielData) return res.status(404).json({ error: 'Waldspiel data not found' });

                const renderResult = await ImageCreator.renderSingleAnimal(waldspielData, 2, userId);
                const frames = Array.isArray(renderResult) ? renderResult : renderResult.frames;

                res.status(200).json({ status: 'success', frames });
            } catch (error) {
                console.error("[Bongo Render API] Error:", error.message);
                res.status(500).json({ status: 'error', message: error.toString() });
            }
        });

        // Optional mock login for manual testing
        app.post('/api/auth/mock', (req, res) => {
            const mockUser = { id: '12345', username: req.body.username || 'BongoUser', avatar: null };
            const token = jwt.sign(mockUser, jwtSecret, { expiresIn: '1d' });
            res.json({ token, user: mockUser });
        });

        this.server = server.listen(port, async () => {
            console.log(`[BongoApp] Backend bridge with WebSockets running at http://localhost:${port}`);
        });

        io.on('connection', (socket) => {
            console.log("[BongoApp] New client socket connected");
            socket.on('disconnect', () => {
                console.log("[BongoApp] Client socket disconnected");
            });
        });

        plugin.server = this.server;
    },

    async save(pluginInstance, config, projectAlias) {
        // Save the settings from cache to database
        let status = await PluginManager.save(pluginInstance, config);
        if (!status.saved) return status;

        // Restart the Express server with new settings
        if (pluginInstance.server) {
            console.log(`[BongoApp] Restarting Express server to apply new settings...`);
            pluginInstance.server.close();
        }

        // Re-execute to start with new pluginInstance.var
        await this.execute(dataManager.client, pluginInstance, projectAlias);

        return { saved: true, infoMessage: "Einstellungen gespeichert und Server neu gestartet", infoStatus: "Info" };
    }

};
