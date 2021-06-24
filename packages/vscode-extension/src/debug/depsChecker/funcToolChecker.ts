// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fs from "fs-extra";
import * as path from "path";
import { cpUtils } from "./cpUtils";
import { DepsInfo, IDepsAdapter, IDepsChecker, IDepsLogger, IDepsTelemetry } from "./checker";
import { defaultHelpLink, DepsCheckerEvent, isMacOS, Messages, TelemtryMessages, } from "./common";
import { DepsCheckerError } from "./errors";
import * as os from "os";
import { ConfigFolderName } from '@microsoft/teamsfx-api';

export enum FuncVersion {
  v1 = "1",
  v2 = "2",
  v3 = "3",
}

const funcPackageName = "azure-functions-core-tools";
const funcToolName = "Azure Function Core Tool";

const installVersion = FuncVersion.v3;
const supportedVersions = [FuncVersion.v2, FuncVersion.v3];
const displayFuncName = `${funcToolName} (v${FuncVersion.v3})`;

const timeout = 5 * 60 * 1000;

export class FuncToolChecker implements IDepsChecker {
  private readonly _adapter: IDepsAdapter;
  private readonly _logger: IDepsLogger;
  private readonly _telemetry: IDepsTelemetry;

  constructor(adapter: IDepsAdapter, logger: IDepsLogger, telemetry: IDepsTelemetry) {
    this._adapter = adapter;
    this._logger = logger;
    this._telemetry = telemetry;
  }

  public getDepsInfo(): Promise<DepsInfo> {
    return Promise.resolve({
      name: funcToolName,
      installVersion: installVersion,
      supportedVersions: supportedVersions,
      details: new Map<string, string>(),
    });
  }

  public async isEnabled(): Promise<boolean> {
    // TODO: only for function api or spfx ?
    const hasBackend = await this._adapter.hasTeamsfxBackend();
    // TODO: validation config and docs ready ?
    const checkerEnabled = this._adapter.funcToolCheckerEnabled();
    if (!checkerEnabled) {
      // TODO: send telemetry
      // this._telemetry.sendEvent(DepsCheckerEvent.skipCheckFunc);
    }
    return hasBackend && checkerEnabled;
  }

  public async isInstalled(): Promise<boolean> {
    // TODO: add telemetry of func version
    const globalFuncVersion = await this.getFuncVersion("func");
    const portableFuncVersion = await this.getFuncVersion(FuncToolChecker.getPortableFuncExecPath());
    this._telemetry.sendEvent(DepsCheckerEvent.funcCheck);

    return await this.isGlobalFuncInstalled() || await this.isPortableFuncInstalled();
  }

  public async isPortableFuncInstalled(): Promise<boolean> {
    const portableFuncVersion = await this.getFuncVersion(FuncToolChecker.getPortableFuncExecPath());
    return portableFuncVersion !== null && supportedVersions.includes(portableFuncVersion);
  }

  public async isGlobalFuncInstalled(): Promise<boolean> {
    const globalFuncVersion = await this.getFuncVersion("func");
    return globalFuncVersion !== null && supportedVersions.includes(globalFuncVersion);
  }

  public async install(): Promise<void> {
    if (!(await this.hasNPM())) {
        this.handleNpmNotFound();
    }
    await this.cleanup();

    await this.installFunc();

    if (!await this.isPortableFuncInstalled()) {
      await this.handleInstallFuncFailed();
    }

    this._telemetry.sendEvent(DepsCheckerEvent.funcValidationCompleted);
    await this._logger.info(Messages.finishInstallFunctionCoreTool.replace("@NameVersion", displayFuncName));
  }

  private async handleInstallFuncFailed() :Promise<void>{
    await this.cleanup();
    this._telemetry.sendSystemErrorEvent(
        DepsCheckerEvent.funcValidation,
        TelemtryMessages.failedToInstallFunc,
        Messages.failToValidateFuncCoreTool.replace("@NameVersion", displayFuncName)
    );

    throw new DepsCheckerError(
        Messages.failToInstallFuncCoreTool.replace("@NameVersion", displayFuncName),
        defaultHelpLink
    );
  }

  private handleNpmNotFound() {
    this._telemetry.sendUserErrorEvent(
        DepsCheckerEvent.funcInstall,
        TelemtryMessages.NPMNotFound
    );
    throw new DepsCheckerError(
        Messages.needInstallFuncCoreTool.replace("@NameVersion", displayFuncName),
        defaultHelpLink
    );
  }

  private static getDefaultInstallPath(): string {
    return path.join(os.homedir(), `.${ConfigFolderName}`, "bin", "func");
  }

  private static getPortableFuncExecPath(): string {
    return path.join(FuncToolChecker.getDefaultInstallPath(), "func");
  }

  public async getFuncExecPath(): Promise<string> {
    if(await this.isPortableFuncInstalled()) {
      return FuncToolChecker.getPortableFuncExecPath();
    }
    if(await this.isGlobalFuncInstalled()) {
      return "func";
    }
    return "npx func";
  }

  private async getFuncVersion(path: string): Promise<FuncVersion | null> {
    try {
      const output = await cpUtils.executeCommand(
        undefined,
        this._logger,
        undefined,
        path,
        "--version"
      );
      return getFuncToolsVersion(output);
    } catch (error) {
      return null;
    }
  }

  private async hasNPM(): Promise<boolean> {
    try {
      await cpUtils.executeCommand(undefined, this._logger, undefined, "npm", "--version");
      // TODO: add telemetry of npm version
      return true;
    } catch (error) {
      // an error indicates no npm
      return false;
    }
  }

  private async cleanup(): Promise<void> {
    await fs.emptyDir(FuncToolChecker.getDefaultInstallPath());
  }

  private async installFunc(): Promise<void> {
    try {
      await this._telemetry.sendEventWithDuration(
          DepsCheckerEvent.funcInstallCompleted,
          async () => {
              await this._adapter.runWithProgressIndicator(async () => await this.doInstallPortableFunc(FuncVersion.v3));
          }
      );
    } catch (error) {
      this._telemetry.sendSystemErrorEvent(
          DepsCheckerEvent.funcInstall,
          TelemtryMessages.failedToInstallFunc,
          error
      );

      throw new DepsCheckerError(
          Messages.failToInstallFuncCoreTool.replace("@NameVersion", displayFuncName),
          defaultHelpLink
      );
    }
  }

  private async doInstallPortableFunc(version: FuncVersion): Promise<void> {
    await this._logger.info(Messages.startInstallFunctionCoreTool.replace("@NameVersion", displayFuncName));
    await cpUtils.executeCommand(
      undefined,
      this._logger,
      { timeout: timeout },
      "npm",
      "install",
      "-f",
      `${funcPackageName}@${version}`,
      "--prefix",
      `${FuncToolChecker.getDefaultInstallPath()}`
    );

    await this.getFuncPSScriptPath();
  }

    // TODO: delete
  private async installFuncCoreToolsOnWindows(version: FuncVersion): Promise<void> {
    // on Windows, forced install is needed if the func command is broken.
    await cpUtils.executeCommand(
      undefined,
      this._logger,
      { timeout: timeout },
      "npm",
      "install",
      "-g",
      "-f",
      `${funcPackageName}@${version}`
    );

      // TODO: validate and delete
    // delete func.ps1 if exists to workaround the powershell execution policy issue:
    // https://github.com/npm/cli/issues/470
    const funcPSScript = await this.getFuncPSScriptPath();
    if (await fs.pathExists(funcPSScript)) {
      await this._logger.debug(`deleting func.ps1 from ${funcPSScript}`);
      await fs.remove(funcPSScript);
    }
  }

    // TODO: delete
  private async installFuncCoreToolsOnUnix(version: FuncVersion): Promise<void> {
    const result: cpUtils.ICommandResult = await cpUtils.tryExecuteCommand(
      undefined,
      this._logger,
      { timeout: timeout },
      "npm",
      "install",
      "-g",
      `${funcPackageName}@${version}`
    );

    const tryInstallfailed: boolean = result.code !== 0;
    const needAdminPermission: boolean =
      result.cmdOutputIncludingStderr.includes("permission denied");
    const command = `npm install -g ${funcPackageName}@${version} --unsafe-perm true`;

    if (tryInstallfailed && needAdminPermission && isMacOS()) {
      await cpUtils.withTimeout(
        timeout,
        cpUtils.execSudo(this._logger, command),
        "Install func timeout"
      );
    } else if (tryInstallfailed) {
      const tryInstallCommand = `npm install -g ${funcPackageName}@${version}`;
      throw new Error(
        `Failed to run "${tryInstallCommand}" command. Check output window for more details.`
      );
    }
  }

  private async getFuncPSScriptPath(): Promise<string> {
    try {
      const output = await cpUtils.executeCommand(
        undefined,
        this._logger,
        {
          shell: "cmd.exe",
        },
        "where",
        "func"
      );

      const funcPath = output.split(/\r?\n/)[0];
      const funcFolder = path.dirname(funcPath);

      return path.join(funcFolder, "func.ps1");
    } catch {
      // ignore error and regard func.ps1 as not found.
      return "";
    }
  }
}

export function getFuncToolsVersion(output: string): FuncVersion | null {
  const regex = /(?<major_version>\d+)\.(?<minor_version>\d+)\.(?<patch_version>\d+)/gm;
  const match = regex.exec(output);
  if (!match) {
    return null;
  }

  switch (match.groups?.major_version) {
    case FuncVersion.v1:
      return FuncVersion.v1;
    case FuncVersion.v2:
      return FuncVersion.v2;
    case FuncVersion.v3:
      return FuncVersion.v3;
    default:
      return null;
  }
}
