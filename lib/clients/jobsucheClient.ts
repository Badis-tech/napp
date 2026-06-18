import { getApiKeyByName, markApiKeyAsUsed } from '../apiKeyService';

const JOBSUCHE_BASE_URL = 'https://api.arbeitsagentur.de/jobsuche';

export interface JobSearchQuery {
  keywords?: string;
  location?: string;
  page?: number;
  size?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface JobSearchResult {
  id: string;
  title: string;
  employer: string;
  location: string;
  description: string;
  url: string;
  posted_date: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export class JobsucheClient {
  private apiKeyName: string = 'production';

  constructor(apiKeyName: string = 'production') {
    this.apiKeyName = apiKeyName;
  }

  /**
   * Search for jobs using the jobsuche API
   */
  async search(query: JobSearchQuery): Promise<JobSearchResult[]> {
    try {
      // Get the API key from our management system
      const apiKeyData = await getApiKeyByName('jobsuche', this.apiKeyName, true);

      if (!apiKeyData || !('decryptedKey' in apiKeyData)) {
        throw new Error('Jobsuche API key not found or not decrypted');
      }

      // Mark as used
      await markApiKeyAsUsed(apiKeyData.id);

      // Make request to jobsuche API
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`${JOBSUCHE_BASE_URL}/search?${params.toString()}`, {
        headers: {
          'X-API-Key': apiKeyData.decryptedKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Jobsuche API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching jobsuche:', error);
      throw error;
    }
  }

  /**
   * Get job details by ID
   */
  async getJobById(jobId: string): Promise<JobSearchResult | null> {
    try {
      const apiKeyData = await getApiKeyByName('jobsuche', this.apiKeyName, true);

      if (!apiKeyData || !('decryptedKey' in apiKeyData)) {
        throw new Error('Jobsuche API key not found or not decrypted');
      }

      await markApiKeyAsUsed(apiKeyData.id);

      const response = await fetch(`${JOBSUCHE_BASE_URL}/jobs/${jobId}`, {
        headers: {
          'X-API-Key': apiKeyData.decryptedKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Jobsuche API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching job from jobsuche:', error);
      throw error;
    }
  }

  /**
   * Validate if the current API key is working
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const apiKeyData = await getApiKeyByName('jobsuche', this.apiKeyName, true);

      if (!apiKeyData || !('decryptedKey' in apiKeyData)) {
        return false;
      }

      const response = await fetch(`${JOBSUCHE_BASE_URL}/status`, {
        headers: {
          'X-API-Key': apiKeyData.decryptedKey,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export a default instance
export const jobsucheClient = new JobsucheClient();
