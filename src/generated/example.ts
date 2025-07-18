// Example usage of generated protobuf types
import type {
  CStoreTopSellers_GetCountryList_Request,
  CStoreTopSellers_GetCountryList_Response,
  CStoreTopSellers_GetWeeklyTopSellers_Request,
  CStoreTopSellers_GetWeeklyTopSellers_Response,
  IStoreTopSellersClient
} from './index';

// Example: Creating a request to get country list
export function createCountryListRequest(language?: string): CStoreTopSellers_GetCountryList_Request {
  return {
    language: language || 'english'
  };
}

// Example: Creating a request to get weekly top sellers
export function createWeeklyTopSellersRequest(
  countryCode: string = 'US',
  pageStart: number = 0,
  pageCount: number = 20
): CStoreTopSellers_GetWeeklyTopSellers_Request {
  return {
    countryCode,
    pageStart,
    pageCount,
    // context and data_request would need to be populated based on your needs
    // context: { ... },
    // dataRequest: { ... }
  };
}

// Example: Type-safe response handling
export function handleCountryListResponse(response: CStoreTopSellers_GetCountryList_Response): void {
  response.countries.forEach(country => {
    console.log(`Country: ${country.name} (${country.countryCode})`);
  });
}

export function handleTopSellersResponse(response: CStoreTopSellers_GetWeeklyTopSellers_Response): void {
  response.ranks.forEach(rank => {
    console.log(`Rank ${rank.rank}: App ID ${rank.appid}`);
    if (rank.item) {
      console.log(`  Name: ${rank.item.name}`);
      // Access other item properties as needed
    }
  });
}

// Note: To use the client, you would need to set up an RPC transport
// Example client usage (requires RPC transport setup):
/*
export class StoreTopSellersService {
  constructor(private client: IStoreTopSellersClient) {}

  async getCountries(language?: string) {
    const request = createCountryListRequest(language);
    const response = await this.client.getCountryList(request);
    return response.response;
  }

  async getTopSellers(countryCode?: string, pageStart?: number, pageCount?: number) {
    const request = createWeeklyTopSellersRequest(countryCode, pageStart, pageCount);
    const response = await this.client.getWeeklyTopSellers(request);
    return response.response;
  }
}
*/ 