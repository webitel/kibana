
export class JobManager {
    constructor(httpAgent, chrome) {
        this.httpAgent = httpAgent;
        this.baseUrl = chrome.addBasePath(`/api/reporting/v1/jobs`);
    }

    async create() {

    }

    async get() {

    }

    async getJobs() {
        return await this.httpAgent
            .get(`${this.baseUrl}`)
            .then(response => transform(response.data));
    }

    async updateVisualizations(jobId, vis) {
        return await this.httpAgent
            .put(`${this.baseUrl}/${jobId}`, {vis})
            .then(response => transformRecord(response.data))
    }

    async remove() {

    }
}

function transform(data) {
    return data.hits.hits.map(transformRecord)
}

function transformRecord(item) {
    return {
        id: item._id,
        ...transformSource(item)
    }
}

function transformSource(item) {
    return item._source
}