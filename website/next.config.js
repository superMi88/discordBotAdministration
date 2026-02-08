/**
 * @type {import('next').NextConfig}
 */
 module.exports = {
    images: {
      domains: [
        'cdn.discordapp.com',
        'api-cdn.myanimelist.net'
      ],
    },

    async headers() {
      return [
        {
          source: '/lia',
          headers: [
            {
              key: 'x-custom-header',
              value: 'my custom header value',
            },
            {
              key: 'x-another-custom-header',
              value: 'my other custom header value',
            },
          ],
        },
      ]
    },
}