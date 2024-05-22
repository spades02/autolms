import { initApyhub } from "apyhub";
const apy = initApyhub(process.env.APY_TOKEN as string);

export { apy };