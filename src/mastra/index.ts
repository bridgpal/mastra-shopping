import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { NetlifyDeployer } from '@mastra/deployer-netlify';
import { LibSQLStore } from '@mastra/libsql';
import { shoppingAgent } from './agents';

//Deployer stub has to be here for netlify
export const mastra = new Mastra({
  agents: { shoppingAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
  storage: new LibSQLStore({
    url: 'file:../mastra.db',
  }),
  deployer: new NetlifyDeployer({
    scope: 'your-team-slug',
    projectName: 'your-project-name',
    token: 'your-netlify-token'
  })
});
