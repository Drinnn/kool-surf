import supertest from 'supertest';
import { SetupSever } from '@src/server';

beforeAll(() => {
  const server = new SetupSever();
  server.init();
  global.testRequest = supertest(server.getApp());
});
