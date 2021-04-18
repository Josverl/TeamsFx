// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
"use strict";
  
import { Result } from "neverthrow"; 
import { ResourceConfigs, ResourceSettings, ResourceStates,Context, VariableDict, EnvMeta, Func, FunctionRouter, FxError, Inputs, QTreeNode, ReadonlyResourceConfig, ReadonlyResourceConfigs, ResourceConfig, ResourceTemplate, Task, TokenProvider, Void } from "./index";


export interface ResourceContext extends Context {
    resourceSettings: ResourceSettings;
    resourceStates: ResourceStates;
}


export interface ResourceEnvContext  extends ResourceContext {

    envMeta: EnvMeta;

    tokenProvider: TokenProvider;  
     
    commonConfig: ReadonlyResourceConfig;
 
    selfConfig: ResourceConfig;
}

export interface ResourceConfigureContext extends ResourceEnvContext
{
    allProvisionConfigs: ReadonlyResourceConfigs;
}
 

export interface ResourceAllContext  extends ResourceContext {

    envMeta: EnvMeta;

    tokenProvider: TokenProvider;  
     
    provisionConfig?: ResourceConfig;

    deployConfig?: ResourceConfig;
}
 
export interface ResourcePlugin {

    shortName:string,

    displayName:string,

    /**
     * scaffold source code on disk
     */
    scaffoldSourceCode?: (ctx: ResourceContext, userInputs: Inputs) => Promise<Result<Void, FxError>>;  

    /**
     * scaffold a memory version of config template (provision and deploy are seperated)
     */
    scaffoldResourceTemplate?: (ctx: ResourceContext, userInputs: Inputs) => Promise<Result<{provision:ResourceTemplate, deploy:ResourceTemplate}, FxError>>; 
    
    /**
     * provision resource to cloud, output variable dictionary data
     */
    provision?: (ctx: ResourceEnvContext, userInputs: Inputs) => Promise<Result<VariableDict, FxError>>;

    /**
     * Configure provisioned resources.
     */
    configureProvisionedResources?: (ctx: ResourceConfigureContext) => Promise<Result<Void, FxError>>;

    /**
     * build artifacts
     */
    build?: (ctx: Context, userInputs: Inputs) => Promise<Result<Void, FxError>>;

    /**
     * deploy resource
     */
    deploy?: (ctx: ResourceEnvContext, userInputs: Inputs) => Promise<Result<Void, FxError>>;

    /**
     * publish app
     */
    publish?: (ctx: ResourceEnvContext, userInputs: Inputs) => Promise<Result<Void, FxError>>;
   
    /**
     * Declare what user input you need for each {@link task}. Questions are organized as a tree. Please check {@link QTreeNode}.
     * ctx only exist for non-create task
     */
    getQuestionsForLifecycleTask?: (ctx: ResourceEnvContext, task: Task, inputs: Inputs) => Promise<Result<QTreeNode|undefined, FxError>>;

    /**
     * get question model for lifecycle {@link Task} (create, provision, deploy, debug, publish), Questions are organized as a tree. Please check {@link QTreeNode}.
     */
    getQuestionsForUserTask?: (ctx: ResourceEnvContext, router: FunctionRouter, userInputs: Inputs) => Promise<Result<QTreeNode | undefined, FxError>>;

    /**
     * execute user task in additional to normal lifecycle {@link Task}, for example `Add Resource`, `Add Capabilities`, `Update AAD Permission`, etc
     * `executeUserTask` will router the execute request and dispatch from core--->solution--->resource plugin according to `FunctionRouter`.
     */
    executeUserTask?: (ctx: ResourceEnvContext, func:Func, userInputs: Inputs) => Promise<Result<unknown, FxError>>;
    
    /**
     * There are three scenarios to use this API in question model:
     * 1. answer questions of type `FuncQuestion`. Unlike normal questions, the answer of which is returned by humen input, the answer of `FuncQuestion` is automatically returned by this `executeFuncQuestion` call.
     * 2. retrieve dynamic option item list for `SingleSelectQuestion` or `MultiSelectQuestion`. In such a case, the option is defined by `DynamicOption`. When the UI visit such select question, this `executeFuncQuestion` will be called to get option list.
     * 3. validation for `TextInputQuestion`, core,solution plugin or resource plugin can define the validation function in `executeFuncQuestion`.
     * `executeFuncQuestion` will router the execute request from core--->solution--->resource plugin according to `FunctionRouter`.
     */
    executeFuncQuestion?: (ctx: ResourceEnvContext, func:Func, userInputs: Inputs) => Promise<Result<unknown, FxError>>;
}
