// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { LogProvider } from "@microsoft/teamsfx-api";
import { Constants, Messages } from "../constants";
import { TelemetryUtils } from "./telemetry";

export class Utils {
  public static addLogAndTelemetryWithLocalDebug(
    logProvider: LogProvider | undefined,
    message: Messages,
    messageLocal: Messages,
    isLocalDebug = false,
    properties?: { [key: string]: string },
  ) {
    if (!isLocalDebug) {
      logProvider?.info(message.log);
      TelemetryUtils.sendEvent(message.telemetry, properties);
    } else {
      logProvider?.info(messageLocal.log);
      TelemetryUtils.sendEvent(messageLocal.telemetry, properties);
    }
  }

  public static addLogAndTelemetry(logProvider: LogProvider | undefined, message: Messages) {
    logProvider?.info(message.log);
    TelemetryUtils.sendEvent(message.telemetry);
  }

  public static addLocalDebugPrefix(isLocalDebug: boolean, key: string) {
    return isLocalDebug ? Constants.localDebugPrefix + key : key;
  }
}
