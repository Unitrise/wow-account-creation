module.exports = {
  apps: [
    {
      name: 'wow-client-server',
      script: 'dist/server/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      cwd: __dirname,
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}; 