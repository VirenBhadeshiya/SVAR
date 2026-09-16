import localtunnel from 'localtunnel';

async function start() {
  try {
    const tunnel = await localtunnel({
      port: 3000,
      subdomain: 'svar-garba-2026'
    });

    console.log('----------------------------------------------------');
    console.log('CUSTOM GLOBAL URL IS ACTIVE:');
    console.log(tunnel.url);
    console.log('----------------------------------------------------');

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (e) {
    console.error('Tunnel error:', e);
  }
}

start();
