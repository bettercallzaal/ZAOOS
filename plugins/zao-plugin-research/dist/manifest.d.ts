declare const _default: {
    id: string;
    apiVersion: number;
    version: string;
    displayName: string;
    description: string;
    author: string;
    categories: readonly ["automation"];
    capabilities: string[];
    entrypoints: {
        worker: string;
    };
    instanceConfigSchema: {
        type: "object";
        properties: {
            researchDir: {
                type: "string";
                description: string;
                default: string;
            };
        };
    };
    tools: ({
        name: string;
        displayName: string;
        description: string;
        parametersSchema: {
            type: "object";
            properties: {
                query: {
                    type: "string";
                    description: string;
                };
                category: {
                    type: "string";
                    description: string;
                };
                limit: {
                    type: "number";
                    description: string;
                };
                id?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        displayName: string;
        description: string;
        parametersSchema: {
            type: "object";
            properties: {
                id: {
                    type: "string";
                    description: string;
                };
                query?: undefined;
                category?: undefined;
                limit?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        displayName: string;
        description: string;
        parametersSchema: {
            type: "object";
            properties: {
                query?: undefined;
                category?: undefined;
                limit?: undefined;
                id?: undefined;
            };
            required?: undefined;
        };
    })[];
};
export default _default;
