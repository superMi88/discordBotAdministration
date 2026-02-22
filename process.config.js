module.exports = {
  apps: [
    {
      name: 'website',
      cwd: './',
      script: 'npm',
      args: 'run web:start',
    },
    {
      name: 'discordBot',
      cwd: './',
      script: 'discordBot/index.js',
      node_args: '--max-old-space-size=8192 --no-warnings',
    },
  ],
};