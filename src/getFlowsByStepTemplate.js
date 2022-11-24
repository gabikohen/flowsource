// Instantiate and initialize Flows class 
const { Flows } = require('@or-sdk/flows');
const { Bots } = require('@or-sdk/bots');
const _ = require('lodash');

async function getSteps(flows,flow,prompt){
    const flowId = flow.id
    if (!flowId || flowId === 'undefined') {
        throw new Error('Flow ID is missing');
    }
    flow = await flows.getFlow(flowId);
    const filterStepTemplate = {};
    const filterStepTemplateVersion = {};
    const stepTemplates = flow.data.stepTemplates;
    stepTemplates.forEach(e => {
        if(e.label){
            if (e.label.includes(prompt)) {
                filterStepTemplate[e.id] = e.label;
                filterStepTemplateVersion[e.id] = e.version;
            }
        }
    });

    let output = []
    const steps = flow.data.trees.main.steps;
    steps.forEach(j => {
        let s = stepTemplates;
        if (filterStepTemplate[j.type] != null) {
            output.push( 
            {
                stepId: j.id,
                stepName: j.label,
                stepTemplateName: filterStepTemplate[j.type],
                version: filterStepTemplateVersion[j.type]
            });
        }
    })

    if (output.length > 0){
        return {flowId:flow.id,flowLabel:flow.data.label};
    }
    else return ;
}

async function getFlowsByStepName(stepContext,botId,prompt) {

    const config = {
        token: stepContext.token,
        accountId: stepContext.accountId,
        dataHubSvcUrl: `https://datahub.svc.${stepContext.envSubdomain}.api.onereach.ai`,
    };
    const flows = new Flows(config);
    const bots = new Bots(config);

    let flow;
    
    botId = _.get(await bots.getBot(botId).catch(err => undefined), 'id');

    let flowList = await flows.listFlows(
        botId, { projection: ['id', 'data.label', 'version', 'botId'] }
    ).then(res => res.items || res.rows);
    flowList = flowList.filter(x=> x.botId == botId);

    const flowsWithStep = []
    let result = await Promise.all(flowList.map(x=>getSteps(flows,x,prompt)));
    result = result.filter(x=>x);
    
    // console.log(JSON.stringify(result, null, 4))
    
    return result;
}



const stepContext = {
    token: "AAABogECAQB4lO5qrMbBPYllyByB6U98HpyJ7eWikC9ICFdAdnZ+Co8BTqgQ+Cs23vCsHZtZdwdgeQAAAWgwggFkBgkqhkiG9w0BBwagggFVMIIBUQIBADCCAUoGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMoemsrIqoLtQq7gamAgEQgIIBGz0oXwp0VHcARV+E1L9/MaL0x7rqNjT/3YHVUtQRodBCdkTNsWCEGiZWyDjfbSN7iXV6ml90tMSv6xV5IZunko3VJLvdcK8F3vgcGqwWY4oCpbB5Ezm7HnkWJb0jBtu0KE3AtrCdq2vpkipO2oj5rY4k4ZY+2TYPaaVr7HllMXb90yMdRvkYYntjDLz6zALtGcWYysMVjy1XuQMsHhZ+6R6rURDAMjkt6NWToxgzSV2jq6b0pvH03JNx9phxmrf2TEP3EsxfohZibYOZLwXohgLC5S2bkq3EggUauB7+s3NYabMcz/c6y5w2pnoynOXMBuh2bqtV3FpqCB8fmzWFW8clUFv7BQ7tEWHf16nrnSas0Vtp1IqDdIsXCwUAAAFFZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmhZMk52ZFc1MFNXUWlPaUkyTm1GbFl6TTFPUzFoWWpVNExUUm1ZbUV0T0dWbE1DMDROamRqTnpNd1ltVTVZakFpTENKMWMyVnlTV1FpT2lJMllXSmlZMk5qTVMweU1UVmhMVFE1WW1JdFlUTTVaaTAwTlRka00yWmhPVEUyTm1ZaUxDSnliMnhsSWpvaVFVUk5TVTRpTENKaGRYUm9WRzlyWlc0aU9pSmtNVGhoTldaaFl5MHhNVFE1TFRRMU16UXRZV00wT1Mxa056UmlZekJoTm1NNVpUTWlMQ0pwWVhRaU9qRTJOamt6TURNM09EbDkuZ1NiX29GREFxX240eURrQ05GZXdBdExWUDBpQnQtVEhFLUpCeXc4R1M5UQ==",
    envSubdomain: "staging",
    accountId: "66aec359-ab58-4fba-8ee0-867c730be9b0"
}
const botId = "4ab8a87c-3fad-4497-a058-54188abd9c74";
const prompt = "HTML";

const result = await getFlowsByStepName(stepContext,botId,prompt);

console.log(JSON.stringify(result, null, 4))
    // return this.exitStep('next', result);
