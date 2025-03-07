// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

"use strict";

import * as path from "path";
import { Argv, Options } from "yargs";

import {
  FxError,
  err,
  ok,
  Result,
  Stage,
  MultiSelectQuestion,
  OptionItem,
} from "@microsoft/teamsfx-api";

import activate from "../activate";
import { YargsCommand } from "../yargsCommand";
import { flattenNodes, getSystemInputs } from "../utils";
import CliTelemetry from "../telemetry/cliTelemetry";
import {
  TelemetryEvent,
  TelemetryProperty,
  TelemetrySuccess,
} from "../telemetry/cliTelemetryEvents";
import CLIUIInstance from "../userInteraction";
import { HelpParamGenerator } from "../helpParamGenerator";
import { CannotDeployPlugin } from "../error";

export default class Deploy extends YargsCommand {
  public readonly commandHead = `deploy`;
  public readonly command = `${this.commandHead} [components...]`;
  public readonly description = "Deploy the current application.";

  public params: { [_: string]: Options } = {};
  public readonly deployPluginNodeName = "deploy-plugin";

  public builder(yargs: Argv): Argv<any> {
    this.params = HelpParamGenerator.getYargsParamForHelp(Stage.deploy);
    const deployPluginOption = this.params[this.deployPluginNodeName];
    yargs.positional("components", {
      array: true,
      choices: deployPluginOption.choices,
      description: deployPluginOption.description,
    });
    for (const name in this.params) {
      if (name !== this.deployPluginNodeName) {
        yargs.options(name, this.params[name]);
      }
    }
    return yargs.version(false);
  }

  public async runCommand(args: {
    [argName: string]: string | string[] | undefined;
  }): Promise<Result<null, FxError>> {
    if (!("open-api-document" in args)) {
      args["open-api-document"] = undefined;
    }
    if (!("api-prefix" in args)) {
      args["api-prefix"] = undefined;
    }
    if (!("api-version" in args)) {
      args["api-version"] = undefined;
    }
    const rootFolder = path.resolve((args.folder as string) || "./");
    CliTelemetry.withRootFolder(rootFolder).sendTelemetryEvent(TelemetryEvent.DeployStart);

    CLIUIInstance.updatePresetAnswers(this.params, args);
    CLIUIInstance.removePresetAnswers(["components"]);

    const result = await activate(rootFolder);
    if (result.isErr()) {
      CliTelemetry.sendTelemetryErrorEvent(TelemetryEvent.Deploy, result.error);
      return err(result.error);
    }

    const core = result.value;
    {
      /// TODO: this should be removed!
      const result = await core.getQuestions(Stage.deploy, getSystemInputs(rootFolder));
      if (result.isErr()) {
        CliTelemetry.sendTelemetryErrorEvent(TelemetryEvent.Deploy, result.error);
        return err(result.error);
      }
      const node = result.value;
      if (node) {
        const allNodes = flattenNodes(node);
        const deployPluginNode = allNodes.find(
          (node) => node.data.name === this.deployPluginNodeName
        )!;
        const components = (args.components as string[]) || [];
        const option = (deployPluginNode.data as MultiSelectQuestion).staticOptions as OptionItem[];
        // Check if the component/plugin is in the project.
        for (const component of components) {
          const result = option.find(
            (item) => (item.cliName ? item.cliName : item.id) === component
          );
          if (!result) {
            return err(CannotDeployPlugin(component));
          }
        }
        if (components.length === 0) {
          CLIUIInstance.updatePresetAnswer(
            this.deployPluginNodeName,
            option.map((op) => op.id)
          );
        } else {
          CLIUIInstance.updatePresetAnswer(this.deployPluginNodeName, components);
        }
      }
    }

    {
      const result = await core.deployArtifacts(getSystemInputs(rootFolder));
      if (result.isErr()) {
        CliTelemetry.sendTelemetryErrorEvent(TelemetryEvent.Deploy, result.error);
        return err(result.error);
      }
    }

    CliTelemetry.sendTelemetryEvent(TelemetryEvent.Deploy, {
      [TelemetryProperty.Success]: TelemetrySuccess.Yes,
    });
    return ok(null);
  }
}
