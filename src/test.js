// Instantiate and initialize Flows class 
async function main() {
    const { Flows } = require('@or-sdk/flows');
    const { Bots } = require('@or-sdk/bots');
    const _ = require('lodash');

    const stepContext = {
        token: "AAABogECAQB4lO5qrMbBPYllyByB6U98HpyJ7eWikC9ICFdAdnZ+Co8BTZvWIxJgs3q9aiBjG4QhAwAAAWgwggFkBgkqhkiG9w0BBwagggFVMIIBUQIBADCCAUoGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMPP6EUsHS+mfBRTTmAgEQgIIBGyKk1AMw1vbIVJpHKalRetLLq3cEFR5SYHeqmQXMbS77Iv+Fc/AsyGoEZBAWwkCvjpepdNH9yC61iHVYTOCxOSd71PxjcQEM58JHgcxT/7NEai/ccHHXPimReK+1YO0vvTaYVtaJ/Z0kL+KmrR9Q72MrDevvIqYBv63NS/CtOKWoGBILobSrHiB4G3qgZJzotFNegJDuMO6eHruzWAD3C1tVq/bFFwFdzyoEEwDuarCeOMfyGwc+pM931rHfpmcY/6yp2NAW5AEJXcnvZdVKbvg6E5/4le26qzn0kGyN5mmNRVTJ+4tTinQUQa2yeUpD6rhJjcU8//JsZn7rgohpzQcQB/CF8OQWAa1gLVQp0v4AADrCqK7F2G4E9XsAAAFFZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmhZMk52ZFc1MFNXUWlPaUkyTm1GbFl6TTFPUzFoWWpVNExUUm1ZbUV0T0dWbE1DMDROamRqTnpNd1ltVTVZakFpTENKMWMyVnlTV1FpT2lJMllXSmlZMk5qTVMweU1UVmhMVFE1WW1JdFlUTTVaaTAwTlRka00yWmhPVEUyTm1ZaUxDSnliMnhsSWpvaVFVUk5TVTRpTENKaGRYUm9WRzlyWlc0aU9pSmtNVGhoTldaaFl5MHhNVFE1TFRRMU16UXRZV00wT1Mxa056UmlZekJoTm1NNVpUTWlMQ0pwWVhRaU9qRTJOamcyT1RBNU1qaDkuSFFnbnY4dUtWUkNZbHVMdGhrRGlQYlZOeDFhRWJCTkpGOENPaEVZaWJnRQ==",
        envSubdomain: "staging",
        accountId: "66aec359-ab58-4fba-8ee0-867c730be9b0"
    }
    const getFlowBy = "id";
    const flowId = "5a883f28-33ea-4abd-a993-2463157c3317";


    const config = {
        token: stepContext.token,
        discoveryUrl: `https://discovery.${stepContext.envSubdomain}.api.onereach.ai/`,
        accountId: stepContext.accountId,
        dataHubSvcUrl: `https://datahub.svc.${stepContext.envSubdomain}.api.onereach.ai`,
    };
    const flows = new Flows(config);
    const bots = new Bots(config);

    // Get flow by id
    let flow;
    if (getFlowBy === 'id') {
        if (!flowId || flowId === 'undefined') {
            throw new Error('Flow ID is missing');
        }
        flow = await flows.getFlow(flowId);
    } else if (getFlowBy === 'event') {
        const { Deployments } = require('@or-sdk/deployments');
        const deployments = new Deployments(config);
        const event = await deployments
            .listActiveDeployments()
            .then(res => res.items || res.rows)
            .then(deps => deps.find(
                dep => dep.data.triggers.find(
                    trig => _.includes(trig.params.name, eventName)
                )));



        if (event) flow = await flows.getFlow(event.flowId);

    } else {
        botId = _.get(await bots.getBot(botId).catch(err => undefined), 'id');

        let flowList = await flows.listFlows(
            botId, { projection: ['id', 'data.label', 'version', 'botId'] }
        ).then(res => res.items || res.rows);
        flow = await flows.getFlow(
            _.get(
                flowList.find(flowItem => flowItem.data.label === flowLabel),
                'id'
            )).catch(err => undefined);
    }

    if (_.isUndefined(flow)) {
        if (noFlowStrategy === "exit") {
            return this.exitStep('no flow', { message: `Flow ${getFlowBy === 'id' ? 'ID' : 'label'} is missing or invalid` });
        } else if (noFlowStrategy === "throw") {
            throw new Error(`Flow ${getFlowBy === 'id' ? 'ID' : 'label'} is missing or invalid`);
        } else if (noFlowStrategy === "create") {
            if (!botId) throw new Error('BotId is missing or invalid');
        }
    }

    const filterStepTemplate = {};
    const prompt = 'HTML';

    const stepTemplates = flow.data.stepTemplates;

    stepTemplates.forEach(e => {
        if (e.label.includes(prompt)) {

            filterStepTemplate[e.id] = e.label;
        }


    });

    console.log(filterStepTemplate);

 const output = {}
    
 const steps = flow.data.trees.main.steps;

    steps.forEach(j => {
        if (filterStepTemplate[j.type] != null) {
             output = {stepName:'',id:'',stepTeplate:''}
        }
    })



    
}


main();