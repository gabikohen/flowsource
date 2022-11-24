const Storage = require('or-sdk/storage');
const storage = new Storage(this);
const { Flows } = require('@or-sdk/flows');
const { Bots } = require('@or-sdk/bots');
const timestring = require('timestring');


async function getResource(key, cls, method, context, params = []) {
    const storageValue = await storage.get(
      '__installerResourceCache', 
      key + context.session.get('reporting.sessionId')
    );
    const resource = storageValue || await cls[method](...params);
    if(!storageValue) await storage.set(
      '__installerResourceCache', 
      key + context.session.get('reporting.sessionId'), 
      resource, 
      new Date().getTime() + 1800000
    );
    
    return resource;
}


const stepContext = await accountContext.resolve({ userId, handleMultiUser });
accountContext.set('last', stepContext);
accountContext.setStepContext(stepContext);
await accountContext.save();

if(!_.isEmpty(stepContext.newStorageKey)) {
  if(stepContext.saveMode === 'session') {
    accountContext.set(stepContext.newStorageKey, stepContext);
  } else if(stepContext.saveMode === 'storage') {
    stepContext.ttl = _.has(stepContext, 'ttl.input') ? new Date( 
      new Date().getTime() + timestring(stepContext.ttl.input, 'ms') ).getTime() : stepContext.ttl;
    await storage.set('__installerSavedAccounts', 'ACCOUNT_' + stepContext.newStorageKey, stepContext, stepContext.ttl);
  }
}

// Check if token is multi-user
if(stepContext.tokenType === 'multi-user') {
  if(handleMultiUser) {
    return this.exitStep('multi-user', stepContext);
  } else {
    throw new Error('Cannot get bot as a multi-user');
  }
}

if(getBotBy === 'id') {
    if(!botId || botId === 'undefined') 
      throw new Error('Bot ID is missing or invalid');
      
  } else if(getBotBy === 'label'){
    if(!botLabel || botLabel === 'undefined')
      throw new Error('Bot label is missing or invalid');
      
    const botList = await getResource(
      `bots_${stepContext.accountId}_`, 
      bots, 
      'listBots', 
      this,
      [{ projection: ['id', 'data.label']}])
      .then(res => res.items || res.rows);
      
    botId = _.get(botList.find(botItem => botItem.data.label === botLabel), 'id');
  }
  

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

const config = {
    token: stepContext.token,
    accountId: stepContext.accountId,
    dataHubSvcUrl: `https://datahub.svc.${stepContext.envSubdomain}.api.onereach.ai`,
};
const flows = new Flows(config);
const bots = new Bots(config);

let flow;

const bot = await bots.getBot(botId).catch(err => undefined);

if(_.isUndefined(bot) || _.isEmpty(bot)) {
    if(noBotStrategy === "exit") {
      return this.exitStep('no bot', { message: 'Bot does not exist'});
    } else if(noBotStrategy === "throw") {
      throw new Error('No bot found');
    } else if(noBotStrategy === "create") {
      bot = await bots.saveBot({
        data: {
          label: botLabel || 'No name',
          color: null,
          description: '',
          password: null,
          iconUrl: null,
          deploy: {
            logsTTL: 60
          }
        }
      })
    }
  }

botId = _.get(bot, 'id');
let flowList = await flows.listFlows(
    botId, { projection: ['id', 'data.label', 'version', 'botId'] }
).then(res => res.items || res.rows);
flowList = flowList.filter(x=> x.botId == botId);

let result = await Promise.all(flowList.map(x=>getSteps(flows,x,prompt)));
result = result.filter(x=>x);

return this.exitStep('next', result);