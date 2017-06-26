'use strict';
const Promise = require('bluebird');

const Config = require('../utils/config');
const errors = require('../errors');
const Command = require('../command');

class StopCommand extends Command {
    run(argv) {
        if (argv.all) {
            return this.stopAll();
        }

        Command.checkValidInstall('stop');
        this.loadLocalConfig(process.cwd());

        if (!this.system.localConfig.has('running')) {
            return Promise.reject(new errors.SystemError('No running Ghost instance found here.'));
        }

        this.system.loadEnvironmentFromRunningConfig();
        this.system.loadInstanceConfig();

        this.service.setConfig(this.system.instanceConfig);
        let stop = () => Promise.resolve(this.service.process.stop(process.cwd())).then(() => {
            this.system.localConfig.set('running', null).save();
            return Promise.resolve();
        });

        if (argv.quiet) {
            return stop();
        }

        return this.ui.run(stop, 'Stopping Ghost');
    }

    stopAll() {
        let systemConfig = Config.load('system');
        let instances = systemConfig.get('instances', {});
        let cwd = process.cwd();

        // Unlike lodash, bluebird doesn't support iterating over objects,
        // so we have to iterate over the keys and then get the url later
        return Promise.each(Object.keys(instances), (pname) => {
            let instance = instances[pname];
            process.chdir(instance.cwd);
            return this.ui.run(() => this.run({quiet: true}), `Stopping Ghost: ${pname}`);
        }).then(() => {
            process.chdir(cwd);
        });
    }
}

StopCommand.description = 'Stops an instance of Ghost';
StopCommand.options = {
    all: {
        alias: 'a',
        description: 'option to stop all running Ghost blogs',
        type: 'boolean'
    }
};
StopCommand.global = true;

module.exports = StopCommand;
