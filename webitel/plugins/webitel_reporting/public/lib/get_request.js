
export async function getJobVisState(visualize) {
    const {searchSource, vis, id, visState, title} = visualize;

    return {
        id,
        indexId: vis.indexPattern.id,
        state: visState,
        name: title,
        body: {
            ...await getRequestVis(searchSource, vis)
        }
    }
}

async function getRequestVis(searchSource, {aggs, isHierarchical}) {
    const requestSearchSource = searchSource.createCopy();
    requestSearchSource.setField('aggs', function () {
        return aggs.toDsl(isHierarchical);
    });
    // requestSearchSource.setField('filter', filters);

    return await requestSearchSource.getSearchRequestBody();
}