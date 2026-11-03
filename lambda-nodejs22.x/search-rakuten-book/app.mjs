import axios from "axios";
import { createHandler } from "./handler.mjs";

export const lambdaHandler = createHandler({ httpGet: (url, config) => axios.get(url, config) });
