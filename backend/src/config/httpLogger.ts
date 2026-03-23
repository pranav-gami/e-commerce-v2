import morgan from "morgan";
import { logger } from "../utils/logger";

export const httpLogger = morgan("combined", {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});
