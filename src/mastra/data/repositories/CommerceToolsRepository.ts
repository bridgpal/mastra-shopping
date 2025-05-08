import {
  ClientBuilder,
  type AuthMiddlewareOptions,
  type HttpMiddlewareOptions,
  type Client
} from '@commercetools/sdk-client-v2';
import { 
  createApiBuilderFromCtpClient,
  ApiRoot,
  Product,
  ProductVariant,
  Store,
  ProductProjection
} from '@commercetools/platform-sdk';
import { IProductRepository, IProduct, SearchOptions, StoreInfo, Category } from '../interfaces/IProductRepository';

interface CommerceToolsConfig {
  projectKey: string;
  clientId: string;
  clientSecret: string;
  apiUrl: string;
  authUrl: string;
  scope?: string;
}

export class CommerceToolsRepository implements IProductRepository {
  private client: Client;
  private apiRoot: ApiRoot;
  private projectKey: string;

  constructor(config: CommerceToolsConfig) {
    this.projectKey = config.projectKey;
    const authMiddlewareOptions: AuthMiddlewareOptions = {
      host: config.authUrl,
      projectKey: config.projectKey,
      credentials: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      },
      scopes: [config.scope || `manage_project:${config.projectKey}`],
      fetch,
    };


    const httpMiddlewareOptions: HttpMiddlewareOptions = {
      host: config.apiUrl,
      fetch,
    };

    this.client = new ClientBuilder()
      .withProjectKey(config.projectKey)
      .withClientCredentialsFlow(authMiddlewareOptions)
      .withHttpMiddleware(httpMiddlewareOptions)
      .build();

    this.apiRoot = createApiBuilderFromCtpClient(this.client);
  }

  private mapToProduct(product: any): IProduct {    
    const masterVariant = product.masterVariant;
    
    if (!masterVariant) {
      throw new Error('No master variant found in product');
    }

    return {
      id: product.id,
      title: product.name?.['en-US'] || product.name?.en || 'No title available',
      description: product.description?.['en-US'] || product.description?.en || '',
      price: {
        amount: masterVariant.prices?.[0]?.value?.centAmount 
          ? masterVariant.prices[0].value.centAmount / 100 
          : 0,
        currencyCode: masterVariant.prices?.[0]?.value?.currencyCode || 'USD'
      },
      image: masterVariant.images?.[0]?.url || '',
      variants: product.variants?.map((variant: ProductVariant) => ({
        id: String(variant.id),
        sku: variant.sku || '',
        price: {
          amount: variant.prices?.[0]?.value?.centAmount 
            ? variant.prices[0].value.centAmount / 100 
            : 0,
          currencyCode: variant.prices?.[0]?.value?.currencyCode || 'USD'
        },
        attributes: variant.attributes || []
      })) || []
    };
  }

  async searchProducts(query: string, options?: SearchOptions): Promise<IProduct[]> {
    try {
      
      const response = await this.apiRoot
        .withProjectKey({ projectKey: this.projectKey })
        .productProjections()
        .search()
        .get({
          queryArgs: {
            'text.en-US': query,
            limit: options?.limit || 6,
            offset: options?.offset || 0,
            staged: true,
            ...(options?.category && { 'categories.id': options.category }),
            ...(options?.priceRange && {
              'variants.prices.value.centAmount:range': [
                options.priceRange.min ? options.priceRange.min * 100 : '*',
                options.priceRange.max ? options.priceRange.max * 100 : '*'
              ].join(' to ')
            })
          }
        })
        .execute();
      

      return response.body.results.map(this.mapToProduct);
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<IProduct> {
    const response = await this.apiRoot
      .withProjectKey({ projectKey: this.projectKey })
      .products()
      .withId({ ID: id })
      .get()
      .execute();
    
    return this.mapToProduct(response.body);
  }

  async getProductsByCategory(category: string): Promise<IProduct[]> {
    const response = await this.apiRoot
      .withProjectKey({ projectKey: this.projectKey })
      .products()
      .get({
        queryArgs: {
          'categories.id': category,
          limit: 20
        }
      })
      .execute();
    
    return response.body.results.map(this.mapToProduct);
  }

  async getStoreInfo(): Promise<StoreInfo> {
    try {
      const response = await this.apiRoot
        .withProjectKey({ projectKey: this.projectKey })
        .stores()
        .get()
        .execute();

      const store = response.body.results[0];

      if (!store) {
        throw new Error('No store configuration found');
      }

      // Map Commerce Tools store data to our StoreInfo interface
      return {
        hours: store.custom?.fields?.hours || 'Our store is open Monday-Friday 9am-8pm, Saturday 10am-6pm, and Sunday 11am-5pm EST.',
        returns: store.custom?.fields?.returns || 'We offer a 30-day return policy on all unused items in original packaging. Return shipping is free.',
        shipping: store.custom?.fields?.shipping || 'Free standard shipping on orders over $50. Express shipping available for additional cost.',
        address: store.custom?.fields?.address,
        phone: store.custom?.fields?.phone,
        email: store.custom?.fields?.email
      };
    } catch (error) {
      console.error('Error fetching store information:', error);
      // Return default values if store configuration is not found
      return {
        hours: 'Our store is open Monday-Friday 9am-8pm, Saturday 10am-6pm, and Sunday 11am-5pm EST.',
        returns: 'We offer a 30-day return policy on all unused items in original packaging. Return shipping is free.',
        shipping: 'Free standard shipping on orders over $50. Express shipping available for additional cost.'
      };
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      console.log("[SEARCH -> CATEGORIES]")
      const response = await this.apiRoot
        .withProjectKey({ projectKey: this.projectKey })
        .categories()
        .get()
        .execute();

      console.log("Categories:");
      response.body.results.forEach(category => {
        console.log(`CATEGORY --> ${category.name['en-US'] || category.name.en || 'Unknown'} --> ID --> ${category.id}`);
      });

      return response.body.results.map(category => ({
        id: category.id,
        name: category.name['en-US'] || category.name.en || 'Unknown',
        description: category.description?.['en-US'] || category.description?.en,
        parent: category.parent?.id
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
} 