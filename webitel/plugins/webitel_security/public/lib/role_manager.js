
export class RoleManager {
    constructor(httpAgent, chrome) {
        this.httpAgent = httpAgent;
        this.baseUrl = chrome.addBasePath(`/api/webitel/v1/roles`);
    }

    async getRoles() {
        return await this.httpAgent
            .get(this.baseUrl)
            .then(response => response.data);
    }
}