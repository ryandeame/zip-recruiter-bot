import 'dotenv/config';
import Puppet from "#puppet/index.js";

async function main() {

  const puppet = await Puppet.getInstance();

  await puppet.disconnect();

}

main();