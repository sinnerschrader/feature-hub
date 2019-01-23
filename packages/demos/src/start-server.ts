import express from 'express';
import getPort from 'get-port';
import {Server} from 'http';
import webpack from 'webpack';
import devMiddleware from 'webpack-dev-middleware';

export interface AppRendererOptions {
  port: number;
  req: express.Request;
}

export interface AppRendererResult {
  html: string;
  serializedStates?: string;
}

export type AppRenderer = (
  options: AppRendererOptions
) => Promise<AppRendererResult>;

function createDocumentHtml(
  bodyHtml: string,
  serializedStates?: string
): string {
  const serializedStatesScript = serializedStates
    ? `<script type="x-feature-hub/serialized-states">${serializedStates}</script>`
    : '';

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        ${bodyHtml}
        ${serializedStatesScript}
        <script src="integrator.js"></script>
      </body>
    </html>
  `;
}

export async function startServer(
  webpackConfigs: webpack.Configuration[],
  renderApp: AppRenderer | undefined,
  demoName?: string
): Promise<Server> {
  const port = await getPort(demoName ? {port: 3000} : undefined);
  const app = express();

  app.get('/', async (req, res) => {
    try {
      const {html: appHtml = '', serializedStates = ''} = renderApp
        ? await renderApp({port, req})
        : {};

      res.send(createDocumentHtml(`<main>${appHtml}</main>`, serializedStates));
    } catch (error) {
      const documentHtml = demoName
        ? createDocumentHtml(`
            <div class="bp3-callout bp3-intent-danger">
              <h4 class="bp3-heading">Failed to render demo "${demoName}"</h4>
              <pre>${error.stack}</pre>
            </div>
          `)
        : error;

      res.send(documentHtml).status(500);
    }
  });

  app.use(devMiddleware(webpack(webpackConfigs), {publicPath: '/'}));

  return new Promise<Server>(resolve => {
    const server = app.listen(port, () => resolve(server));
  });
}
