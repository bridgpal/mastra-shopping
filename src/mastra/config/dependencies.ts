import { IProductRepository } from '../data/interfaces/IProductRepository';
import { CommerceToolsRepository } from '../data/repositories/CommerceToolsRepository';
import { config } from '../../config';

export const configureServices = () => {
  const productRepository: IProductRepository = new CommerceToolsRepository({
    projectKey: config.commercetools.projectKey,
    clientId: config.commercetools.clientId,
    clientSecret: config.commercetools.clientSecret,
    apiUrl: config.commercetools.apiUrl,
    authUrl: config.commercetools.authUrl,
    scope: config.commercetools.scope,
  });

  return { productRepository };
}; 