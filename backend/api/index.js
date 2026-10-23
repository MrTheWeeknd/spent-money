// Entrada serverless da Vercel. O app Nest (e sua conexão Mongo) é criado uma vez
// por container e reaproveitado nas invocações seguintes enquanto o container estiver quente.
const { createApp } = require('../dist/bootstrap');

let serverPromise;

function getServer() {
  if (!serverPromise) {
    serverPromise = createApp()
      .then(async (app) => {
        await app.init();
        return app.getHttpAdapter().getInstance();
      })
      .catch((err) => {
        serverPromise = undefined;
        throw err;
      });
  }
  return serverPromise;
}

module.exports = async (req, res) => {
  const server = await getServer();
  return server(req, res);
};
