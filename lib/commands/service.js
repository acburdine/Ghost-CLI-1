'use strict';
const Command = require('../command');

class ServiceCommand extends Command {
    run(argv) {
        this.system.loadInstanceConfig();
        this.service.setConfig(this.system.instanceConfig);

        return this.service.callCommand(argv.command, argv.args || []);
    }
}

ServiceCommand.description = 'Run a service-defined command';
ServiceCommand.params = '<command> [args..]';

module.exports = ServiceCommand;
