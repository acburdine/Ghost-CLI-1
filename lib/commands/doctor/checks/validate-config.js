const get = require('lodash/get');
const path = require('path');
const filter = require('lodash/filter');
const Promise = require('bluebird');

const {ConfigError} = require('../../../errors');
const Config = require('../../../utils/config');
const options = require('../../../tasks/configure/options');

const taskTitle = 'Validating config';

async function validateConfig(ctx, task) {
    if (!ctx.instance) {
        return task.skip('Instance not set');
    }

    const isRunning = await ctx.instance.isRunning();
    if (isRunning) {
        return task.skip('Instance is currently running');
    }

    const config = Config.exists(path.join(ctx.instance.dir, `config.${ctx.system.environment}.json`));

    if (config === false) {
        throw new ConfigError({
            environment: ctx.system.environment,
            message: 'Config file is not valid JSON',
            task: taskTitle
        });
    }

    const configValidations = filter(options, cfg => cfg.validate);

    await Promise.each(configValidations, async (configItem) => {
        const key = configItem.configPath || configItem.name;
        const value = get(config, key);

        if (!value) {
            return;
        }

        const validated = await configItem.validate(value);

        if (validated !== true) {
            throw new ConfigError({
                config: {
                    [key]: value
                },
                message: validated,
                environment: ctx.system.environment,
                task: taskTitle
            });
        }
    });
}

module.exports = {
    title: taskTitle,
    task: validateConfig,
    category: ['start']
};
