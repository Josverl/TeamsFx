// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

"use strict";

import * as path from "path";
import * as fs from "fs-extra";
import { ConfigFolderName, FxError, IProgressHandler, LogLevel } from "@microsoft/teamsfx-api";
import * as dotenv from "dotenv";
import * as net from "net";

import * as constants from "./constants";
import { TaskResult } from "./task";
import cliLogger from "../../commonlib/log";
import { TaskFailed } from "./errors";

export function createTaskStartCb(
  progressBar: IProgressHandler,
  message: string
): () => Promise<void> {
  return async () => {
    await progressBar.start(message);
  };
}

export function createTaskStopCb(
  taskTitle: string,
  progressBar: IProgressHandler,
  successMessage: string,
  background: boolean
): (result: TaskResult) => Promise<FxError | null> {
  return async (result: TaskResult) => {
    const success = background ? result.success : result.exitCode === 0;
    if (success) {
      await progressBar.next(successMessage);
      await progressBar.end();
      return null;
    } else {
      const error = TaskFailed(taskTitle);
      cliLogger.necessaryLog(LogLevel.Error, `${error.source}.${error.name}: ${error.message}`);
      cliLogger.necessaryLog(LogLevel.Info, result.stderr[result.stderr.length - 1], true);
      return error;
    }
  };
}

async function getLocalEnv(
  workspaceFolder: string,
  prefix = ""
): Promise<{ [key: string]: string } | undefined> {
  const localEnvFilePath: string = path.join(
    workspaceFolder,
    `.${ConfigFolderName}`,
    constants.localEnvFileName
  );
  if (!(await fs.pathExists(localEnvFilePath))) {
    return undefined;
  }

  const contents = await fs.readFile(localEnvFilePath);
  const env: dotenv.DotenvParseOutput = dotenv.parse(contents);

  const result: { [key: string]: string } = {};
  for (const key of Object.keys(env)) {
    if (key.startsWith(prefix) && env[key]) {
      result[key.slice(prefix.length)] = env[key];
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export async function getFrontendLocalEnv(
  workspaceFolder: string
): Promise<{ [key: string]: string } | undefined> {
  return getLocalEnv(workspaceFolder, constants.frontendLocalEnvPrefix);
}

export async function getBackendLocalEnv(
  workspaceFolder: string
): Promise<{ [key: string]: string } | undefined> {
  return getLocalEnv(workspaceFolder, constants.backendLocalEnvPrefix);
}

export async function getAuthLocalEnv(
  workspaceFolder: string
): Promise<{ [key: string]: string } | undefined> {
  // SERVICE_PATH will also be included, but it has no side effect
  return getLocalEnv(workspaceFolder, constants.authLocalEnvPrefix);
}

export async function getAuthServicePath(workspaceFolder: string): Promise<string | undefined> {
  const result = await getLocalEnv(workspaceFolder);
  return result ? result[constants.authServicePathEnvKey] : undefined;
}

export async function getBotLocalEnv(
  workspaceFolder: string
): Promise<{ [key: string]: string } | undefined> {
  return getLocalEnv(workspaceFolder, constants.botLocalEnvPrefix);
}

async function detectPortListeningImpl(port: number, host: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    try {
      const server = net.createServer();
      server
        .once("error", (err) => {
          if (err.message.includes("EADDRINUSE")) {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .once("listening", () => {
          server.close();
        })
        .once("close", () => {
          resolve(false);
        })
        .listen(port, host);
    } catch (err) {
      // ignore any error to not block preview
      resolve(false);
    }
  });
}

export async function detectPortListening(port: number, hosts: string[]): Promise<boolean> {
  for (const host of hosts) {
    if (await detectPortListeningImpl(port, host)) {
      return true;
    }
  }
  return false;
}

export async function getPortsInUse(
  includeFrontend: boolean,
  includeBackend: boolean,
  includeBot: boolean
): Promise<number[]> {
  const ports: [number, string[]][] = [];
  if (includeFrontend) {
    ports.push(...constants.frontendPorts);
  }
  if (includeBackend) {
    ports.push(...constants.backendPorts);
  }
  if (includeBot) {
    ports.push(...constants.botPorts);
  }

  const portsInUse: number[] = [];
  for (const port of ports) {
    if (await detectPortListening(port[0], port[1])) {
      portsInUse.push(port[0]);
    }
  }
  return portsInUse;
}

export function mergeProcessEnv(
  env: { [key: string]: string | undefined } | undefined
): { [key: string]: string | undefined } | undefined {
  if (env === undefined) {
    return process.env;
  }
  const result = Object.assign({}, process.env);
  for (const key of Object.keys(env)) {
    result[key] = env[key];
  }
  return result;
}
