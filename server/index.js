const { createApp } = require("./src/app");

async function main() {
  const port = Number.parseInt(process.env.PORT || "3000", 10);
  const app = await createApp();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`sold.bd API listening on :${port}`);
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
