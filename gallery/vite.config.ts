import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const nm = (p: string) => path.join(here, 'node_modules', p);

/** Serves the agent manifest straight from meta/ during dev. Nothing is written to disk. */
function manifest(): Plugin {
  return {
    name: 'fx-manifest',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/llms-components.txt' && req.url !== '/components.json') return next();
        try {
          const mod = await server.ssrLoadModule(path.resolve(here, '../meta/docs.ts'));
          const body = req.url === '/components.json' ? JSON.stringify(mod.libraryJson(), null, 2) : mod.libraryManifest();
          res.setHeader('Content-Type', req.url.endsWith('.json') ? 'application/json' : 'text/plain; charset=utf-8');
          res.end(body);
        } catch (e) {
          res.statusCode = 500;
          res.end(String(e));
        }
      });
    },
  };
}

// The effect sources live one folder up (shared-effects/). They import react,
// remotion and ogl by bare name, so point those names at this app's install.
export default defineConfig({
  root: here,
  plugins: [react(), manifest()],
  resolve: {
    alias: [
      {find: /^react$/, replacement: nm('react')},
      {find: /^react\/(.*)$/, replacement: nm('react') + '/$1'},
      {find: /^react-dom$/, replacement: nm('react-dom')},
      {find: /^react-dom\/(.*)$/, replacement: nm('react-dom') + '/$1'},
      {find: /^remotion$/, replacement: nm('remotion')},
      {find: /^ogl$/, replacement: nm('ogl')},
      {find: /^three$/, replacement: nm('three')},
      {find: /^@remotion\/motion-blur$/, replacement: nm('@remotion/motion-blur')},
    ],
    dedupe: ['react', 'react-dom', 'remotion'],
  },
  server: {host: '127.0.0.1', fs: {allow: [path.resolve(here, '..')]}},
  preview: {host: '127.0.0.1'},
});
