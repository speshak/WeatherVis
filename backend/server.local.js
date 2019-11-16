const app = require('./server')

PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Weather Vis listening on ${PORT}!`);
});
