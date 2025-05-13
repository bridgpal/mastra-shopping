import {
  ClientBuilder,
  type AuthMiddlewareOptions,
  type HttpMiddlewareOptions,
  type Client,
  ClientResponse
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
    console.log("[GET PRODUCTS BY CATEGORY]")
    const response = await this.apiRoot
      .withProjectKey({ projectKey: this.projectKey })
      .products()
      .get({
        queryArgs: {
          where: `masterData(current(categories(id="${category}")))`,
          limit: 20
        }
      })
      .execute();

    console.log('Response:', response.body);

    return response.body.results
      .map(product => {
        try {
          console.log('Product:', product.masterData);
          return this.mapToProduct(product.masterData.current);
        } catch (e) {
          console.warn('Skipping product with missing master variant:', product.id);
          return null;
        }
      })
      .filter((p): p is IProduct => Boolean(p));
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
        .get({
          queryArgs: {
            limit: 50,
          }
        })
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

  async createCategory(category: Category): Promise<Category> {
    try {
      if (!category.name) {
        throw new Error("Category 'name' must be provided as an object, e.g. { en: 'Hats' }");
      }

      if (!category.slug) {
        throw new Error("Category 'slug' must be provided as an object, e.g. { en: 'hats' }");
      }

      const body: any = {
        name: { "en-US": category.name }, // e.g., { en: "Hats" }
        slug: { "en-US": category.slug }, // e.g., { en: "hats" } (must be unique)
      };
      // Log the payload as JSON for debugging
      console.log("[CREATE CATEGORY PAYLOAD]", JSON.stringify(body, null, 2));

      console.log("[CREATE CATEGORY]")

      // if (category.parent) {
      //   body.parent = {
      //     typeId: "category",
      //     id: category.parent.id
      //   };
      // }

      if (category.orderHint) {
        body.orderHint = category.orderHint;
      }

      console.log(body)

      const response = await this.apiRoot
        .withProjectKey({ projectKey: this.projectKey })
        .categories()
        .post({ body })
        .execute();
      return response.body;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async addProductToCategory(categoryId: string, productId: string): Promise<void> {
    // Helper to perform the update
    const updateProduct = async (version: number) => {
      await this.apiRoot
        .withProjectKey({ projectKey: this.projectKey })
        .products()
        .withId({ ID: productId })
        .post({
          body: {
            version,
            actions: [
              {
                action: "addToCategory",
                category: { id: categoryId, typeId: "category" }
              }
            ]
          }
        })
        .execute();
    };

    // Fetch latest product version
    let productResponse = await this.apiRoot
      .withProjectKey({ projectKey: this.projectKey })
      .products()
      .withId({ ID: productId })
      .get()
      .execute();
    let product = productResponse.body;
    let version = product.version;

    try {
      await updateProduct(version);
    } catch (error: any) {
      const message = error?.body?.message || error?.message || '';
      // Handle already-in-category gracefully
      if (
        message.includes('is already in that category') ||
        (error?.statusCode === 400 && message.includes('Cannot add to category'))
      ) {
        console.warn(`Product ${productId} is already in category ${categoryId}, skipping.`);
        return;
      }
      // Handle version conflict (ConcurrentModification)
      if (
        error?.statusCode === 409 &&
        message.includes('has a different version than expected') &&
        error?.body?.errors?.some((e: any) => e.code === 'ConcurrentModification')
      ) {
        // Refetch and retry once
        productResponse = await this.apiRoot
          .withProjectKey({ projectKey: this.projectKey })
          .products()
          .withId({ ID: productId })
          .get()
          .execute();
        product = productResponse.body;
        version = product.version;
        try {
          await updateProduct(version);
        } catch (retryError: any) {
          console.error('Retry failed adding product to category:', retryError);
          throw retryError;
        }
        return;
      }
      console.error('Error adding product to category:', error);
      throw error;
    }
  }

  async addProductsToCategory({
    productIds,
    categoryId,
    staged = false,
  }: {
    productIds: string[];
    categoryId: string;
    staged?: boolean;
  }): Promise<any[]> {
    const responses: any[] = [];

    for (const productId of productIds) {

      try {
        // Get current product version
        const product = await this.apiRoot
          .withProjectKey({ projectKey: this.projectKey })
          .products()
          .withId({ ID: productId })
          .get()
          .execute();

        const version = product.body.version;

        const updateResponse = await this.apiRoot
          .withProjectKey({ projectKey: this.projectKey })
          .products()
          .withId({ ID: productId })
          .post({
            body: {
              version,
              actions: [
                {
                  action: 'addToCategory',
                  category: {
                    id: categoryId,
                    typeId: 'category'
                  },
                  staged,
                },
              ],
            },
          })
          .execute();

        responses.push(updateResponse);
      } catch (error) {
        console.error('Error adding product to category:', error);
        throw error;
      }
    }

    return responses;
  }

  async getRecentlyOutOfStockProducts(): Promise<any[]> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const isoYesterday = yesterday.toISOString();

    const results: any[] = [];

    let offset = 0;
    const limit = 100;

    const inventoryResponse = await this.apiRoot
      .withProjectKey({ projectKey: this.projectKey })
      .inventory()
      .get({
        queryArgs: {
          limit,
          offset,
          where: `availableQuantity=0 AND lastModifiedAt > "${isoYesterday}"`,
        },
      })
      .execute();

    const entries = inventoryResponse.body.results;

    for (const entry of entries) {
      const sku = entry.sku;

      // Find product with matching variant SKU
      const productResponse = await this.apiRoot
        .withProjectKey({ projectKey: this.projectKey })
        .productProjections()
        .search()
        .get({
          queryArgs: {
            [`filter.query`]: [`variants.sku:"${sku}"`],
            limit: 1,
          },
        })
        .execute();

      const product = productResponse.body.results[0];

      console.log(`Product found for SKU ${sku}:`, product);

      if (product) {
        const name = product.name?.['en-US'] ?? '[no name]';
        const slug = product.slug?.['en-US'] ?? '[no slug]';

        results.push({
          sku,
          productId: product.id,
          productName: name,
          slug,
        });
      }

      if (inventoryResponse.body.count < limit) break;
      offset += limit;
    }

    return results;
  }
}