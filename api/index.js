'use strict';
// Vercel serverless entry point.
// NestJS is pre-compiled to dist/ by the buildCommand ("prisma generate && nest build").
// ncc bundles this file and resolves require('../dist/serverless') at bundle time.
const { handler } = require('../dist/serverless');
module.exports = handler;
