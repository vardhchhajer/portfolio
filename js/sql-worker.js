// sql-worker.js — Web Worker for sql.js (NOT an ES module, uses importScripts)

/* global importScripts, initSqlJs, self */

let db = null;

self.onmessage = async function (e) {
  const { type, payload, id } = e.data;

  switch (type) {
    case 'init': {
      try {
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js');
        const SQL = await initSqlJs({
          locateFile: (f) =>
            `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`,
        });
        db = new SQL.Database();
        db.run(payload.seedSql);
        self.postMessage({ id, type: 'ready' });
      } catch (err) {
        self.postMessage({ id, type: 'error', error: 'Failed to initialize database: ' + err.message });
      }
      break;
    }

    case 'exec': {
      if (!db) {
        self.postMessage({ id, type: 'error', error: 'Database not initialized.' });
        return;
      }
      const query = (payload.query || '').trim();
      if (!/^SELECT/i.test(query)) {
        self.postMessage({
          id,
          type: 'error',
          error: 'Only SELECT queries are allowed in this demo.',
        });
        return;
      }
      try {
        const results = db.exec(query);
        self.postMessage({ id, type: 'result', data: results });
      } catch (err) {
        self.postMessage({ id, type: 'error', error: err.message });
      }
      break;
    }

    case 'insert': {
      if (!db) {
        self.postMessage({ id, type: 'error', error: 'Database not initialized.' });
        return;
      }
      try {
        db.run(payload.sql);
        self.postMessage({ id, type: 'inserted' });
      } catch (err) {
        self.postMessage({ id, type: 'error', error: err.message });
      }
      break;
    }

    case 'reset': {
      try {
        if (db) db.close();
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js');
        const SQL2 = await initSqlJs({
          locateFile: (f) =>
            `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`,
        });
        db = new SQL2.Database();
        db.run(payload.seedSql);
        self.postMessage({ id, type: 'ready' });
      } catch (err) {
        self.postMessage({ id, type: 'error', error: 'Failed to reset database: ' + err.message });
      }
      break;
    }
  }
};
