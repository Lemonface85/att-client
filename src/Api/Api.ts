import type { ApiRequest } from './ApiRequest';
import type { ApiResponse } from './ApiResponse';
import type { HttpMethod } from './HttpMethod';
import type { Client } from '../Client';
import type { Logger } from '../Logger';
import { Endpoint } from './Endpoint';

type Parameters = Record<string, string | number>;

export class Api {
  client: Client;

  private headers?: Headers;
  private logger: Logger;

  constructor(client: Client) {
    this.client = client;
    this.logger = client.logger;
  }

  /**
   * Authorises API requests with an access token.
   */
  async auth() {
    if (typeof this.client.accessToken === 'undefined') {
      this.logger.error("Can't authorise API requests without an access token. Ordering client to refresh tokens.");
      await this.client.refreshTokens();
      return;
    }

    this.headers = new Headers({
      'Content-Type': 'application/json',
      'x-api-key': this.client.config.xApiKey,
      'User-Agent': this.client.config.clientId,
      'Authorization': `Bearer ${this.client.accessToken}`
    });
  }

  /**
   * Accepts a group's invite.
   */
  acceptGroupInvite(groupId: number) {
    return this.post(Endpoint.AcceptGroupInvite, { groupId });
  }

  /**
   * Gets a group's information such as name, description, roles and servers.
   */
  getGroupInfo(groupId: number) {
    return this.get(Endpoint.GroupInfo, { groupId });
  }

  /**
   * Gets a group's member's information, such as name, user ID and group role ID.
   */
  getGroupMember(groupId: number, userId: string) {
    return this.get(Endpoint.GroupMember, { groupId, userId });
  }

  /**
   * Gets all groups that this client is a member of. Returns group info and client's
   * membership info for each group.
   */
  getJoinedGroups() {
    return this.get(Endpoint.JoinedGroups, undefined, { limit: 1000 });
  }

  /**
   * Gets all open group invitations for this client.
   */
  getPendingGroupInvites() {
    return this.get(Endpoint.GroupInvites, undefined, { limit: 1000 });
  }

  /**
   * Gets a server's console connection details.
   */
  getServerConnectionDetails(serverId: number) {
    return this.post(Endpoint.ServerConsole, { serverId }, undefined, { should_launch: false, ignore_offline: false });
  }

  /**
   * Gets a server's information, such as online players and heartbeat status.
   */
  getServerInfo(serverId: number) {
    return this.get(Endpoint.ServerInfo, { serverId });
  }

  /**
   * Sends a GET request to Alta's API.
   */
  private get<T extends Endpoint>(
    endpoint: T,
    params?: Parameters,
    query?: Parameters
  ): Promise<undefined | ApiResponse<`GET ${T}`>['body']> {
    const url = this.createUrl(endpoint, params, query);

    return this.request('GET', url);
  }

  /**
   * Sends a POST request to Alta's API.
   */
  private post<T extends Endpoint>(
    endpoint: T,
    params?: Partial<Parameters>,
    query?: Parameters,
    payload?: ApiRequest
  ): Promise<undefined | ApiResponse<`POST ${T}`>['body']> {
    const url = this.createUrl(endpoint, params, query);

    return this.request('POST', url, payload);
  }

  /**
   * Constructs a request to send to Alta's API.
   */
  private async request(method: HttpMethod, url: URL, payload?: ApiRequest) {
    if (typeof this.headers === 'undefined') {
      this.logger.error('API is not initialised.');
      return;
    }

    this.logger.debug(`Requesting ${method} ${url}`, payload);

    const response = await fetch(url.toString(), {
      method,
      headers: this.headers,
      body: typeof payload === 'undefined' ? null : JSON.stringify(payload)
    });

    if (!response.ok) {
      this.logger.error(response.statusText);

      try {
        const body = await response.json();
        this.logger.error(JSON.stringify(body, null, 2));
      } catch (error) {
        this.logger.error(error);
      }

      return;
    }

    return await response.json();
  }

  /**
   * Creates a URL by populating an endpoint template with parameters and optional
   * query string.
   */
  private createUrl<T extends Endpoint>(template: T, params: Partial<Parameters> = {}, query?: Parameters) {
    const endpoint = template.replace(/{(.*?)}/g, (_, match) => params[match]?.toString() ?? `{${match}}`);

    const url = new URL(`${this.client.config.restBaseUrl}${endpoint}`);

    if (typeof query !== 'undefined') {
      Object.entries(query).forEach(([key, value]) => url.searchParams.append(key, value.toString()));
    }

    return url;
  }
}
