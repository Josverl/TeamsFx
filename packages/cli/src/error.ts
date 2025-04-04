// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

"use strict";

import {
  Question,
  IQuestion,
  QTreeNode,
  returnSystemError,
  returnUserError,
  SystemError,
  UserError,
  OptionItem,
  MultiSelectQuestion,
  SingleSelectQuestion,
  StaticOptions,
} from "@microsoft/teamsfx-api";

import * as constants from "./constants";

export function NotSupportedProjectType(): UserError {
  return returnUserError(
    new Error(`Project type not supported`),
    constants.cliSource,
    "NotSupportedProjectType"
  );
}

export function CannotDeployPlugin(pluginName: string): UserError {
  return returnUserError(
    new Error(`Cannot deploy ${pluginName} since it is not contained in the project`),
    constants.cliSource,
    "CannotDeployPlugin"
  );
}

export function NotValidOptionValue(
  question: MultiSelectQuestion | SingleSelectQuestion,
  options: StaticOptions
): UserError {
  if (options instanceof Array && options.length > 0 && typeof options[0] !== "string") {
    options = (options as OptionItem[]).map((op) => op.id);
  }
  throw NotValidInputValue(question.name, `This question only supports [${options}] options`);
}

export function NotValidInputValue(inputName: string, msg: string): UserError {
  return returnUserError(Error(`${inputName} - ${msg}`), constants.cliSource, "NotValidInputValue");
}

export function NotFoundInputedFolder(folder: string): UserError {
  return returnUserError(
    new Error(`Cannot find folder (${folder}).`),
    constants.cliSource,
    "NotFoundInputFolder"
  );
}

export function NotFoundSubscriptionId(): UserError {
  return returnUserError(
    new Error(
      "Cannot find selected subscription. Ensure your signed-in account has access to this subscription. " +
        "You can also select another subscription using 'teamsfx account set`."
    ),
    constants.cliSource,
    "NotFoundSubscriptionId"
  );
}

export function NotSupportedQuestionType(msg: IQuestion): SystemError {
  return returnSystemError(
    new Error(
      `Question.${msg.type} is not supported. The whole question is ${JSON.stringify(msg, null, 4)}`
    ),
    constants.cliSource,
    "NotSupportedQuestionType"
  );
}

export function ConfigNotFoundError(configpath: string): SystemError {
  return returnSystemError(
    new Error(`Config file ${configpath} does not exists`),
    constants.cliSource,
    "ConfigNotFound"
  );
}

export function SampleAppDownloadFailed(sampleAppUrl: string, e: Error): SystemError {
  e.message = `Cannot download this sample app from ${sampleAppUrl}. Error: ${e.message}`;
  return returnSystemError(e, constants.cliSource, "SampleAppDownloadFailed");
}

export function ReadFileError(e: Error): SystemError {
  return returnSystemError(e, constants.cliSource, "ReadFileError");
}

export function WriteFileError(e: Error): SystemError {
  return returnSystemError(e, constants.cliSource, "WriteFileError");
}

export function UnknownError(e: Error): SystemError {
  return returnSystemError(e, constants.cliSource, "UnknownError");
}

export function QTNConditionNotSupport(node: QTreeNode): SystemError {
  return returnSystemError(
    new Error(
      `The condition of the question tree node is not supported. (${JSON.stringify(
        node.condition
      )})`
    ),
    constants.cliSource,
    "QTNConditionNotSupport"
  );
}

export function QTNQuestionTypeNotSupport(data: Question): SystemError {
  return returnSystemError(
    new Error(
      `The condition of the question tree node is not supported. (${JSON.stringify(data)})`
    ),
    constants.cliSource,
    "QTNQuestionTypeNotSupport"
  );
}

export function ProjectFolderExist(path: string): UserError {
  return returnUserError(
    new Error(`Path ${path} alreay exists. Select a different folder.`),
    constants.cliSource,
    "ProjectFolderExist"
  );
}
