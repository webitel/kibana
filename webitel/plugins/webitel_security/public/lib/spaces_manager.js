
export class SpacesManager {
    constructor(httpAgent, chrome) {
        this.httpAgent = httpAgent;
        this.baseUrl = chrome.addBasePath(`/api/spaces`);
        this.securityUrl = chrome.addBasePath(`/api/webitel/v1/space_security`)
    }

    async getSpaces() {
        return await this.httpAgent
            .get(`${this.baseUrl}/space`)
            .then(response => response.data);
    }
    async getSpace(id) {
        return await this.httpAgent.get(`${this.baseUrl}/space/${id}`);
    }

    async updateSpace(space) {
        return await this.httpAgent.put(`${this.securityUrl}/${space.id}?overwrite=true`, space);
    }
}