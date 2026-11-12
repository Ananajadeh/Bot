module.exports = {
  apps: [
    {
      name: 'nayxilaa-md',
      script: 'index.js',
      cwd: '/root/proyek',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
