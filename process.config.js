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
      script: 'npm',
      args: 'run bot:dev',
    },
  ],
};