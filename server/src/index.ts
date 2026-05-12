// Process entry. `App` extends `DyNTS_AppExtended` from `@futdevpro/nts-dynamo`,
// which handles Mongo connect, routing module wiring, auth, socket server,
// and global error handler bootstrap. See `app.server.ts`.

import 'dotenv/config';

import { App } from './app.server';

new App();
