import {APIDirectory} from "../../../";


export interface APIPlugin {

    /**
     * Routes to attach
     */
    routes?: APIDirectory;

    /**
     * Whether the plugin has to be deployed
     * @returns {Promise<boolean> | boolean}
     */
    mustDeploy: () => Promise<boolean> | boolean;

    /**
     * Deploy function
     * @returns {any}
     */
    deploy: () => any;

    /**
     * Clean-up function
     * @returns {any}
     */
    undeploy: () => any;

    
}