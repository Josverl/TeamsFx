<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@microsoft/teamsfx-api](./teamsfx-api.md) &gt; [SystemError](./teamsfx-api.systemerror.md)

## SystemError class

Users cannot handle it by themselves.

<b>Signature:</b>

```typescript
export declare class SystemError implements FxError 
```
<b>Implements:</b> [FxError](./teamsfx-api.fxerror.md)

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(name, message, source, stack, issueLink, innerError)](./teamsfx-api.systemerror._constructor_.md) |  | Constructs a new instance of the <code>SystemError</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [innerError?](./teamsfx-api.systemerror.innererror.md) |  | any | <i>(Optional)</i> Custom error details. |
|  [issueLink?](./teamsfx-api.systemerror.issuelink.md) |  | string | <i>(Optional)</i> A github issue page where users can submit a new issue. |
|  [message](./teamsfx-api.systemerror.message.md) |  | string | Message to explain what happened and what to do next. |
|  [name](./teamsfx-api.systemerror.name.md) |  | string | Name of error. (error name, eg: Dependency not found) |
|  [source](./teamsfx-api.systemerror.source.md) |  | string | Source name of error. (plugin name, eg: tab-scaffhold-plugin) |
|  [stack?](./teamsfx-api.systemerror.stack.md) |  | string | <i>(Optional)</i> A string that describes the immediate frames of the call stack. |
|  [timestamp](./teamsfx-api.systemerror.timestamp.md) |  | Date | Time of error. |

